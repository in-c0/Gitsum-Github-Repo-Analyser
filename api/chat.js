// POST /api/chat — streams an AI answer about a repository to a Gitsum Pro subscriber.
// 401 login_required · 402 subscription_required · 429 rate_limited | quota_exceeded · 503 capacity | not_configured

import Anthropic from "@anthropic-ai/sdk";
import { env, fail, missingEnv, readJson } from "../server/http.js";
import { currentUser, planFor } from "../server/auth.js";
import { reserveMessage } from "../server/limits.js";
import { buildRequest, validateBody } from "../server/prompt.js";

export const maxDuration = 60;

let anthropic = null;
export function __setAnthropic(client) {
  anthropic = client;
}
function anthropicClient() {
  if (anthropic) return anthropic;
  const apiKey = env("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  anthropic = new Anthropic({ apiKey, maxRetries: 2 });
  return anthropic;
}

const encoder = new TextEncoder();
const sse = (obj) => encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);

export async function POST(req) {
  const missing = missingEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]);
  if (missing.length) return fail(503, "not_configured", "AI chat isn't switched on for this site yet.");

  const user = await currentUser(req);
  if (!user) return fail(401, "login_required", "Sign in and subscribe to ask the AI about this repository.");

  let plan;
  try {
    plan = await planFor(user);
  } catch (err) {
    console.error("[chat] subscription lookup failed", err);
    return fail(503, "capacity", "Couldn't check your subscription. Try again in a moment.");
  }
  if (plan.plan !== "pro") return fail(402, "subscription_required", "AI answers are part of Gitsum Pro.");

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return fail(err.status || 400, "bad_request", err.message);
  }
  const invalid = validateBody(body);
  if (invalid.length) return fail(400, "bad_request", `Invalid: ${invalid.join(", ")}`);

  const slot = await reserveMessage(user.id);
  if (!slot.ok) {
    if (slot.code === "rate_limited")
      return fail(429, "rate_limited", `Too many questions at once. Try again in ${slot.retryAfter}s.`, { retryAfter: slot.retryAfter });
    if (slot.code === "quota_exceeded")
      return fail(429, "quota_exceeded", `You've used this month's ${slot.limit} AI answers. The quota resets on the 1st.`);
    return fail(503, "capacity", "Gitsum is at capacity right now. Try again shortly.");
  }

  const client = anthropicClient();
  const request = buildRequest(body);
  const model = env("GITSUM_MODEL", "claude-haiku-5-5");
  const maxTokens = Number(env("GITSUM_MAX_TOKENS", 1200));

  const stream = new ReadableStream({
    async start(controller) {
      let produced = false;
      try {
        const run = client.messages.stream({ model, max_tokens: maxTokens, system: request.system, messages: request.messages });
        req.signal?.addEventListener("abort", () => run.abort?.());
        for await (const event of run) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
            produced = true;
            controller.enqueue(sse({ text: event.delta.text }));
          }
        }
        const final = await run.finalMessage?.();
        if (final?.usage) {
          console.log("[chat] usage", JSON.stringify({ user: user.id, model, ...final.usage }));
        }
        controller.enqueue(sse({ done: true, used: slot.used, limit: slot.limit }));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("[chat] model call failed", err?.status, err?.message);
        if (!produced) await slot.release().catch(() => {});
        const message = err?.status === 529 || err?.status === 429 ? "The AI is busy right now. Try again in a moment." : "The AI couldn't answer this time. Try again.";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(message)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
