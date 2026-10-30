// Talks to GitHub directly from the browser. No token required:
// - repo metadata + file tree come from the public REST API (60 req/h per visitor IP, 2 calls per repo)
// - file contents come from raw.githubusercontent.com, which does not count against that limit

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";
const CACHE_TTL_MS = 10 * 60 * 1000;
const memoryCache = new Map();

export class GitsumError extends Error {
  constructor(code, message, hint) {
    super(message);
    this.name = "GitsumError";
    this.code = code;
    this.hint = hint;
  }
}

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * Accepts every common way people paste a repo:
 * https://github.com/o/r, github.com/o/r/tree/main/src, o/r, git@github.com:o/r.git, https://github.com/o/r.git
 * Returns { owner, repo } or null.
 */
export function parseRepoInput(input) {
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;

  s = s.replace(/^git\+/, "");
  const ssh = s.match(/^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  let owner;
  let repo;
  if (ssh) {
    [, owner, repo] = ssh;
  } else {
    s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    if (/^github\.com\//i.test(s)) s = s.slice("github.com/".length);
    else if (s.includes(".") && s.split("/")[0].includes(".")) return null; // some other host
    s = s.split(/[?#]/)[0];
    const parts = s.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    [owner, repo] = parts;
    repo = repo.replace(/\.git$/i, "");
  }
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo };
}

function readCache(key) {
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.v;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t < CACHE_TTL_MS) {
      memoryCache.set(key, parsed);
      return parsed.v;
    }
  } catch {
    /* storage unavailable or full: memory cache only */
  }
  return null;
}

function writeCache(key, v) {
  const entry = { t: Date.now(), v };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
}

function formatReset(epochSeconds) {
  if (!epochSeconds) return null;
  const mins = Math.max(1, Math.ceil((epochSeconds * 1000 - Date.now()) / 60000));
  return mins;
}

async function apiGet(path, { signal } = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      signal,
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new GitsumError("network", "Couldn't reach GitHub.", "Check your connection and try again.");
  }
  if (res.ok) return res.json();

  const remaining = res.headers.get("x-ratelimit-remaining");
  if ((res.status === 403 || res.status === 429) && (remaining === "0" || res.status === 429)) {
    const mins = formatReset(Number(res.headers.get("x-ratelimit-reset")));
    throw new GitsumError(
      "rate_limited",
      "GitHub's hourly limit for anonymous requests was reached.",
      mins ? `It resets in about ${mins} min. Repositories you already opened still work.` : "Try again in a little while."
    );
  }
  if (res.status === 404) {
    throw new GitsumError("not_found", "Repository not found.", "It may be private, renamed, or misspelled. Only public repositories are supported.");
  }
  if (res.status === 409) {
    throw new GitsumError("empty", "This repository is empty.", "There are no commits to analyse yet.");
  }
  if (res.status === 451 || res.status === 403) {
    throw new GitsumError("blocked", "GitHub refused access to this repository.", "It may be disabled or restricted.");
  }
  throw new GitsumError("github_error", `GitHub returned an error (${res.status}).`, "Try again in a moment.");
}

/** Repo metadata + full file tree. Two API calls, cached for 10 minutes. */
export async function loadRepo(owner, repo, { signal } = {}) {
  const key = `gitsum:repo:${owner}/${repo}`.toLowerCase();
  const cached = readCache(key);
  if (cached) return cached;

  const meta = await apiGet(`/repos/${owner}/${repo}`, { signal });
  const branch = meta.default_branch || "main";
  const treeRes = await apiGet(`/repos/${meta.owner.login}/${meta.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { signal });

  const files = (treeRes.tree || [])
    .filter((n) => n.type === "blob")
    .map((n) => ({ path: n.path, size: n.size || 0 }));

  const result = {
    owner: meta.owner.login,
    repo: meta.name,
    fullName: meta.full_name,
    branch,
    description: meta.description || "",
    homepage: meta.homepage || "",
    stars: meta.stargazers_count || 0,
    forks: meta.forks_count || 0,
    openIssues: meta.open_issues_count || 0,
    license: meta.license?.spdx_id && meta.license.spdx_id !== "NOASSERTION" ? meta.license.spdx_id : meta.license?.name || "",
    topics: meta.topics || [],
    pushedAt: meta.pushed_at,
    archived: !!meta.archived,
    fork: !!meta.fork,
    htmlUrl: meta.html_url,
    truncated: !!treeRes.truncated,
    files,
  };
  writeCache(key, result);
  return result;
}

const rawCache = new Map();

/** Raw text of one file from raw.githubusercontent.com (not rate-limited like the API). */
export async function fetchRawFile({ owner, repo, branch }, path, { signal, maxBytes = 400_000 } = {}) {
  const key = `${owner}/${repo}@${branch}:${path}`;
  if (rawCache.has(key)) return rawCache.get(key);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const promise = (async () => {
    let res;
    try {
      res = await fetch(`${RAW}/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`, { signal });
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw new GitsumError("network", `Couldn't load ${path}.`, "Check your connection and try again.");
    }
    if (!res.ok) throw new GitsumError("file_error", `Couldn't load ${path} (${res.status}).`);
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  })();
  rawCache.set(key, promise);
  promise.catch(() => rawCache.delete(key));
  return promise;
}

export function githubFileUrl({ owner, repo, branch }, path, startLine, endLine) {
  const lines = startLine ? `#L${startLine}${endLine && endLine !== startLine ? `-L${endLine}` : ""}` : "";
  return `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(branch)}/${path.split("/").map(encodeURIComponent).join("/")}${lines}`;
}
