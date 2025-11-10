"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CompanyStatus = "grace" | "suspended" | null;

export function CompanyStatusBanner() {
  const [status, setStatus] = useState<CompanyStatus>(null);

  useEffect(() => {
    // Leer desde cookie (configurada por middleware)
    const cookieStatus = document.cookie
      .split("; ")
      .find((row) => row.startsWith("company_status="))
      ?.split("=")[1] as CompanyStatus | undefined;

    if (cookieStatus === "grace" || cookieStatus === "suspended") {
      setStatus(cookieStatus);
    }
  }, []);

  if (!status) return null;

  if (status === "grace") {
    return (
      <div className="company-status-banner grace">
        <div className="banner-content">
          <p className="banner-title">⚠️ Período de gracia activo</p>
          <p className="banner-description">
            Tu plan ha expirado. Actualiza tu suscripción para continuar usando todas las funciones.
          </p>
          <Link href="/configuracion/plan" className="banner-link">
            Actualizar plan →
          </Link>
        </div>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="company-status-banner suspended">
        <div className="banner-content">
          <p className="banner-title">🚫 Cuenta suspendida</p>
          <p className="banner-description">
            Tu cuenta ha sido suspendida. Contacta con soporte o actualiza tu plan para reactivar el servicio.
          </p>
          <Link href="/configuracion/plan" className="banner-link">
            Ver detalles →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

