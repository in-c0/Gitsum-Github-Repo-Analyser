// Who is calling, and do they have an active Gitsum Pro subscription?
// Identity comes from the Supabase access token the browser sends as a Bearer token.
// Subscription state lives in public.gitsum_subscriptions, written only by the Stripe webhook.

import { createClient } from "@supabase/supabase-js";
import { bearer, env } from "./http.js";

let admin = null;

export function supabaseAdmin() {
  if (admin) return admin;
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Test hook: swap the Supabase client. */
export function __setSupabaseAdmin(client) {
  admin = client;
}

/** Returns the signed-in user ({ id, email }) or null. Never throws for a bad token. */
export async function currentUser(req) {
  const token = bearer(req);
  if (!token) return null;
  const sb = supabaseAdmin();
  if (!sb) return null;
  try {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email || null };
  } catch {
    return null;
  }
}

const ACTIVE = new Set(["active", "trialing"]);

export function isActive(row, now = Date.now()) {
  if (!row || !ACTIVE.has(row.status)) return false;
  if (!row.current_period_end) return true;
  // One day of grace so a renewal webhook arriving late doesn't lock people out.
  return new Date(row.current_period_end).getTime() + 86_400_000 > now;
}

export async function subscriptionFor(userId) {
  const sb = supabaseAdmin();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from("gitsum_subscriptions")
    .select("user_id, status, current_period_end, stripe_customer_id, stripe_subscription_id, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function planFor(user) {
  if (!user) return { plan: "anonymous", subscription: null };
  const sub = await subscriptionFor(user.id);
  return { plan: isActive(sub) ? "pro" : "free", subscription: sub };
}
