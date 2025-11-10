"use client";

import { useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function SupabaseProviders({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createSupabaseBrowserClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}
