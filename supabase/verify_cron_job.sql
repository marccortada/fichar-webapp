-- ============================================================================
-- Verificar si el Cron Job está creado
-- ============================================================================
-- Ejecuta esto en el SQL Editor de Supabase para verificar
-- ============================================================================

-- Ver si el cron job existe
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  username,
  command
FROM cron.job 
WHERE jobname = 'autoclose-work-sessions';

-- Si la consulta anterior NO devuelve ninguna fila, significa que NO has ejecutado cron.schedule
-- Si devuelve una fila con jobname = 'autoclose-work-sessions', entonces SÍ está creado

-- Ver todos los cron jobs (para referencia)
SELECT jobid, jobname, schedule, active FROM cron.job;

