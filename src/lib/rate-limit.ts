type Counter = {
  count: number;
  resetAt: number;
};

const windowMsDefault = 5 * 60 * 1000; // 5 minutes
const maxDefault = 20; // 20 requests per window

const buckets = new Map<string, Counter>();

function now() {
  return Date.now();
}

export function rateLimit(options?: { key: string; windowMs?: number; max?: number }): { allowed: boolean; remaining: number; resetAt: number } {
  const key = options?.key ?? "global";
  const windowMs = options?.windowMs ?? windowMsDefault;
  const max = options?.max ?? maxDefault;

  const current = buckets.get(key);
  const ts = now();

  if (!current || current.resetAt <= ts) {
    const resetAt = ts + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: Math.max(0, max - current.count), resetAt: current.resetAt };
}

