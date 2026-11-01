import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/authContext";

export default function AccountMenu({ onUpgrade }) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!auth?.ready || !auth.signInAvailable) return null;

  if (!auth.session) {
    return (
      <button type="button" className="acct-signin" onClick={onUpgrade}>
        Sign in
      </button>
    );
  }

  const { me } = auth;
  const initial = (auth.email || "?").slice(0, 1).toUpperCase();
  const usage = me.usage;

  return (
    <div className="acct" ref={ref}>
      <button type="button" className="acct-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="acct-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className={`acct-plan ${auth.isPro ? "is-pro" : ""}`}>{auth.isPro ? "Pro" : "Free"}</span>
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <p className="acct-email">{auth.email}</p>
          {auth.isPro && usage && (
            <div className="acct-usage">
              <div className="acct-usage-bar">
                <span style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
              </div>
              <span>
                {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} AI answers this month
              </span>
            </div>
          )}
          {auth.isPro ? (
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await auth.openBillingPortal();
                } catch {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Opening…" : "Manage billing"}
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onUpgrade();
              }}
            >
              Upgrade to Pro
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => auth.signOut()}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
