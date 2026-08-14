const DOMAIN_DELAY_MS = 1200;
const domainLastFetchAt = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sources are about to grow a lot. A shared per-domain delay keeps us from
// hammering any single site — module-level state is fine since each cron
// invocation is a fresh process, we only need politeness within one run.
export async function waitForDomainSlot(url: string): Promise<void> {
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return;
  }

  const lastFetch = domainLastFetchAt.get(domain) ?? 0;
  const elapsed = Date.now() - lastFetch;
  const remaining = DOMAIN_DELAY_MS - elapsed;

  if (remaining > 0) {
    await sleep(remaining);
  }

  domainLastFetchAt.set(domain, Date.now());
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  await waitForDomainSlot(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
