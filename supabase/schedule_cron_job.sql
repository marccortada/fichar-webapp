-- ============================================================================
-- Programar Cron Job para autoclose-work-sessions
-- ============================================================================
-- Este script programa la Edge Function para ejecutarse cada 15 minutos
-- EJECUTAR EN: SQL Editor de Supabase
-- ============================================================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Almacenar credenciales en Vault (ejecuta esto primero y reemplaza los valores)
-- IMPORTANTE: Reemplaza 'TU_SERVICE_ROLE_KEY_AQUI' con tu service role key real
-- Puedes obtenerla de tu .env.local (SUPABASE_SERVICE_ROLE_KEY)

-- Descomenta y ejecuta estas líneas (una vez):
/*
SELECT vault.create_secret(
  'https://rwuozyncxlynuqvamdjd.supabase.co',
  'project_url'
);

SELECT vault.create_secret(
  'TU_SERVICE_ROLE_KEY_AQUI',  -- 👈 REEMPLAZA con tu service role key
  'service_role_key'
);
*/

-- 3. Eliminar cron job existente si existe (opcional, para recrearlo)
SELECT cron.unschedule('autoclose-work-sessions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'autoclose-work-sessions'
);

-- 4. Crear el cron job
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
-- VERIFICACIÓN
-- ============================================================================

-- Ver todos los cron jobs programados
SELECT * FROM cron.job WHERE jobname = 'autoclose-work-sessions';

-- Ver historial de ejecuciones (después de que se ejecute)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'autoclose-work-sessions')
ORDER BY start_time DESC 
LIMIT 10;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 1. El cron se ejecutará cada 15 minutos automáticamente
-- 2. Los logs de ejecución estarán en cron.job_run_details
-- 3. Los logs de la función estarán en Edge Functions > autoclose-work-sessions > Logs
-- 4. Para cambiar la frecuencia, modifica '*/15 * * * *' y vuelve a ejecutar cron.schedule
-- 5. Para deshabilitar: SELECT cron.unschedule('autoclose-work-sessions');
-- 6. Para eliminar: SELECT cron.unschedule('autoclose-work-sessions');

