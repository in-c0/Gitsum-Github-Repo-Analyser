import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { arc, pie } from "d3-shape";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { githubFileUrl } from "../lib/github";
import { PALETTE } from "../lib/palette";


const compact = (n) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ---------- icons (inline, 20px) ---------- */
const I = {
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" />,
  fork: (
    <>
      <circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="19" r="2" />
      <path d="M6 7v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7M12 12v5" />
    </>
  ),
  issue: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="1.5" /></>),
  file: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  scale: (<><path d="M12 4v16M5 20h14M6 8h12" /><path d="M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z" /></>),
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  alert: (<><path d="M12 8v5" /><circle cx="12" cy="16.5" r=".6" /></>),
};
const Icon = ({ name, className = "" }) => (
  <svg className={`ig-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {I[name]}
  </svg>
);

/* ---------- stat strip ---------- */
export function StatStrip({ repo, overview }) {
  const days = repo.pushedAt ? Math.floor((Date.now() - new Date(repo.pushedAt).getTime()) / 86_400_000) : null;
  const updated = days === null ? "–" : days < 1 ? "today" : days < 60 ? `${days}d` : days < 730 ? `${Math.round(days / 30)}mo` : `${Math.round(days / 365)}y`;
  const stats = [
    { icon: "star", label: "Stars", value: compact(repo.stars) },
    { icon: "fork", label: "Forks", value: compact(repo.forks) },
    { icon: "issue", label: "Open issues", value: compact(repo.openIssues) },
    { icon: "file", label: "Files", value: compact(overview.fileCount) },
    { icon: "clock", label: "Last push", value: updated },
    { icon: "scale", label: "License", value: repo.license || "None" },
  ];
  return (
    <ul className="ig-stats" aria-label="Repository stats">
      {stats.map((s) => (
        <li key={s.label}>
          <Icon name={s.icon} />
          <span className="ig-stat-value">{s.value}</span>
          <span className="ig-stat-label">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- language donut ---------- */
export function LanguageDonut({ languages }) {
  const [active, setActive] = useState(null);
  const size = 168;
  const r = size / 2;
  const slices = useMemo(() => {
    const total = languages.reduce((s, l) => s + l.pct, 0);
    const data = total < 99 && languages.length ? [...languages, { name: "Other", pct: 100 - total }] : languages;
    return pie().sort(null).value((d) => d.pct).padAngle(0.012)(data);
  }, [languages]);
  const shape = arc().innerRadius(r * 0.62).outerRadius(r - 2).cornerRadius(2);
  if (!languages.length) return <p className="ig-empty">No recognised languages.</p>;
  const focus = active ?? 0;
  const top = slices[focus]?.data;
  return (
    <div className="ig-donut">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={languages.map((l) => `${l.name} ${Math.round(l.pct)}%`).join(", ")}>
        <g transform={`translate(${r},${r})`}>
          {slices.map((s, i) => (
            <path
              key={s.data.name}
              d={shape(s)}
              fill={s.data.name === "Other" ? "#CBD2DC" : PALETTE[i % PALETTE.length]}
              opacity={active === null || active === i ? 1 : 0.35}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
          <text className="ig-donut-pct" textAnchor="middle" dy="0.1em">{top ? `${Math.round(top.pct)}%` : ""}</text>
          <text className="ig-donut-name" textAnchor="middle" dy="1.6em">{top?.name}</text>
        </g>
      </svg>
      <ul className="ig-legend">
        {slices.map((s, i) => (
          <li key={s.data.name} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <span className="ig-swatch" style={{ background: s.data.name === "Other" ? "#CBD2DC" : PALETTE[i % PALETTE.length] }} />
            <span className="ig-legend-name">{s.data.name}</span>
            <span className="ig-legend-val">{s.data.pct < 10 ? s.data.pct.toFixed(1) : Math.round(s.data.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- structure treemap ---------- */
export function StructureTreemap({ repo, structure }) {
  const [ref, width] = useWidth();
  const height = width < 480 ? 220 : 260;
  const leaves = useMemo(() => {
    if (!width) return [];
    const items = [...structure.dirs];
    if (structure.rootFiles) items.push({ name: "(root files)", count: structure.rootFiles, meaning: "Files at the top level", root: true });
    const root = hierarchy({ children: items }).sum((d) => d.count || 0);
    treemap().tile(treemapSquarify.ratio(1.3)).size([width, height]).paddingInner(3).round(true)(root);
    return root.leaves();
  }, [structure, width, height]);

  return (
    <div className="ig-treemap" ref={ref} style={{ height }}>
      {leaves.map((l, i) => {
        const w = l.x1 - l.x0;
        const h = l.y1 - l.y0;
        const d = l.data;
        const big = w > 90 && h > 54;
        const href = d.root ? repo.htmlUrl : `https://github.com/${repo.owner}/${repo.repo}/tree/${encodeURIComponent(repo.branch)}/${encodeURIComponent(d.name)}`;
        return (
          <a
            key={d.name}
            className="ig-tile"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ left: l.x0, top: l.y0, width: w, height: h, background: d.root ? "#7C8597" : PALETTE[i % PALETTE.length] }}
            title={`${d.name}${d.root ? "" : "/"} — ${d.count} files${d.meaning ? ` · ${d.meaning}` : ""}`}
          >
            {w > 44 && h > 22 && (
              <>
                <span className="ig-tile-name">{d.root ? d.name : `${d.name}/`}</span>
                {big && <span className="ig-tile-meta">{d.meaning || `${d.count} files`}</span>}
                {big && <span className="ig-tile-count">{d.count.toLocaleString()}</span>}
              </>
            )}
          </a>
        );
      })}
    </div>
  );
}

/* ---------- reading path (an actual sequence: the order to read files in) ---------- */
const REASON_TAG = {
  "Project overview": "Start",
  "Dependencies & scripts": "Setup",
  "Architecture notes": "Design",
  "Likely entry point": "Entry",
  "Core wiring": "Core",
  "Deployment config": "Deploy",
  "Build / tooling config": "Build",
  "Source file": "Source",
  Tests: "Tests",
  "Project docs": "Docs",
};

export function ReadingPath({ repo, keyFiles }) {
  const steps = keyFiles.slice(0, 6);
  if (!steps.length) return <p className="ig-empty">No readable source files.</p>;
  return (
    <ol className="ig-path">
      {steps.map((f, i) => {
        const name = f.path.split("/").pop();
        const dir = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/") + 1) : "";
        return (
          <li key={f.path}>
            <a href={githubFileUrl(repo, f.path)} target="_blank" rel="noopener noreferrer" className="ig-step">
              <span className="ig-step-n">{i + 1}</span>
              <span className="ig-step-tag" style={{ color: PALETTE[i % PALETTE.length] }}>{REASON_TAG[f.reason] || f.reason}</span>
              <span className="ig-step-name">{name}</span>
              {dir && <span className="ig-step-dir">{dir}</span>}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- health ring + checks ---------- */
export function HealthPanel({ health }) {
  const score = health.filter((h) => h.ok).length;
  const total = health.length;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="ig-health">
      <div className="ig-ring" role="img" aria-label={`${score} of ${total} health checks pass`}>
        <svg viewBox="0 0 84 84" width="84" height="84">
          <circle cx="42" cy="42" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            stroke={score / total >= 0.8 ? "var(--ok)" : score / total >= 0.5 ? "var(--warn)" : "var(--danger)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / total) * c} ${c}`}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <span className="ig-ring-num">
          {score}<small>/{total}</small>
        </span>
      </div>
      <ul className="ig-checks">
        {health.map((h) => (
          <li key={h.id} className={h.ok ? "is-ok" : "is-miss"}>
            <Icon name={h.ok ? "check" : "alert"} />
            <span className="ig-check-label">{h.label}</span>
            <span className="ig-check-val">{h.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StackChips({ stack }) {
  if (!stack.length) return <p className="ig-empty">No manifests recognised.</p>;
  return (
    <ul className="ig-chips">
      {stack.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}
