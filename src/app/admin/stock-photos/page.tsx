import { prisma } from "@/lib/prisma";
import { deleteStockPhoto } from "@/lib/actions/stock-photos";
import StockPhotoUploadForm from "@/components/admin/StockPhotoUploadForm";
import StockPhotoCategoryPicker from "@/components/admin/StockPhotoCategoryPicker";
import BackfillCoverImagesButton from "@/components/admin/BackfillCoverImagesButton";

export default async function AdminStockPhotosPage() {
  const [photos, categories] = await Promise.all([
    prisma.stockPhoto.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock снимки</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Библиотека със собствени снимки за многократна употреба. Снимки с категория се използват
        автоматично при публикуване на новина без снимка от тази категория (на ротация, така че
        да не се повтарят). Без категория — избират се само ръчно от панела за снимка на статия.
      </p>

      <div className="mt-6">
        <StockPhotoUploadForm categories={categories} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <h2 className="text-sm font-semibold text-foreground">Новини без снимка</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Разпределя качените Stock снимки към всички статии, които все още нямат корица, по
          категория и на ротация.
        </p>
        <div className="mt-3">
          <BackfillCoverImagesButton />
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Няма качени снимки още.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="space-y-2 p-2">
                <StockPhotoCategoryPicker
                  photoId={photo.id}
                  currentCategoryId={photo.categoryId}
                  categories={categories}
                />
                <form
                  action={async () => {
                    "use server";
                    await deleteStockPhoto(photo.id);
                  }}
                >
                  <button type="submit" className="w-full text-xs text-red-600 hover:underline">
                    Изтрий
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
