import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSource } from "@/lib/actions/sources";
import SourceForm from "@/components/admin/SourceForm";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const source = await prisma.source.findUnique({ where: { id } });

  if (!source) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Редакция на източник</h1>
      <div className="mt-6">
        <SourceForm
          action={updateSource.bind(null, source.id)}
          defaultValues={{
            name: source.name,
            url: source.url,
            type: source.type,
            active: source.active,
          }}
        />
      </div>
    </div>
  );
}
