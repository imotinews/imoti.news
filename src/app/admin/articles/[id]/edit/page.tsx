import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/actions/articles";
import ArticleForm from "@/components/admin/ArticleForm";
import ArticleImagePanel from "@/components/admin/ArticleImagePanel";
import ArticleGalleryPanel from "@/components/admin/ArticleGalleryPanel";
import ArticleActionsPanel from "@/components/admin/ArticleActionsPanel";
import ArticlePlacementPanel from "@/components/admin/ArticlePlacementPanel";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article, categories, stockPhotos] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { photos: { orderBy: { order: "asc" } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.stockPhoto.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <Link
        href={`/admin/articles/${article.id}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← Обратно към прегледа
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Редакция на новина</h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
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

        <aside className="w-full shrink-0 lg:w-72">
          <ArticleActionsPanel
            article={article}
            secondaryHref={`/admin/articles/${article.id}`}
            secondaryLabel="Преглед"
          />

          <div className="mt-4">
            <ArticleImagePanel articleId={article.id} imageUrl={article.imageUrl} stockPhotos={stockPhotos} />
          </div>

          <div className="mt-4">
            <ArticlePlacementPanel
              articleId={article.id}
              isHero={article.isHero}
              isFeatured={article.isFeatured}
              isOriginal={article.isOriginal}
            />
          </div>
        </aside>
      </div>

      <ArticleGalleryPanel articleId={article.id} photos={article.photos} />
    </div>
  );
}
