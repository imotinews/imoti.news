import { createSource } from "@/lib/actions/sources";
import SourceForm from "@/components/admin/SourceForm";

export default function NewSourcePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Нов източник</h1>
      <div className="mt-6">
        <SourceForm action={createSource} />
      </div>
    </div>
  );
}
