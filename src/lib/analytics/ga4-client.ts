import { BetaAnalyticsDataClient } from "@google-analytics/data";

export function isAnalyticsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL &&
      process.env.GOOGLE_ANALYTICS_PRIVATE_KEY &&
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID
  );
}

function getClient(): BetaAnalyticsDataClient | null {
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      // Vercel env vars store the key's "\n" sequences as literal
      // backslash-n text -- turn them back into real newlines for the PEM.
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });
}

export type AnalyticsSummary = {
  totalUsers: number;
  totalPageViews: number;
  dailyViews: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  channels: { channel: string; sessions: number }[];
};

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary | null> {
  const client = getClient();
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  if (!client || !propertyId) return null;

  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const [summaryReport] = await client.runReport({
    property,
    dateRanges,
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
  });
  const totalUsers = Number(summaryReport.rows?.[0]?.metricValues?.[0]?.value ?? 0);
  const totalPageViews = Number(summaryReport.rows?.[0]?.metricValues?.[1]?.value ?? 0);

  const [dailyReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "date" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });
  const dailyViews = (dailyReport.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }));

  const [pagesReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 5,
  });
  const topPages = (pagesReport.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    views: Number(row.metricValues?.[0]?.value ?? 0),
  }));

  const [channelReport] = await client.runReport({
    property,
    dateRanges,
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });
  const channels = (channelReport.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
  }));

  return { totalUsers, totalPageViews, dailyViews, topPages, channels };
}
