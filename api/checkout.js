// POST /api/checkout — starts Stripe Checkout for Gitsum Pro and returns { url }.

import { env, fail, json, missingEnv, originOf, readJson } from "../server/http.js";
import { currentUser, planFor } from "../server/auth.js";
import { stripeClient } from "../server/stripe.js";

export async function POST(req) {
  if (missingEnv(["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]).length)
    return fail(503, "not_configured", "Subscriptions aren't switched on for this site yet.");

  const user = await currentUser(req);
  if (!user) return fail(401, "login_required", "Sign in first.");

  const { plan, subscription } = await planFor(user);
  if (plan === "pro") return fail(409, "already_subscribed", "You're already on Gitsum Pro.");

  let body = {};
  try {
    body = await readJson(req, 4000);
  } catch {
    body = {};
  }
  const origin = originOf(req);
  const returnPath = typeof body.returnPath === "string" && body.returnPath.startsWith("/") && !body.returnPath.startsWith("//") ? body.returnPath : "/";
  const back = new URL(returnPath, origin);

  const success = new URL(back);
  success.searchParams.set("checkout", "success");
  const cancel = new URL(back);
  cancel.searchParams.set("checkout", "cancelled");

  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env("STRIPE_PRICE_ID"), quantity: 1 }],
    client_reference_id: user.id,
    ...(subscription?.stripe_customer_id ? { customer: subscription.stripe_customer_id } : { customer_email: user.email || undefined }),
    subscription_data: { metadata: { supabase_user_id: user.id, product: "gitsum" } },
    metadata: { supabase_user_id: user.id, product: "gitsum" },
    allow_promotion_codes: true,
    success_url: success.toString(),
    cancel_url: cancel.toString(),
  });

  return json(200, { url: session.url });
}
