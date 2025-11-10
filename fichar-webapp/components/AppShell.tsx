import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { CompanyStatusBanner } from "@/components/CompanyStatusBanner";
import { SessionWithProfile } from "@/lib/getSession";
import type { ReactNode } from "react";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type CompanyInfo = {
  id: string;
  name: string;
  plan?: string | null;
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Panel" },
  { href: "/equipo", label: "Equipo" },
  { href: "/incidencias", label: "Incidencias" },
  { href: "/configuracion", label: "Ajustes" },
  { href: "/kiosco", label: "Modo kiosco" },
];

export function AppShell({
  auth,
  company,
  activePath,
  children,
}: {
  auth: SessionWithProfile;
  company?: CompanyInfo | null;
  activePath: string;
  children: ReactNode;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <div>
            <p className="brand-label">{company?.name ?? "Tu empresa"}</p>
            <p className="brand-description">{auth.profile.full_name}</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("nav-button", activePath.startsWith(link.href) && "active")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sync-card">
          <p className="sync-label">Rol</p>
          <p className="sync-value" style={{ textTransform: "capitalize" }}>
            {auth.profile.role.replace("_", " ")}
          </p>
          <p className="sync-org">{company ? `Plan ${company.plan ?? "basic"}` : "Sin compañía"}</p>
        </div>
        <LogoutButton />
      </aside>
      <section className="main-panel">
        <CompanyStatusBanner />
        {children}
      </section>
    </main>
  );
}
