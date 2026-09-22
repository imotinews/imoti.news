import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default function AdminPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Смяна на парола</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Въведи сегашната парола и избери нова. Използвай дълга парола, която не ползваш другаде.
      </p>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
