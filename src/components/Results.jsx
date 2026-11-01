import { useState } from "react";
import RepoInput from "./RepoInput";
import AskPanel from "./AskPanel";
import { HealthPanel, LanguageDonut, ReadingPath, StackChips, StatStrip, StructureTreemap } from "./Infographic";

const STEPS = ["Reading repository", "Ranking key files"];

function toMarkdown(repo, overview) {
  const lines = [`# ${repo.fullName}`, "", overview.oneLiner || "", ""];
  if (overview.run) lines.push("## Run it", "", "```sh", overview.run.code, "```", "");
  if (overview.keyFiles.length) lines.push("## Reading path", "", ...overview.keyFiles.slice(0, 6).map((f, i) => `${i + 1}. \`${f.path}\` — ${f.reason}`), "");
  if (overview.languages.length) lines.push("## Languages", "", overview.languages.map((l) => `${l.name} ${Math.round(l.pct)}%`).join(" · "), "");
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

const Card = ({ id, title, wide, children, aside }) => (
  <section id={id} className={`ig-card ${wide ? "is-wide" : ""}`} aria-labelledby={`${id}-h`}>
    <header className="ig-card-head">
      <h2 id={`${id}-h`}>{title}</h2>
      {aside}
    </header>
    {children}
  </section>
);

const Results = ({ analysis, onOpen, onRetry, onUpgrade }) => {
  const { status, step, error, repo, overview } = analysis;
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
      await navigator.clipboard.writeText(toMarkdown(repo, overview));
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
          {overview.oneLiner && <p className="repo-oneliner">{overview.oneLiner}</p>}
        </div>
        <div className="repo-actions">
          <RepoInput key={repo.fullName} onSubmit={onOpen} compact />
          <button type="button" className="btn-secondary" onClick={copy}>
            {copied ? "Copied" : "Copy as Markdown"}
          </button>
        </div>
      </div>

      <StatStrip repo={repo} overview={overview} />

      <div className="layout">
        <main className="ig-grid">
          <Card id="path" title="Where to start reading" wide>
            <ReadingPath repo={repo} keyFiles={overview.keyFiles} />
          </Card>

          <Card id="structure" title="Structure" wide aside={<span className="ig-card-note">Tile size = number of files</span>}>
            {overview.structure.dirs.length || overview.structure.rootFiles ? (
              <StructureTreemap repo={repo} structure={overview.structure} />
            ) : (
              <p className="ig-empty">No folders.</p>
            )}
          </Card>

          <Card id="languages" title="Languages">
            <LanguageDonut languages={overview.languages} />
          </Card>

          <Card id="health" title="Project health">
            <HealthPanel health={overview.health} />
          </Card>

          <Card id="stack" title="Stack">
            <StackChips stack={overview.stack} />
          </Card>

          {overview.run && (
            <Card id="run" title="Run it">
              <pre className="code-block terminal">
                <code>{overview.run.code}</code>
              </pre>
              <p className="ig-card-note">From {overview.run.source}</p>
            </Card>
          )}

          {repo.truncated && <p className="ig-note">This repository is very large, so GitHub returned a partial file list. The charts cover the files it returned.</p>}
        </main>

        <AskPanel analysis={analysis} onUpgrade={onUpgrade} />
      </div>
    </div>
  );
};

export default Results;
