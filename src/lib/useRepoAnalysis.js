import { useCallback, useEffect, useRef, useState } from "react";
import { GitsumError, githubFileUrl, loadRepo } from "./github";
import { answerLocally, buildOverview, buildSearchIndex } from "./analyze";
import { ChatError, linkifyCitations, streamChat } from "./ai";

let messageId = 0;
const nextId = () => ++messageId;

/**
 * Core flow: paste → load (GitHub, no token) → overview (instant, local) → Q&A.
 * Q&A: Gitsum Pro subscribers get streamed AI answers; everyone else gets code-search answers,
 * and a ChatError (login_required / subscription_required) tells the UI to offer the subscription.
 * status: idle | loading | ready | error
 */
export function useRepoAnalysis() {
  const [status, setStatus] = useState("idle");
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const [repo, setRepo] = useState(null);
  const [overview, setOverview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);

  const runRef = useRef(null);
  const indexRef = useRef(null);
  const chatAbortRef = useRef(null);

  const reset = useCallback(() => {
    runRef.current?.abort();
    chatAbortRef.current?.abort();
    runRef.current = null;
    indexRef.current = null;
    setStatus("idle");
    setStep(null);
    setError(null);
    setRepo(null);
    setOverview(null);
    setMessages([]);
    setAsking(false);
  }, []);

  useEffect(() => () => {
    runRef.current?.abort();
    chatAbortRef.current?.abort();
  }, []);

  const analyse = useCallback(async ({ owner, repo: name }) => {
    runRef.current?.abort();
    chatAbortRef.current?.abort();
    const run = new AbortController();
    runRef.current = run;
    const { signal } = run;

    indexRef.current = null;
    setStatus("loading");
    setError(null);
    setRepo(null);
    setOverview(null);
    setMessages([]);
    setAsking(false);
    setStep("Reading repository");

    try {
      const data = await loadRepo(owner, name, { signal });
      if (signal.aborted) return;
      setRepo(data);
      setStep("Ranking key files");
      const ov = await buildOverview(data, { signal });
      if (signal.aborted) return;
      setOverview(ov);
      setStatus("ready");
      setStep(null);
      indexRef.current = buildSearchIndex(data, ov, { signal }).catch(() => null);
    } catch (err) {
      if (signal.aborted || err?.name === "AbortError") return;
      setStatus("error");
      setStep(null);
      setError(
        err instanceof GitsumError
          ? { code: err.code, message: err.message, hint: err.hint }
          : { code: "unknown", message: "Something went wrong while reading the repository.", hint: "Try again in a moment." }
      );
      if (err instanceof GitsumError) console.info("[gitsum]", err.code, err.message);
      else console.error("[gitsum]", err);
    }
  }, []);

  /**
   * ask(question, { useAi, token })
   * useAi: the caller is a subscriber and AI is configured → stream from /api/chat.
   * Otherwise answers from code search and marks the answer with `upsell` so the UI can offer Pro.
   */
  const ask = useCallback(
    async (question, { useAi = false, token = null, upsell = null } = {}) => {
      const q = question.trim();
      if (!q || !repo || !overview || asking) return;
      const runSignal = runRef.current?.signal;
      const chatCtl = new AbortController();
      chatAbortRef.current = chatCtl;
      runSignal?.addEventListener("abort", () => chatCtl.abort());
      const signal = chatCtl.signal;

      const history = messages.filter((m) => !m.pending && m.source !== "error").map((m) => ({ role: m.role, text: m.text }));
      const userMsg = { id: nextId(), role: "user", text: q };
      const botId = nextId();
      setMessages((m) => [...m, userMsg, { id: botId, role: "assistant", pending: true, text: "", citations: [] }]);
      setAsking(true);

      const update = (patch) => setMessages((m) => m.map((msg) => (msg.id === botId ? { ...msg, ...patch } : msg)));

      try {
        const index = (await indexRef.current) || (await buildSearchIndex(repo, overview, { signal }));
        const local = answerLocally(q, repo, overview, index);
        const sourceCitations = local.citations.map((c) => ({ path: c.path, startLine: c.startLine, endLine: c.endLine, note: c.note }));

        if (useAi) {
          const payload = {
            owner: repo.owner,
            repo: repo.repo,
            branch: repo.branch,
            question: q,
            history,
            snippets: local.citations.filter((c) => c.snippet).map((c) => ({ path: c.path, startLine: c.startLine, endLine: c.endLine, snippet: c.snippet })),
            overview: {
              description: overview.oneLiner,
              stack: overview.stack,
              languages: overview.languages,
              keyFiles: overview.keyFiles.map((f) => ({ path: f.path, reason: f.reason })),
              dirs: overview.structure.dirs,
              readme: overview.readme ? overview.readme.slice(0, 9000) : "",
              readmePath: overview.readmePath,
            },
          };
          const paths = repo.files.map((f) => f.path);
          const toUrl = (p, a, b) => githubFileUrl(repo, p, a, b);
          let acc = "";
          try {
            const meta = await streamChat({
              token,
              payload,
              signal,
              onText: (chunk) => {
                acc += chunk;
                update({ pending: false, streaming: true, text: linkifyCitations(acc, paths, toUrl), citations: sourceCitations, source: "ai" });
              },
            });
            update({ pending: false, streaming: false, text: linkifyCitations(acc, paths, toUrl), citations: sourceCitations, source: "ai", usage: meta });
            return { ok: true, usage: meta };
          } catch (err) {
            if (signal.aborted) {
              update({ pending: false, streaming: false, stopped: true, text: linkifyCitations(acc, paths, toUrl) || "Stopped.", source: acc ? "ai" : "error" });
              return { ok: false };
            }
            if (err instanceof ChatError && ["login_required", "subscription_required"].includes(err.code)) {
              update({ pending: false, ...local, source: "search", upsell: err.code });
              return { ok: false, code: err.code };
            }
            const note = err instanceof ChatError ? err.message : "The AI couldn't answer this time.";
            update({ pending: false, streaming: false, ...local, source: "search", aiNote: acc ? null : note });
            return { ok: false, code: err?.code || "model" };
          }
        }

        update({ pending: false, ...local, source: "search", upsell });
        return { ok: true };
      } catch (err) {
        if (signal.aborted) return { ok: false };
        update({ pending: false, text: "Couldn't search the code right now. Try again.", citations: [], source: "error" });
        console.error("[gitsum]", err);
        return { ok: false };
      } finally {
        setAsking(false);
      }
    },
    [repo, overview, asking, messages]
  );

  const stop = useCallback(() => chatAbortRef.current?.abort(), []);

  return { status, step, error, repo, overview, messages, asking, analyse, ask, stop, reset };
}
