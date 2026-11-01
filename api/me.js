// GET /api/me — the caller's plan and this month's AI usage. Works for anonymous callers too.

import { json, missingEnv } from "../server/http.js";
import { currentUser, planFor } from "../server/auth.js";
import { usageFor } from "../server/limits.js";

export async function GET(req) {
  const configured = missingEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_PRICE_ID"]).length === 0;
  const user = await currentUser(req);
  if (!user) return json(200, { plan: "anonymous", aiEnabled: configured });
  try {
    const { plan, subscription } = await planFor(user);
    const usage = plan === "pro" ? await usageFor(user.id) : null;
    return json(200, {
      plan,
      aiEnabled: configured,
      email: user.email,
      usage,
      renewsAt: subscription?.current_period_end || null,
      cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    });
  } catch (err) {
    console.error("[me]", err);
    return json(200, { plan: "free", aiEnabled: configured, email: user.email, degraded: true });
  }
}
