import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAd } from "@/lib/actions/ads";
import AdForm from "@/components/admin/AdForm";

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ad = await prisma.adBanner.findUnique({ where: { id } });

  if (!ad) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Редакция на реклама</h1>
      <div className="mt-6">
        <AdForm
          action={updateAd.bind(null, ad.id)}
          defaultValues={{
            name: ad.name,
            position: ad.position,
            imageUrl: ad.imageUrl,
            htmlCode: ad.htmlCode,
            targetUrl: ad.targetUrl,
            active: ad.active,
            startDate: ad.startDate,
            endDate: ad.endDate,
          }}
        />
      </div>
    </div>
  );
}
