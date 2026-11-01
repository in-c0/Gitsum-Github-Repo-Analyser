// Usage limits that hold across every serverless instance (Upstash Redis).
// - burst: per-user sliding window, stops runaway clients and scripts
// - monthly: per-user message quota for the plan
// - global daily cap: a hard ceiling on total AI calls per day, so a spike can't run up an unbounded bill
// Without Upstash configured, limits fall back to per-instance memory (fine for local dev, not for production).

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "./http.js";

let redis;
let burst;
const memory = new Map();

function client() {
  if (redis !== undefined) return redis;
  const url = env("UPSTASH_REDIS_REST_URL") || env("KV_REST_API_URL");
  const token = env("UPSTASH_REDIS_REST_TOKEN") || env("KV_REST_API_TOKEN");
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

/** Test hook. */
export function __setRedis(r) {
  redis = r;
  burst = undefined;
  memory.clear();
}

export function limitsConfig() {
  return {
    perMinute: Number(env("GITSUM_RATE_PER_MINUTE", 12)),
    monthly: Number(env("GITSUM_MONTHLY_LIMIT", 1000)),
    globalDaily: Number(env("GITSUM_GLOBAL_DAILY_LIMIT", 20000)),
  };
}

const monthKey = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

async function incr(key, ttlSeconds) {
  const r = client();
  if (r) {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, ttlSeconds);
    return n;
  }
  const n = (memory.get(key) || 0) + 1;
  memory.set(key, n);
  return n;
}

async function get(key) {
  const r = client();
  if (r) return Number((await r.get(key)) || 0);
  return memory.get(key) || 0;
}

async function decr(key) {
  const r = client();
  if (r) return r.decr(key);
  memory.set(key, Math.max(0, (memory.get(key) || 1) - 1));
  return memory.get(key);
}

export async function usageFor(userId) {
  const { monthly } = limitsConfig();
  const used = await get(`gitsum:usage:${userId}:${monthKey()}`);
  return { used, limit: monthly };
}

/**
 * Reserves one AI message for this user. Returns { ok: true, release } or { ok: false, code, retryAfter? }.
 * Call release() if the model call fails before producing an answer, so the user isn't charged for it.
 */
export async function reserveMessage(userId) {
  const cfg = limitsConfig();
  const r = client();

  if (r) {
    burst ||= new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(cfg.perMinute, "60 s"), prefix: "gitsum:burst" });
    const b = await burst.limit(userId);
    if (!b.success) return { ok: false, code: "rate_limited", retryAfter: Math.max(1, Math.ceil((b.reset - Date.now()) / 1000)) };
  } else {
    const k = `burst:${userId}:${Math.floor(Date.now() / 60000)}`;
    if ((await incr(k, 120)) > cfg.perMinute) return { ok: false, code: "rate_limited", retryAfter: 60 };
  }

  const gKey = `gitsum:global:${dayKey()}`;
  const g = await incr(gKey, 2 * 86400);
  if (g > cfg.globalDaily) {
    await decr(gKey);
    return { ok: false, code: "capacity" };
  }

  const uKey = `gitsum:usage:${userId}:${monthKey()}`;
  const u = await incr(uKey, 40 * 86400);
  if (u > cfg.monthly) {
    await decr(uKey);
    await decr(gKey);
    return { ok: false, code: "quota_exceeded", limit: cfg.monthly };
  }

  return {
    ok: true,
    used: u,
    limit: cfg.monthly,
    release: async () => {
      await decr(uKey);
      await decr(gKey);
    },
  };
}
