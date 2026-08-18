import { prisma } from "@/lib/prisma";
import { uploadStockPhotos, deleteStockPhoto } from "@/lib/actions/stock-photos";

export default async function AdminStockPhotosPage() {
  const photos = await prisma.stockPhoto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock снимки</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Библиотека със собствени снимки за многократна употреба — избират се като снимка на
        статия, когато няма изрично качена такава (напр. докато AI генерирането не е достъпно).
      </p>

      <form
        action={uploadStockPhotos}
        encType="multipart/form-data"
        className="mt-6 flex items-end gap-3"
      >
        <div>
          <label htmlFor="imageFiles" className="block text-sm font-medium text-foreground">
            Качи снимки
          </label>
          <input
            id="imageFiles"
            name="imageFiles"
            type="file"
            accept="image/*"
            multiple
            required
            className="mt-1.5 block text-sm text-foreground"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Качи
        </button>
      </form>

      {photos.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Няма качени снимки още.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              <form
                action={async () => {
                  "use server";
                  await deleteStockPhoto(photo.id);
                }}
                className="p-2"
              >
                <button type="submit" className="w-full text-xs text-red-600 hover:underline">
                  Изтрий
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
