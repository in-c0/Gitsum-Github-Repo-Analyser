import Stripe from "stripe";
import { env } from "./http.js";
import { supabaseAdmin } from "./auth.js";

let stripe = null;

export function stripeClient() {
  if (stripe) return stripe;
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return null;
  stripe = new Stripe(key, { maxNetworkRetries: 2 });
  return stripe;
}

/** Test hook. */
export function __setStripe(s) {
  stripe = s;
}

const toIso = (unix) => (unix ? new Date(unix * 1000).toISOString() : null);

/** Writes the subscription's current state for one user. Idempotent: safe to run for every webhook retry. */
export async function saveSubscription({ userId, customerId, subscription }) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase is not configured");
  const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  const row = {
    user_id: userId,
    stripe_customer_id: customerId || subscription.customer || null,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items?.data?.[0]?.price?.id || null,
    current_period_end: toIso(periodEnd),
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("gitsum_subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
  return row;
}

export async function userIdForSubscription(subscription) {
  if (subscription.metadata?.supabase_user_id) return subscription.metadata.supabase_user_id;
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("gitsum_subscriptions")
    .select("user_id")
    .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${subscription.customer}`)
    .limit(1)
    .maybeSingle();
  return data?.user_id || null;
}
