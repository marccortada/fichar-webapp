-- ============================================================================
-- Script Completo: Programar Cron Job para autoclose-work-sessions
-- ============================================================================
-- EJECUTAR EN: SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/sql/new
-- ============================================================================

-- PASO 1: Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- PASO 2: Almacenar credenciales en Vault
-- ⚠️ IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service role key
-- Puedes obtenerla de: fichar-webapp/.env.local (SUPABASE_SERVICE_ROLE_KEY)

-- Almacenar URL del proyecto (solo ejecutar una vez)
SELECT vault.create_secret(
  'https://rwuozyncxlynuqvamdjd.supabase.co',
  'project_url'
);

-- Almacenar service role key (solo ejecutar una vez)
-- 👇 REEMPLAZA 'TU_SERVICE_ROLE_KEY_AQUI' con tu service role key real
SELECT vault.create_secret(
  'TU_SERVICE_ROLE_KEY_AQUI',  -- 👈 Pega aquí tu SUPABASE_SERVICE_ROLE_KEY
  'service_role_key'
);

-- PASO 3: Eliminar cron job existente si existe (para recrearlo limpio)
SELECT cron.unschedule('autoclose-work-sessions') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'autoclose-work-sessions'
);

-- PASO 4: Crear el cron job (se ejecutará cada 15 minutos)
SELECT cron.schedule(
  'autoclose-work-sessions',           -- nombre único del job
  '*/15 * * * *',                      -- cada 15 minutos
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/autoclose-work-sessions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) AS request_id;
  $$
);

-- ============================================================================
-- VERIFICACIÓN (ejecuta esto después para confirmar que funcionó)
-- ============================================================================

-- Ver el cron job creado
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job 
WHERE jobname = 'autoclose-work-sessions';

-- Verificar que los secrets están en Vault
SELECT name FROM vault.secrets WHERE name IN ('project_url', 'service_role_key');

