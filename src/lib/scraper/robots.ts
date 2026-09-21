import { fetchWithTimeout } from "./fetch-with-timeout";

const USER_AGENT = "imoti.news scraper (+https://imoti.news)";

function ruleMatches(rulePath: string, path: string): boolean {
  if (!rulePath.includes("*") && !rulePath.endsWith("$")) return path.startsWith(rulePath);
  const anchored = rulePath.endsWith("$");
  const body = anchored ? rulePath.slice(0, -1) : rulePath;
  const pattern = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${pattern}${anchored ? "$" : ""}`).test(path);
}

// Minimal robots.txt check: only the "User-agent: *" group is read, and the
// longest matching Allow/Disallow rule wins (Allow on a tie). A missing or
// unreadable robots.txt forbids nothing.
export async function robotsAllows(pageUrl: string): Promise<boolean> {
  const url = new URL(pageUrl);

  let text: string;
  try {
    const res = await fetchWithTimeout(`${url.origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } }, 8000);
    if (!res.ok) return true;
    text = await res.text();
  } catch {
    return true;
  }

  const rules: { allow: boolean; path: string }[] = [];
  let groupAgents: string[] = [];
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    const match = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!match) continue;

    const field = match[1].toLowerCase();
    const value = match[2].trim();

    if (field === "user-agent") {
      if (!lastWasAgent) groupAgents = [];
      groupAgents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;

    if ((field === "allow" || field === "disallow") && groupAgents.includes("*") && value) {
      rules.push({ allow: field === "allow", path: value });
    }
  }

  const path = url.pathname + url.search;
  let best: { allow: boolean; length: number } | null = null;
  for (const rule of rules) {
    if (!ruleMatches(rule.path, path)) continue;
    const length = rule.path.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) {
      best = { allow: rule.allow, length };
    }
  }

  return best ? best.allow : true;
}
