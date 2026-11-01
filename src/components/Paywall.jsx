import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/authContext";
import { PRICE_LABEL, rememberCheckoutIntent } from "../lib/checkout";

const PERKS = ["Answers that read the actual code", "Every answer cites file and line", "Follow-up questions keep context", "1,000 answers a month"];

export default function Paywall({ open, onClose }) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ busy: false, sent: false, error: null });
  const dialogRef = useRef(null);
  const signedIn = !!auth?.session;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      setState({ busy: false, sent: false, error: null });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);

  const run = async (fn) => {
    setState({ busy: true, sent: false, error: null });
    try {
      await fn();
    } catch (err) {
      setState({ busy: false, sent: false, error: err.message || "Something went wrong. Try again." });
    }
  };

  const subscribe = () => run(() => auth.startCheckout());
  const google = () =>
    run(async () => {
      rememberCheckoutIntent();
      await auth.signInWithGoogle();
    });
  const emailLink = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState({ busy: false, sent: false, error: "Enter a valid email address." });
      return;
    }
    run(async () => {
      rememberCheckoutIntent();
      await auth.signInWithEmail(email.trim());
      setState({ busy: false, sent: true, error: null });
    });
  };

  return (
    <dialog ref={dialogRef} className="pw" onClose={onClose} onCancel={onClose} aria-labelledby="pw-title">
      <button type="button" className="pw-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <p className="pw-kicker">Gitsum Pro</p>
      <h2 id="pw-title" className="pw-title">
        Ask the AI about any repo
      </h2>
      <p className="pw-price">
        <span className="pw-amount">{PRICE_LABEL}</span>
        <span className="pw-per">/ month · cancel anytime</span>
      </p>
      <ul className="pw-perks">
        {PERKS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {signedIn ? (
        <button type="button" className="pw-primary" onClick={subscribe} disabled={state.busy}>
          {state.busy ? "Opening checkout…" : `Subscribe for ${PRICE_LABEL}/month`}
        </button>
      ) : state.sent ? (
        <p className="pw-sent" role="status">
          Check {email} for a sign-in link. Checkout opens right after you sign in.
        </p>
      ) : (
        <div className="pw-auth">
          <button type="button" className="pw-primary" onClick={google} disabled={state.busy}>
            Continue with Google
          </button>
          <form className="pw-email" onSubmit={emailLink} noValidate>
            <label htmlFor="pw-email-input" className="sr-only">
              Email
            </label>
            <input id="pw-email-input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="pw-secondary" disabled={state.busy}>
              Email me a link
            </button>
          </form>
        </div>
      )}

      {state.error && (
        <p className="pw-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="button" className="pw-skip" onClick={onClose}>
        Keep using free code search
      </button>
    </dialog>
  );
}
