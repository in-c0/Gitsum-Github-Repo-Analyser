import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, supabase } from "./authContext";

// Supabase handles sign-in (Google or an email link). The plan comes from /api/me, which reads
// the subscription row the Stripe webhook writes. Without VITE_SUPABASE_* the app runs signed-out.


const ANON = { plan: "anonymous", aiEnabled: false };

async function fetchMe(token) {
  try {
    const res = await fetch("/api/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return ANON;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return ANON;
    return await res.json();
  } catch {
    return ANON;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(ANON);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async (s) => {
    const token = (s ?? session)?.access_token || null;
    const next = await fetchMe(token);
    setMe(next);
    return next;
  }, [session]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let s = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        s = data.session;
      }
      if (!alive) return;
      setSession(s);
      setMe(await fetchMe(s?.access_token));
      setReady(true);
    })();
    if (!supabase) return () => { alive = false; };
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      setMe(await fetchMe(s?.access_token));
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const redirectTo = () => window.location.href.split("#")[0];

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Sign-in isn't set up on this site yet.");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email) => {
    if (!supabase) throw new Error("Sign-in isn't set up on this site yet.");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setMe(await fetchMe(null));
  }, []);

  const post = useCallback(async (path) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ returnPath: window.location.pathname + window.location.search.replace(/[?&]checkout=[^&]*/, "") }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) throw new Error(body?.error?.message || "Couldn't open Stripe. Try again.");
    window.location.assign(body.url);
  }, [session]);

  const startCheckout = useCallback(() => post("/api/checkout"), [post]);
  const openBillingPortal = useCallback(() => post("/api/portal"), [post]);

  const value = useMemo(
    () => ({
      ready,
      session,
      token: session?.access_token || null,
      email: session?.user?.email || me.email || null,
      me,
      signInAvailable: !!supabase,
      isPro: me.plan === "pro",
      refresh,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      startCheckout,
      openBillingPortal,
    }),
    [ready, session, me, refresh, signInWithGoogle, signInWithEmail, signOut, startCheckout, openBillingPortal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
