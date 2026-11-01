import { useCallback, useEffect, useState } from "react";
import "preline/preline";
import "./App.css";

import ErrorBoundary from "./components/ErrorBoundary";
import RepoInput from "./components/RepoInput";
import Results from "./components/Results";
import Paywall from "./components/Paywall";
import { takeCheckoutIntent } from "./lib/checkout";
import AccountMenu from "./components/AccountMenu";
import { useAuth } from "./lib/authContext";
import { parseRepoInput } from "./lib/github";
import { useRepoAnalysis } from "./lib/useRepoAnalysis";

const EXAMPLES = ["sindresorhus/is", "pallets/flask", "fastapi/fastapi", "vitejs/vite"];

// /owner/repo (the "swap github.com for this site" trick) or ?repo=owner/repo
function repoFromLocation() {
  const q = new URLSearchParams(window.location.search).get("repo");
  if (q) return parseRepoInput(q);
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.length >= 2 ? parseRepoInput(parts.join("/")) : null;
}

const App = () => {
  const analysis = useRepoAnalysis();
  const { status, analyse, reset } = analysis;
  const auth = useAuth();
  const [paywall, setPaywall] = useState(false);
  const [toast, setToast] = useState(null);

  // Back from Stripe: refresh the plan and say what happened.
  useEffect(() => {
    if (!auth?.ready) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (!result) return;
    params.delete("checkout");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    if (result === "success") {
      setToast("Payment received. Activating Gitsum Pro…");
      (async () => {
        // The webhook can land a moment after the redirect; poll briefly.
        for (let i = 0; i < 6; i++) {
          const me = await auth.refresh();
          if (me.plan === "pro") {
            setToast("You're on Gitsum Pro. Ask away.");
            return;
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
        setToast("Payment received. Pro will switch on within a minute; refresh if it hasn't.");
      })();
    } else if (result === "cancelled") {
      setToast("Checkout cancelled. You can keep using free code search.");
    }
  }, [auth?.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signed in from the paywall: continue straight to checkout.
  useEffect(() => {
    if (!auth?.ready || !auth.session || auth.isPro) return;
    if (takeCheckoutIntent()) auth.startCheckout().catch(() => setPaywall(true));
  }, [auth?.ready, auth?.session, auth?.isPro]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const openPaywall = useCallback(() => setPaywall(true), []);

  const open = useCallback(
    (target, { push = true } = {}) => {
      if (push) {
        const path = `/${target.owner}/${target.repo}`;
        if (window.location.pathname !== path) window.history.pushState(null, "", path);
      }
      document.title = `${target.owner}/${target.repo} · Gitsum`;
      analyse(target);
    },
    [analyse]
  );

  const goHome = useCallback(() => {
    if (window.location.pathname !== "/" || window.location.search) window.history.pushState(null, "", "/");
    document.title = "Gitsum — understand a GitHub repo before you clone it";
    reset();
  }, [reset]);

  useEffect(() => {
    const initial = repoFromLocation();
    if (initial) open(initial, { push: false });
    const onPop = () => {
      const target = repoFromLocation();
      if (target) open(target, { push: false });
      else reset();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, reset]);

  const home = status === "idle";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="site-header">
        <button type="button" onClick={goHome} className="brand" aria-label="Gitsum home">
          <span className="brand-mark" aria-hidden="true" />
          Gitsum
        </button>
        <div className="header-right">
          <a className="header-link" href="https://github.com/in-c0/Gitsum-Github-Repo-Analyser" target="_blank" rel="noopener noreferrer">
            Source on GitHub
          </a>
          <AccountMenu onUpgrade={openPaywall} />
        </div>
      </header>

      {home ? (
        <main className="landing">
          <h1 className="landing-title">Know a repo before you clone it.</h1>
          <p className="landing-sub">Paste a public GitHub repository. Get what it does, how to run it, which files matter, and answers that point at the code.</p>
          <RepoInput onSubmit={open} autoFocus />
          <div className="examples" aria-label="Example repositories">
            <span className="examples-label">Try</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="example-chip" onClick={() => open(parseRepoInput(ex))}>
                {ex}
              </button>
            ))}
          </div>
          <p className="landing-tip">
            Shortcut: on any repo page, change <code>github.com</code> in the address bar to this site.
          </p>
        </main>
      ) : (
        <ErrorBoundary>
          <Results analysis={analysis} onOpen={open} onUpgrade={openPaywall} onRetry={() => { const t = repoFromLocation(); if (t) open(t, { push: false }); }} />
        </ErrorBoundary>
      )}

      <Paywall open={paywall} onClose={() => setPaywall(false)} />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
