import {
  createArticlePhotosFromUrls,
  deleteArticlePhoto,
  updateArticlePhotoCaption,
  moveArticlePhoto,
} from "@/lib/actions/article-photos";
import BlobUploadInput from "@/components/admin/BlobUploadInput";

type Photo = { id: string; imageUrl: string; caption: string | null };

export default function ArticleGalleryPanel({
  articleId,
  photos,
}: {
  articleId: string;
  photos: Photo[];
}) {
  return (
    <div className="mt-6 rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-foreground">Галерия</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Няколко снимки към тази статия — показват се като лента под текста на живия сайт.
      </p>

      <div className="mt-3">
        <BlobUploadInput
          multiple
          onUploaded={async (urls) => {
            "use server";
            await createArticlePhotosFromUrls(articleId, urls);
          }}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.id} className="rounded-md border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.imageUrl} alt="" className="aspect-[4/3] w-full rounded object-cover" />

              <form action={updateArticlePhotoCaption.bind(null, photo.id)} className="mt-2 flex gap-1">
                <input
                  name="caption"
                  defaultValue={photo.caption ?? ""}
                  placeholder="Надпис (по желание)"
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                />
                <button type="submit" className="shrink-0 text-xs text-primary hover:underline">
                  Запази
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1">
                  <form action={moveArticlePhoto.bind(null, photo.id, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="rounded border border-border px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveArticlePhoto.bind(null, photo.id, "down")}>
                    <button
                      type="submit"
                      disabled={i === photos.length - 1}
                      className="rounded border border-border px-1.5 py-0.5 text-xs text-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                <form action={deleteArticlePhoto.bind(null, photo.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
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
