export type FeedItem = {
  url: string;
  title: string;
  publishedAt: Date | null;
  summary: string | null;
};

export type ExtractedArticle = {
  title: string;
  text: string;
};

export type ClassifyResult =
  | { relevant: false }
  | {
      relevant: true;
      title: string;
      content: string;
      excerpt: string;
      categorySlug: string | null;
    };

export type ScraperRunResult = {
  sourceId: string;
  sourceName: string;
  itemsSeen: number;
  created: number;
  skippedIrrelevant: number;
  skippedDuplicate: number;
  errors: string[];
};
