// AI answers from /api/chat (Gitsum Pro). Non-subscribers keep the free code-search answers in ./analyze.js.

const FIRST_BYTE_TIMEOUT_MS = 25_000;

export class ChatError extends Error {
  /** code: login_required | subscription_required | rate_limited | quota_exceeded | capacity | not_configured | network | model */
  constructor(code, message) {
    super(message);
    this.name = "ChatError";
    this.code = code;
  }
}

async function errorFrom(res) {
  let code = "model";
  let message = `The AI server returned an error (${res.status}).`;
  try {
    const body = await res.json();
    if (body?.error?.code) code = body.error.code;
    if (body?.error?.message) message = body.error.message;
  } catch {
    if (res.status === 404) {
      code = "not_configured";
      message = "AI chat isn't available on this site yet.";
    }
  }
  return new ChatError(code, message);
}

/**
 * Streams an answer. Calls onText(chunk) as text arrives; resolves with { used, limit } when done.
 * Throws ChatError with a code the UI can act on.
 */
export async function streamChat({ token, payload, onText, signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  const timer = setTimeout(abort, FIRST_BYTE_TIMEOUT_MS);

  let res;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (signal?.aborted) throw err;
    throw new ChatError("network", "Couldn't reach the AI. Check your connection and try again.");
  }
  clearTimeout(timer);

  try {
    if (!res.ok) throw await errorFrom(res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let meta = {};
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
        if (/^event:\s*error/m.test(block)) {
          let msg = data;
          try {
            msg = JSON.parse(data);
          } catch {
            /* plain text */
          }
          throw new ChatError("model", String(msg));
        }
        if (data === "[DONE]") return meta;
        try {
          const obj = JSON.parse(data);
          if (obj.text) onText(obj.text);
          if (obj.done) meta = { used: obj.used, limit: obj.limit };
        } catch {
          onText(data);
        }
      }
    }
    return meta;
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}

/** Turns `path:12-30` / `path` citations in an AI answer into GitHub links (markdown in, markdown out). */
export function linkifyCitations(markdown, knownPaths, toUrl) {
  const known = new Set(knownPaths);
  return markdown.replace(/`([^`\s]+?)(?::(\d+)(?:[-–](\d+))?)?`/g, (whole, path, a, b) => {
    if (!known.has(path)) return whole;
    const label = a ? `${path}:${a}${b ? `-${b}` : ""}` : path;
    return `[\`${label}\`](${toUrl(path, a ? Number(a) : undefined, b ? Number(b) : undefined)})`;
  });
}
