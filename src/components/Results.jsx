import { useState } from "react";
import RepoInput from "./RepoInput";
import AskPanel from "./AskPanel";
import Markdown from "./Markdown";
import { githubFileUrl } from "../lib/github";

const STEPS = ["Reading repository", "Ranking key files"];

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "run", label: "Run it" },
  { id: "key-files", label: "Key files" },
  { id: "stack", label: "Stack" },
  { id: "structure", label: "Structure" },
];

const LANG_COLORS = ["#2C44D4", "#1F9D74", "#E0A100", "#C2417C", "#6B7280", "#7C5CD6"];

function timeAgo(iso) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 45) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 18) return `${months} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));

function toMarkdown(repo, overview, ai) {
  const lines = [`# ${repo.fullName}`, "", overview.oneLiner || "", ""];
  if (ai.status === "done" && ai.text) lines.push("## Summary", "", ai.text.trim(), "");
  if (overview.run) lines.push("## Run it", "", "```sh", overview.run.code, "```", "");
  if (overview.keyFiles.length) lines.push("## Key files", "", ...overview.keyFiles.map((f) => `- \`${f.path}\` — ${f.reason}`), "");
  if (overview.stack.length) lines.push("## Stack", "", overview.stack.join(", "), "");
  if (overview.structure.dirs.length) lines.push("## Structure", "", ...overview.structure.dirs.map((d) => `- \`${d.name}/\` — ${d.meaning || `${d.count} files`}`), "");
  lines.push(`Source: ${repo.htmlUrl}`);
  return lines.join("\n");
}

const Progress = ({ step }) => {
  const active = Math.max(0, STEPS.indexOf(step));
  return (
    <ol className="progress" aria-live="polite">
      {STEPS.map((s, i) => (
        <li key={s} className={i < active ? "is-done" : i === active ? "is-active" : ""}>
          <span className="progress-dot" aria-hidden="true" />
          {s}
        </li>
      ))}
    </ol>
  );
};

const ErrorState = ({ error, onRetry, onOpen }) => (
  <div className="error-state" role="alert">
    <h2>{error.message}</h2>
    {error.hint && <p>{error.hint}</p>}
    <div className="error-actions">
      {error.code !== "not_found" && error.code !== "empty" && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
    <div className="error-input">
      <RepoInput onSubmit={onOpen} compact />
    </div>
  </div>
);

const Section = ({ id, title, children }) => (
  <section id={id} className="section" aria-labelledby={`${id}-h`}>
    <h2 id={`${id}-h`} className="section-title">
      {title}
    </h2>
    {children}
  </section>
);

const Results = ({ analysis, onOpen, onRetry }) => {
  const { status, step, error, repo, overview, ai } = analysis;
  const [copied, setCopied] = useState(false);

  if (status === "error") return <ErrorState error={error} onRetry={onRetry} onOpen={onOpen} />;

  if (!repo || !overview) {
    return (
      <div className="loading-state">
        <Progress step={step} />
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(repo, overview, ai));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="results">
      <div className="repo-bar">
        <div className="repo-id">
          <h1 className="repo-name">
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
              <span className="repo-owner">{repo.owner}/</span>
              {repo.repo}
            </a>
          </h1>
          <p className="repo-meta">
            <span>{compact(repo.stars)} stars</span>
            {repo.license && <span>{repo.license}</span>}
            {repo.pushedAt && <span>Updated {timeAgo(repo.pushedAt)}</span>}
            <span>{overview.fileCount.toLocaleString()} files</span>
            {repo.archived && <span className="tag-warn">Archived</span>}
          </p>
        </div>
        <div className="repo-actions">
          <RepoInput key={repo.fullName} onSubmit={onOpen} compact />
          <button type="button" className="btn-secondary" onClick={copy}>
            {copied ? "Copied" : "Copy as Markdown"}
          </button>
        </div>
      </div>

      <div className="layout">
        <nav className="toc" aria-label="Sections">
          {SECTIONS.filter((s) => s.id !== "run" || overview.run).map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>

        <main className="content">
          <Section id="overview" title="Overview">
            {overview.oneLiner ? <p className="lede">{overview.oneLiner}</p> : <p className="muted">No description or README introduction found.</p>}
            {overview.intro && <p className="body-text">{overview.intro}</p>}

            {ai.status === "streaming" && !ai.text && (
              <p className="ai-note" aria-live="polite">
                <span className="pulse" aria-hidden="true" /> Writing an AI summary…
              </p>
            )}
            {ai.text && (
              <div className="ai-summary" aria-live="polite">
                <Markdown text={ai.text} />
              </div>
            )}
            {ai.status === "unavailable" && (
              <p className="ai-note">
                AI summary is unavailable right now{ai.note ? ` — ${ai.note.replace(/\.$/, "")}` : ""}. Everything on this page comes straight from the repository files.
              </p>
            )}
            {repo.truncated && <p className="ai-note">This repository is very large, so GitHub returned a partial file list. Rankings cover the files it returned.</p>}
          </Section>

          {overview.run && (
            <Section id="run" title="Run it">
              <pre className="code-block">
                <code>{overview.run.code}</code>
              </pre>
              <p className="source-line">From {overview.run.source}</p>
            </Section>
          )}

          <Section id="key-files" title="Key files">
            {overview.keyFiles.length ? (
              <ul className="file-list">
                {overview.keyFiles.map((f) => (
                  <li key={f.path}>
                    <a className="file-path" href={githubFileUrl(repo, f.path)} target="_blank" rel="noopener noreferrer">
                      {f.path}
                    </a>
                    <span className="file-reason">{f.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No readable source files found.</p>
            )}
          </Section>

          <Section id="stack" title="Stack">
            {overview.stack.length > 0 && (
              <ul className="stack-list">
                {overview.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
            {overview.languages.length > 0 ? (
              <>
                <div className="lang-bar" role="img" aria-label={overview.languages.map((l) => `${l.name} ${Math.round(l.pct)}%`).join(", ")}>
                  {overview.languages.map((l, i) => (
                    <span key={l.name} style={{ width: `${l.pct}%`, background: LANG_COLORS[i % LANG_COLORS.length] }} />
                  ))}
                </div>
                <ul className="lang-legend">
                  {overview.languages.map((l, i) => (
                    <li key={l.name}>
                      <span className="swatch" style={{ background: LANG_COLORS[i % LANG_COLORS.length] }} aria-hidden="true" />
                      {l.name} <span className="muted">{l.pct < 10 ? l.pct.toFixed(1) : Math.round(l.pct)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              !overview.stack.length && <p className="muted">No recognised languages or manifests.</p>
            )}
          </Section>

          <Section id="structure" title="Structure">
            {overview.structure.dirs.length ? (
              <ul className="dir-list">
                {overview.structure.dirs.map((d) => (
                  <li key={d.name}>
                    <a className="file-path" href={`https://github.com/${repo.owner}/${repo.repo}/tree/${encodeURIComponent(repo.branch)}/${encodeURIComponent(d.name)}`} target="_blank" rel="noopener noreferrer">
                      {d.name}/
                    </a>
                    <span className="file-reason">{d.meaning || "—"}</span>
                    <span className="dir-count">{d.count.toLocaleString()} files</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">All {overview.structure.rootFiles} files live at the top level.</p>
            )}
          </Section>
        </main>

        <AskPanel analysis={analysis} />
      </div>
    </div>
  );
};

export default Results;
