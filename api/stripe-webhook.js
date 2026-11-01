// POST /api/stripe-webhook — keeps public.gitsum_subscriptions in step with Stripe.
// Events: checkout.session.completed, customer.subscription.created|updated|deleted

import { env, fail, json } from "../server/http.js";
import { saveSubscription, stripeClient, userIdForSubscription } from "../server/stripe.js";

export async function POST(req) {
  const stripe = stripeClient();
  const secret = env("STRIPE_WEBHOOK_SECRET");
  if (!stripe || !secret) return fail(503, "not_configured", "Stripe webhook isn't configured.");

  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch (err) {
    return fail(400, "bad_signature", `Webhook signature check failed: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return json(200, { ignored: true });
      const userId = session.client_reference_id || session.metadata?.supabase_user_id;
      if (!userId) return json(200, { ignored: "no user" });
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await saveSubscription({ userId, customerId: session.customer, subscription });
    } else if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object;
      if (subscription.metadata?.product && subscription.metadata.product !== "gitsum") return json(200, { ignored: "other product" });
      const userId = await userIdForSubscription(subscription);
      if (!userId) return json(200, { ignored: "unknown subscription" });
      await saveSubscription({ userId, customerId: subscription.customer, subscription });
    } else {
      return json(200, { ignored: event.type });
    }
  } catch (err) {
    console.error("[stripe-webhook]", event.type, err);
    // 500 makes Stripe retry, which is what we want for a transient database error.
    return fail(500, "save_failed", "Couldn't save the subscription.");
  }

  return json(200, { received: true });
}
