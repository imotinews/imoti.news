import { prisma } from "@/lib/prisma";
import { createArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";
import ImportFromUrlForm from "@/components/admin/ImportFromUrlForm";

// The link import fetches a page and waits on an AI rewrite (can take ~30s),
// longer than a default serverless request is guaranteed to live.
export const maxDuration = 60;

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Нова новина</h1>

      <div className="mt-6">
        <ImportFromUrlForm />
      </div>

      <h2 className="mt-10 text-base font-bold text-foreground">Или въведи ръчно</h2>
      <div className="mt-4">
        <ArticleForm action={createArticle} categoryOptions={categories} />
      </div>
    </div>
  );
}
