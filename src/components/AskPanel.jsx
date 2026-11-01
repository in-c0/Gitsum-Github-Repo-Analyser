import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";
import { githubFileUrl } from "../lib/github";
import { suggestedQuestions } from "../lib/analyze";
import { useAuth } from "../lib/authContext";
import { PRICE_LABEL } from "../lib/checkout";

const Citation = ({ repo, c }) => {
  const label = c.startLine ? `${c.path}:${c.startLine}${c.endLine && c.endLine !== c.startLine ? `–${c.endLine}` : ""}` : c.path;
  return (
    <li className="citation">
      <a className="cite-chip" href={githubFileUrl(repo, c.path, c.startLine, c.endLine)} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
      {c.note && <span className="cite-note">{c.note}</span>}
      {c.snippet && (
        <pre className="cite-snippet">
          <code>{c.snippet}</code>
        </pre>
      )}
    </li>
  );
};

const Upsell = ({ onUpgrade }) => (
  <div className="upsell">
    <p>
      <b>Want a real answer?</b> Gitsum Pro reads the code and explains it, with file and line references.
    </p>
    <button type="button" className="upsell-btn" onClick={onUpgrade}>
      Get Pro · {PRICE_LABEL}/mo
    </button>
  </div>
);

const Answer = ({ repo, msg, onUpgrade, showUpsell }) => {
  if (msg.pending) {
    return (
      <p className="answer-pending" aria-live="polite">
        <span className="pulse" aria-hidden="true" /> Reading the code…
      </p>
    );
  }
  return (
    <div className={`answer ${msg.source === "ai" ? "is-ai" : ""}`}>
      {msg.source === "ai" ? <Markdown text={msg.text} /> : <p className="answer-text">{msg.text}</p>}
      {msg.streaming && <span className="caret" aria-hidden="true" />}
      {msg.code && (
        <pre className="code-block">
          <code>{msg.code}</code>
        </pre>
      )}
      {!msg.streaming && msg.citations?.length > 0 && (
        <details className="citations-wrap" open={msg.source !== "ai"}>
          <summary>{msg.source === "ai" ? `Searched ${msg.citations.length} ${msg.citations.length === 1 ? "place" : "places"} in the code` : "Sources"}</summary>
          <ul className="citations" aria-label="Sources">
            {msg.citations.map((c, i) => (
              <Citation key={`${c.path}-${c.startLine || 0}-${i}`} repo={repo} c={c} />
            ))}
          </ul>
        </details>
      )}
      {msg.aiNote && <p className="answer-source">{msg.aiNote} Showing code search results instead.</p>}
      {msg.source === "search" && !msg.aiNote && <p className="answer-source">Found by searching the code, not written by AI.</p>}
      {showUpsell && msg.source === "search" && <Upsell onUpgrade={onUpgrade} />}
    </div>
  );
};

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const offeredKey = "gitsum:offered";
const wasOffered = () => {
  try {
    return sessionStorage.getItem(offeredKey) === "1";
  } catch {
    return false;
  }
};
const markOffered = () => {
  try {
    sessionStorage.setItem(offeredKey, "1");
  } catch {
    /* ignore */
  }
};

const AskPanel = ({ analysis, onUpgrade }) => {
  const { repo, overview, messages, asking, ask, stop } = analysis;
  const auth = useAuth();
  const [value, setValue] = useState("");
  const [view, setView] = useState("start"); // start | thread
  const [inView, setInView] = useState(true);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const aiEnabled = !!auth?.me?.aiEnabled;
  const isPro = !!auth?.isPro;
  const useAi = aiEnabled && isPro;
  const lastUsage = [...messages].reverse().find((m) => m.usage?.used)?.usage;
  const shownUsage = lastUsage || auth?.me?.usage;
  const questionCount = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    setView(messages.length ? "thread" : "start");
    // Only react to a new conversation starting or the conversation being cleared.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length === 0]);

  useEffect(() => {
    const el = listRef.current;
    if (el && view === "thread") el.scrollTop = el.scrollHeight;
  }, [messages, view]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const jumpToPanel = () => {
    panelRef.current?.scrollIntoView({ block: "start" });
    inputRef.current?.focus({ preventScroll: true });
  };

  const submit = async (text) => {
    const q = (text ?? value).trim();
    if (!q || asking) return;
    setValue("");
    setView("thread");
    if (useAi) {
      const res = await ask(q, { useAi: true, token: auth.token });
      if (res?.usage?.used) auth.refresh();
      return;
    }
    // Not a subscriber: answer from code search and offer Pro. Signed-out visitors see the offer on their first question.
    const offer = aiEnabled ? (auth?.session ? "subscription_required" : "login_required") : null;
    await ask(q, { useAi: false, upsell: offer });
    if (aiEnabled && !auth?.session && !wasOffered()) {
      markOffered();
      onUpgrade();
    }
  };

  const streaming = messages.some((m) => m.streaming);

  return (
    <>
      <aside id="ask" ref={panelRef} className="ask" aria-label={`Ask about ${repo.fullName}`}>
        <div className="ask-head">
          {view === "thread" && (
            <button type="button" className="ask-back" onClick={() => setView("start")} aria-label="Back to suggested questions">
              <BackIcon />
              <span>Back</span>
            </button>
          )}
          <h2 className="ask-title">{view === "thread" ? "Conversation" : "Ask about this repo"}</h2>
          <span className={`ask-mode ${useAi ? "is-ai" : ""}`}>{useAi ? "AI" : "Code search"}</span>
        </div>

        <div className="ask-thread" ref={listRef}>
          {view === "start" ? (
            <div className="ask-start">
              <ul className="suggestions">
                {suggestedQuestions(overview).map((q) => (
                  <li key={q}>
                    <button type="button" className="suggestion" onClick={() => submit(q)}>
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
              {questionCount > 0 && (
                <button type="button" className="ask-resume" onClick={() => setView("thread")}>
                  Return to conversation ({questionCount})
                </button>
              )}
              {aiEnabled && !isPro && (
                <div className="ask-promo">
                  <span className="ask-promo-badge">Pro</span>
                  <p>AI answers that read the code and cite file and line.</p>
                  <button type="button" className="upsell-btn" onClick={onUpgrade}>
                    {PRICE_LABEL}/mo
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <p key={m.id} className="question">
                  {m.text}
                </p>
              ) : (
                <Answer key={m.id} repo={repo} msg={m} onUpgrade={onUpgrade} showUpsell={aiEnabled && !isPro && !!m.upsell} />
              )
            )
          )}
        </div>

        {useAi && shownUsage?.limit ? (
          <p className="ask-usage">
            {shownUsage.used.toLocaleString()} / {shownUsage.limit.toLocaleString()} AI answers this month
          </p>
        ) : null}

        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="ask-input" className="sr-only">
            Your question
          </label>
          <textarea
            id="ask-input"
            ref={inputRef}
            className="ask-input"
            rows={1}
            placeholder={useAi ? "Ask anything about this code" : "Where is auth handled?"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
          />
          {streaming ? (
            <button type="button" className="ask-submit" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" className="ask-submit" disabled={asking || !value.trim()}>
              Ask
            </button>
          )}
        </form>
      </aside>
      {!inView && (
        <button type="button" className="ask-jump" onClick={jumpToPanel}>
          Ask about this repo
        </button>
      )}
    </>
  );
};

export default AskPanel;
