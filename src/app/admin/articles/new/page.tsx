import { prisma } from "@/lib/prisma";
import { createArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Нова новина</h1>
      <div className="mt-6">
        <ArticleForm action={createArticle} categoryOptions={categories} />
      </div>
    </div>
  );
}
