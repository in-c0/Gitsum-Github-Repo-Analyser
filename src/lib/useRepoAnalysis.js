import { useCallback, useEffect, useRef, useState } from "react";
import { GitsumError, loadRepo } from "./github";
import { answerLocally, buildOverview, buildSearchIndex } from "./analyze";
import { AiUnavailableError, streamRepoAnswer, streamRepoSummary } from "./ai";

// Session-wide memory of whether the AI backend works, so a broken backend costs one request, not one per action.
const aiState = { summary: "unknown", ask: "unknown" };

let messageId = 0;
const nextId = () => ++messageId;

/**
 * Core flow: paste → load (GitHub, no token) → overview (instant, local) → AI summary (optional, streamed) → Q&A.
 * status: idle | loading | ready | error
 */
export function useRepoAnalysis() {
  const [status, setStatus] = useState("idle");
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);
  const [repo, setRepo] = useState(null);
  const [overview, setOverview] = useState(null);
  const [ai, setAi] = useState({ status: "idle", text: "", note: "" });
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);

  const runRef = useRef(null);
  const indexRef = useRef(null);

  const reset = useCallback(() => {
    runRef.current?.abort();
    runRef.current = null;
    indexRef.current = null;
    setStatus("idle");
    setStep(null);
    setError(null);
    setRepo(null);
    setOverview(null);
    setAi({ status: "idle", text: "", note: "" });
    setMessages([]);
    setAsking(false);
  }, []);

  useEffect(() => () => runRef.current?.abort(), []);

  const analyse = useCallback(async ({ owner, repo: name }) => {
    runRef.current?.abort();
    const run = new AbortController();
    runRef.current = run;
    const { signal } = run;

    indexRef.current = null;
    setStatus("loading");
    setError(null);
    setRepo(null);
    setOverview(null);
    setMessages([]);
    setAi({ status: "idle", text: "", note: "" });
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

      // Search index for Q&A builds in the background.
      indexRef.current = buildSearchIndex(data, ov, { signal }).catch(() => null);

      // AI summary is optional and streamed.
      if (aiState.summary === "down") {
        setAi({ status: "unavailable", text: "", note: aiState.summaryNote || "" });
        return;
      }
      setAi({ status: "streaming", text: "", note: "" });
      let acc = "";
      try {
        await streamRepoSummary(data, (chunk) => {
          acc += chunk;
          setAi({ status: "streaming", text: acc, note: "" });
        }, signal);
        if (signal.aborted) return;
        aiState.summary = "up";
        setAi({ status: acc.trim() ? "done" : "unavailable", text: acc, note: acc.trim() ? "" : "The AI server returned an empty summary." });
      } catch (err) {
        if (signal.aborted) return;
        const note = err instanceof AiUnavailableError ? err.message : "The AI server didn't respond.";
        if (err?.detail) console.warn("[gitsum] AI summary unavailable:", err.detail);
        aiState.summary = "down";
        aiState.summaryNote = note;
        setAi({ status: "unavailable", text: acc, note });
      }
    } catch (err) {
      if (signal.aborted || err?.name === "AbortError") return;
      setStatus("error");
      setStep(null);
      setError(
        err instanceof GitsumError
          ? { code: err.code, message: err.message, hint: err.hint }
          : { code: "unknown", message: "Something went wrong while reading the repository.", hint: "Try again in a moment." }
      );
      console.error("[gitsum]", err);
    }
  }, []);

  const ask = useCallback(
    async (question) => {
      const q = question.trim();
      if (!q || !repo || !overview || asking) return;
      const signal = runRef.current?.signal;
      const userMsg = { id: nextId(), role: "user", text: q };
      const botId = nextId();
      setMessages((m) => [...m, userMsg, { id: botId, role: "assistant", pending: true, text: "", citations: [] }]);
      setAsking(true);

      const update = (patch) => setMessages((m) => m.map((msg) => (msg.id === botId ? { ...msg, ...patch } : msg)));

      try {
        const index = (await indexRef.current) || (await buildSearchIndex(repo, overview, { signal }));
        const local = answerLocally(q, repo, overview, index);

        if (aiState.ask !== "down") {
          let acc = "";
          try {
            const context = local.citations.filter((c) => c.snippet).map((c) => ({ path: c.path, startLine: c.startLine, snippet: c.snippet }));
            await streamRepoAnswer(repo, q, context, (chunk) => {
              acc += chunk;
              update({ pending: false, text: acc, citations: local.citations.map((c) => ({ path: c.path, startLine: c.startLine, endLine: c.endLine, note: c.note })), source: "ai" });
            }, signal);
            if (acc.trim()) {
              aiState.ask = "up";
              update({ pending: false, text: acc, source: "ai" });
              return;
            }
          } catch (err) {
            if (signal?.aborted) return;
            if (err?.detail) console.warn("[gitsum] AI answers unavailable:", err.detail);
            aiState.ask = "down";
          }
        }
        update({ pending: false, ...local, source: "search" });
      } catch (err) {
        if (signal?.aborted) return;
        update({ pending: false, text: "Couldn't search the code right now. Try again.", citations: [], source: "error" });
        console.error("[gitsum]", err);
      } finally {
        setAsking(false);
      }
    },
    [repo, overview, asking]
  );

  return { status, step, error, repo, overview, ai, messages, asking, analyse, ask, reset };
}
