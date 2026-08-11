import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Редакция на новина</h1>
      <div className="mt-6">
        <ArticleForm
          action={updateArticle.bind(null, article.id)}
          categoryOptions={categories}
          defaultValues={{
            title: article.title,
            content: article.rewrittenContent,
            categoryId: article.categoryId,
            sourceName: article.sourceName,
            originalUrl: article.originalUrl,
            status: article.status,
          }}
        />
      </div>
    </div>
  );
}
