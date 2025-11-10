# Cómo Programar el Cron Job para autoclose-work-sessions

## Opción 1: Desde el Dashboard de Supabase (Recomendado)

### Paso a Paso:

1. **Abre tu dashboard de Supabase**
   - Ve a: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd

2. **Navega a Edge Functions**
   - En el menú lateral, haz clic en **Edge Functions**
   - O ve directamente a: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/functions

3. **Selecciona la función**
   - Haz clic en **autoclose-work-sessions**

4. **Busca la sección de Cron/Schedules**
   - Busca una pestaña o sección llamada:
     - **"Cron Jobs"**
     - **"Schedules"**
     - **"Scheduled Functions"**
     - **"Triggers"**
   
   Si no ves esta opción, ve a la **Opción 2** (usando pg_cron directamente)

5. **Crea el cron job**
   - Haz clic en **"New Schedule"** o **"Add Cron"** o botón similar
   - Completa el formulario:
     - **Cron Expression**: `*/15 * * * *`
     - **Function**: `autoclose-work-sessions` (debería estar pre-seleccionada)
     - **Enabled**: ✅ (marca la casilla)
   - Haz clic en **"Save"** o **"Create"**

---

## Opción 2: Usando pg_cron directamente (Método Recomendado)

Este es el método oficial recomendado por Supabase. Usa `pg_cron` y `pg_net` para programar la función.

### Paso a Paso:

1. **Habilitar extensiones necesarias**
   - Ve a: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/database/extensions
   - O ejecuta en SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Almacenar credenciales en Vault (recomendado)**
   - Ve a SQL Editor: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/sql/new
   - Ejecuta (reemplaza con tus valores reales):
   ```sql
   -- Almacenar URL del proyecto
   SELECT vault.create_secret(
     'https://rwuozyncxlynuqvamdjd.supabase.co',
     'project_url'
   );
   
   -- Almacenar service role key (obténla de tu .env.local)
   SELECT vault.create_secret(
     'TU_SERVICE_ROLE_KEY_AQUI',
     'service_role_key'
   );
   ```

3. **Crear el cron job**
   - Ejecuta este SQL:
   ```sql
   SELECT cron.schedule(
     'autoclose-work-sessions',           -- nombre del job
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
   ```

**Nota:** Este método es más seguro porque las credenciales están en Vault y no expuestas en el código.

---

## Opción 3: Usando Supabase CLI (si está disponible en tu versión)

Algunas versiones del CLI tienen soporte para cron. Prueba:

```bash
cd /Users/gnerai/Desktop/fichargg
supabase functions schedule autoclose-work-sessions --cron "*/15 * * * *"
```

Si este comando no existe en tu versión, usa la Opción 1 o 2.

---

## Verificar que el Cron está Funcionando

### Desde el Dashboard:
1. Ve a **Edge Functions** → **autoclose-work-sessions** → **Logs**
2. Espera hasta 15 minutos
3. Deberías ver ejecuciones automáticas en los logs

### Desde SQL:
```sql
-- Ver todos los cron jobs programados
SELECT * FROM cron.job;

-- Ver el historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'autoclose-work-sessions')
ORDER BY start_time DESC 
LIMIT 10;
```

### Desde la Base de Datos:
```sql
-- Verificar que se están cerrando sesiones
SELECT * FROM work_sessions 
WHERE status = 'auto_closed' 
ORDER BY ended_at DESC 
LIMIT 10;

-- Ver alertas generadas
SELECT * FROM alerts 
WHERE kind = 'work_session_auto_closed'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Expresiones Cron Comunes

- `*/15 * * * *` = cada 15 minutos
- `0 * * * *` = cada hora (en el minuto 0)
- `0 */6 * * *` = cada 6 horas
- `0 0 * * *` = una vez al día (medianoche)
- `0 9 * * 1` = cada lunes a las 9 AM

---

## Solución de Problemas

### No veo la opción de Cron en el dashboard
- Algunos proyectos pueden no tener esta opción habilitada
- Usa la **Opción 2** (pg_cron directamente)

### El cron no se ejecuta
- Verifica que `pg_cron` está habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verifica los logs de la función para ver errores
- Verifica que las variables de entorno están configuradas correctamente

### Error al crear el cron
- Asegúrate de que la función está desplegada
- Verifica que la URL de la función es correcta
- Revisa los permisos de la base de datos

