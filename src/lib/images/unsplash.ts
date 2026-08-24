const UNSPLASH_API = "https://api.unsplash.com";
const UTM = "utm_source=imoti_news&utm_medium=referral";

export function isUnsplashConfigured(): boolean {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY);
}

export type UnsplashPhoto = {
  id: string;
  url: string;
  downloadLocation: string;
  photographerName: string;
  photographerUrl: string;
};

type UnsplashSearchResult = {
  id: string;
  urls: { regular: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
};

// Requests a page of results and picks the first one not in excludeIds, so
// a category doesn't show the same photo again for a while. Falls back to
// the top result if every candidate on the page has already been used
// recently (still better than nothing).
export async function searchUnsplashPhoto(
  query: string,
  excludeIds: string[]
): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const params = new URLSearchParams({
    query,
    per_page: "10",
    orientation: "landscape",
    content_filter: "high",
  });

  const response = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  }).catch(() => null);

  if (!response || !response.ok) return null;

  const data = (await response.json().catch(() => null)) as { results?: UnsplashSearchResult[] } | null;
  const results = data?.results ?? [];
  if (results.length === 0) return null;

  const candidate = results.find((r) => !excludeIds.includes(r.id)) ?? results[0];

  return {
    id: candidate.id,
    url: candidate.urls.regular,
    downloadLocation: candidate.links.download_location,
    photographerName: candidate.user.name,
    photographerUrl: `${candidate.user.links.html}?${UTM}`,
  };
}

export const UNSPLASH_HOME_URL = `https://unsplash.com/?${UTM}`;

// Required by Unsplash's API guidelines whenever a photo is actually used
// (not just shown in a search), separate from attribution. Fire-and-forget
// by design -- must never block or fail the article update it follows.
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return;
  await fetch(downloadLocation, { headers: { Authorization: `Client-ID ${accessKey}` } }).catch(() => {});
}
