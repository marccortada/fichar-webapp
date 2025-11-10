-- ============================================================================
-- Verificación Rápida - Ejecuta todo esto en el SQL Editor
-- ============================================================================

-- 1. Verificar JWT Claims
SELECT 
  email,
  raw_app_meta_data->>'company_id' as company_id,
  raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE raw_app_meta_data->>'company_id' IS NOT NULL
LIMIT 5;

-- 2. Verificar Cron Job
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'autoclose-work-sessions';

-- 3. Verificar Secrets en Vault
SELECT name FROM vault.secrets WHERE name IN ('project_url', 'service_role_key');

-- 4. Verificar que las extensiones están habilitadas
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('pg_cron', 'pg_net');

