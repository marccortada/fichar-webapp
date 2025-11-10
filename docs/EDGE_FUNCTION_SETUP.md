# Configuración de Edge Function autoclose-work-sessions

## ✅ Función Desplegada

La función `autoclose-work-sessions` ha sido desplegada exitosamente.

## 📋 Pasos Restantes

### 1. Configurar Variables de Entorno

Ve al dashboard de Supabase:
1. **Edge Functions** → **autoclose-work-sessions**
2. **Settings** → **Secrets**
3. Añade estas variables (⚠️ NO uses nombres que empiecen con `SUPABASE_`):

```
PROJECT_URL=https://rwuozyncxlynuqvamdjd.supabase.co
SERVICE_ROLE_KEY=<tu-service-role-key>
AUTO_CLOSE_MAX_MINUTES=720
```

**Nota:** 
- `PROJECT_URL`: Tu URL de Supabase (la misma que `NEXT_PUBLIC_SUPABASE_URL` en tu `.env.local`)
- `SERVICE_ROLE_KEY`: Tu service role key (la misma que `SUPABASE_SERVICE_ROLE_KEY` en tu `.env.local`)
- `AUTO_CLOSE_MAX_MINUTES`: 720 = 12 horas (ajustable)

**⚠️ Importante:** Supabase no permite crear variables que empiecen con `SUPABASE_` porque son reservadas. Por eso usamos `PROJECT_URL` y `SERVICE_ROLE_KEY`.

### 2. Programar el Cron Job

**Desde el Dashboard de Supabase:**

1. Ve a **Edge Functions** → **autoclose-work-sessions**
2. Ve a la pestaña **Cron Jobs** o **Schedules**
3. Crea un nuevo cron job con:
   - **Cron Expression**: `*/15 * * * *` (cada 15 minutos)
   - **Function**: `autoclose-work-sessions`
   - **Enabled**: ✅

**Opciones de frecuencia:**
- `*/15 * * * *` = cada 15 minutos (recomendado)
- `0 * * * *` = cada hora
- `0 */6 * * *` = cada 6 horas
- `0 0 * * *` = una vez al día (medianoche)

**Alternativa (si tienes acceso a la API):**
Puedes usar la Management API de Supabase para crear el cron job programáticamente.

### 3. Verificar que Funciona

1. Ve a **Edge Functions** → **autoclose-work-sessions** → **Logs**
2. Espera a que se ejecute el cron (máximo 15 minutos)
3. Verifica que aparecen logs de ejecución
4. Verifica en la base de datos que se están cerrando sesiones:
   ```sql
   SELECT * FROM work_sessions 
   WHERE status = 'auto_closed' 
   ORDER BY ended_at DESC 
   LIMIT 10;
   ```

## 🔍 Ver Logs

```bash
supabase functions logs autoclose-work-sessions
```

## 📝 Qué Hace la Función

1. Busca sesiones en `work_sessions` con `status='open'` que hayan superado el umbral de tiempo
2. Las cierra automáticamente (`status='auto_closed'`)
3. Calcula `effective_minutes` y completa `ended_at`
4. Crea una alerta en la tabla `alerts` con `kind='work_session_auto_closed'`

## 🛠️ Solución de Problemas

### La función no se ejecuta
- Verifica que el cron está programado: `supabase functions list`
- Verifica las variables de entorno en el dashboard
- Revisa los logs para ver errores

### No se cierran sesiones
- Verifica que hay sesiones abiertas más antiguas que el umbral
- Verifica que la tabla `work_sessions` existe
- Verifica que la tabla `alerts` existe

