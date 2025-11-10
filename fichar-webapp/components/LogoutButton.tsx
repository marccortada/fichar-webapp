"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div>
      <button className="ghost small" onClick={handleLogout} disabled={pending}>
        {pending ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
      {error && <p style={{ color: "#f87171", marginTop: 4, fontSize: 12 }}>{error}</p>}
    </div>
  );
}
