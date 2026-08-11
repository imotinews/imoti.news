import { createAd } from "@/lib/actions/ads";
import AdForm from "@/components/admin/AdForm";

export default function NewAdPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Нова реклама</h1>
      <div className="mt-6">
        <AdForm action={createAd} />
      </div>
    </div>
  );
}
