export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const auth = await getSession();
  if (auth) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div>
          <p className="header-eyebrow">Bienvenido</p>
          <h1>Accede a tu panel</h1>
          <p className="header-subtitle">
            Usa tus credenciales corporativas para fichar y gestionar turnos.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
