// POST /api/portal — opens Stripe's billing portal so a subscriber can update payment or cancel.

import { fail, json, missingEnv, originOf, readJson } from "../server/http.js";
import { currentUser, subscriptionFor } from "../server/auth.js";
import { stripeClient } from "../server/stripe.js";

export async function POST(req) {
  if (missingEnv(["STRIPE_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]).length)
    return fail(503, "not_configured", "Subscriptions aren't switched on for this site yet.");

  const user = await currentUser(req);
  if (!user) return fail(401, "login_required", "Sign in first.");

  const sub = await subscriptionFor(user.id);
  if (!sub?.stripe_customer_id) return fail(404, "no_subscription", "There's no subscription on this account.");

  let body = {};
  try {
    body = await readJson(req, 4000);
  } catch {
    body = {};
  }
  const returnPath = typeof body.returnPath === "string" && body.returnPath.startsWith("/") && !body.returnPath.startsWith("//") ? body.returnPath : "/";
  const session = await stripeClient().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: new URL(returnPath, originOf(req)).toString(),
  });
  return json(200, { url: session.url });
}
