# Configuración de entornos

1. Crea tres proyectos Supabase (dev/staging/prod) o usa ramas de datos.
2. Copia las llaves (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) al entorno correspondiente.
3. Define secrets adicionales:
   - `SLACK_WEBHOOK_URL`: para alertas.
   - `RESEND_API_KEY` + `RESEND_SENDER`: emails transaccionales.
   - `PLAYWRIGHT_BASE_URL`: URL pública del entorno (para e2e en CI).
4. Bucket `fichajes`: crea la misma estructura en todos los entornos.
5. En Vercel o similar:
   - **Dev**: variables locales `.env.local`.
   - **Preview**: `Vercel Project > Settings > Environment Variables (Preview)`.
   - **Prod**: mismo panel en Production.
