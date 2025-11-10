import "./globals.css";
import type { Metadata } from "next";
import { SupabaseProviders } from "@/components/SupabaseProviders";
import { ToastProvider } from "@/components/ToastProvider";
import { OfflineIndicator } from "@/components/offline-indicator";

export const metadata: Metadata = {
  title: 'Fichar',
  description: 'Starter Next.js + TypeScript + App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <SupabaseProviders>
          <ToastProvider>
            <OfflineIndicator />
            {children}
          </ToastProvider>
        </SupabaseProviders>
      </body>
    </html>
  );
}
