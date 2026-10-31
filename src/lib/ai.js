// Optional AI layer served by the backend (vercel.json rewrites /api/* to it).
// Everything here is best-effort: when the backend is down or misconfigured the app
// keeps working on the deterministic analysis in ./analyze.js.

const FIRST_BYTE_TIMEOUT_MS = 20_000;

export class AiUnavailableError extends Error {
  constructor(reason, detail) {
    super(reason);
    this.name = "AiUnavailableError";
    this.detail = detail;
  }
}

async function describeFailure(res) {
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* ignore */
  }
  let message = "";
  try {
    const json = JSON.parse(body);
    message = json.error?.message || json.error || json.message || "";
  } catch {
    message = "";
  }
  if (/FUNCTION_INVOCATION_FAILED/.test(body)) {
    return new AiUnavailableError("The AI server crashed while handling the request.", "Backend function failed (FUNCTION_INVOCATION_FAILED) — usually a missing or expired API key/token in its environment.");
  }
  if (res.status === 404) return new AiUnavailableError("The AI server doesn't support this yet.", `${res.url} returned 404`);
  if (res.status === 401 || res.status === 403) return new AiUnavailableError("The AI server isn't authorised to call GitHub or the model.", message || `HTTP ${res.status}`);
  if (res.status === 429) return new AiUnavailableError("The AI server is rate-limited right now.", message || "HTTP 429");
  return new AiUnavailableError(typeof message === "string" && message ? message : `The AI server returned an error (${res.status}).`, body.slice(0, 200));
}

function extractText(data) {
  if (data === "[DONE]") return null;
  try {
    const json = JSON.parse(data);
    if (typeof json === "string") return json;
    return json.content ?? json.text ?? json.delta ?? json.choices?.[0]?.delta?.content ?? "";
  } catch {
    return data;
  }
}

/**
 * Streams Server-Sent Events from `url` and calls onText(chunk) for every data payload.
 * Resolves when the stream ends or "[DONE]" arrives. Throws AiUnavailableError on failure.
 */
export async function streamSSE(url, { init, onText, signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  const timer = setTimeout(abort, FIRST_BYTE_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, { ...init, signal: controller.signal, headers: { Accept: "text/event-stream", ...(init?.headers || {}) } });
  } catch (err) {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (signal?.aborted) throw err;
    throw new AiUnavailableError("The AI server didn't respond.", String(err?.message || err));
  }
  clearTimeout(timer);

  try {
    if (!res.ok) throw await describeFailure(res);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("event-stream")) {
      // Non-streaming JSON fallback: { summary } / { answer } / { text }
      const text = await res.text();
      let out = text;
      try {
        const json = JSON.parse(text);
        out = json.summary ?? json.answer ?? json.text ?? json.content ?? text;
      } catch {
        /* plain text */
      }
      if (out) onText(String(out));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, "");
        const data = block
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).replace(/^ /, ""))
          .join("\n");
        if (!data) continue;
        if (/^event:\s*error/m.test(block)) throw new AiUnavailableError(extractText(data) || "The AI server reported an error.");
        const text = extractText(data);
        if (text === null) return;
        if (text) onText(text);
      }
    }
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

export function streamRepoSummary({ owner, repo }, onText, signal) {
  return streamSSE(`/api/github/summary?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, { onText, signal });
}

/**
 * Proposed backend contract (not implemented in the backend yet):
 * POST /api/github/ask { owner, repo, question, context: [{ path, snippet }] } → SSE text stream.
 * Until it exists, the 404 makes the UI fall back to code search.
 */
export function streamRepoAnswer({ owner, repo }, question, context, onText, signal) {
  return streamSSE("/api/github/ask", {
    init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner, repo, question, context }) },
    onText,
    signal,
  });
}
