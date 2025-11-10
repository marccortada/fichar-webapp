import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const AUTH_ROUTES = ["/login", "/new-password"];
const SUSPENDED_ALLOWED_PREFIXES = ["/configuracion", "/logout"];
const GRACE_ALLOWED_PREFIXES = ["/configuracion", "/logout", "/dashboard"]; // Grace permite dashboard pero con limitaciones

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function withCompanyStatus(response: NextResponse, status: string | null) {
  if (!status) return response;
  response.headers.set("x-company-status", status);
  response.cookies.set("company_status", status, { path: "/" });
  return response;
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res: response });
  const pathname = req.nextUrl.pathname;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[middleware] Error obteniendo la sesión", error.message);
  }

  if (!session) {
    if (isAuthRoute(pathname)) {
      return response;
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const emailConfirmed = Boolean(session.user.email_confirmed_at ?? session.user.confirmed_at);
  if (!emailConfirmed && !pathname.startsWith("/login")) {
    const verifyUrl = new URL("/login", req.url);
    verifyUrl.searchParams.set("error", "email_not_confirmed");
    return NextResponse.redirect(verifyUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role, force_password_reset, password_updated_at, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[middleware] Error obteniendo perfil", profileError.message);
  }

  if (!profile || !profile.company_id || profile.is_active === false) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("error", "inactive_profile");
    return NextResponse.redirect(redirectUrl);
  }

  const mustResetPassword = Boolean(profile.force_password_reset) || !profile.password_updated_at;
  if (mustResetPassword && !pathname.startsWith("/new-password")) {
    const resetUrl = new URL("/new-password", req.url);
    resetUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(resetUrl);
  }

  let companyStatus: string | null = null;
  const { data: company } = await supabase
    .from("companies")
    .select("status")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (company?.status) {
    companyStatus = company.status;
    response = withCompanyStatus(response, companyStatus);
  }

  // Manejar estados de la empresa
  if (companyStatus === "suspended") {
    const allowed = SUSPENDED_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!allowed) {
      const billingUrl = new URL("/configuracion/plan", req.url);
      billingUrl.searchParams.set("status", "suspended");
      return withCompanyStatus(NextResponse.redirect(billingUrl), companyStatus);
    }
  }

  // Grace: permitir uso pero mostrar advertencias (el banner ya lo maneja)
  // No bloqueamos rutas en grace, solo mostramos el banner
  if (companyStatus === "grace") {
    // Permitir todas las rutas pero el banner mostrará la advertencia
    // Las limitaciones se aplican a nivel de funcionalidad, no de acceso
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/new-password",
    "/dashboard/:path*",
    "/equipo/:path*",
    "/incidencias/:path*",
    "/configuracion/:path*",
    "/kiosco/:path*",
    "/api/v1/clock/:path*", // Rutas de API de fichaje
  ],
};
