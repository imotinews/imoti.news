// Manual switches, flipped by hand while the legal question around scraped
// source content (see admin discussion, 2026-09-28) is being sorted out.

// Public pages show "Coming soon" instead of articles. Set to false to bring
// the site back online.
export const SITE_PAUSED = true;

// The scrape cron, the calendar cron and the manual scrape buttons. Lifted on
// 2026-10-23 now that every source has its own mode (rewrite / card / signal)
// and only sources whose terms allow it are ever rewritten.
export const SCRAPING_PAUSED = false;
