# Checklist de Verificación Final

Usa este checklist para verificar que todo está configurado correctamente.

## ✅ 1. JWT Custom Claims

**Verificar en SQL Editor:**
```sql
SELECT 
  email,
  raw_app_meta_data->>'company_id' as company_id,
  raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE raw_app_meta_data->>'company_id' IS NOT NULL
LIMIT 5;
```

**✅ Resultado esperado:** Deberías ver usuarios con `company_id` y `role` en `raw_app_meta_data`

**Si no hay resultados:**
- Ejecuta: `supabase/setup_jwt_claims.sql`
- O actualiza usuarios existentes:
  ```sql
  DO $$
  DECLARE user_record RECORD;
  BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
      PERFORM public.refresh_user_jwt_claims(user_record.id);
    END LOOP;
  END $$;
  ```

---

## ✅ 2. Edge Function Desplegada

**Verificar desde terminal:**
```bash
cd /Users/gnerai/Desktop/fichargg
supabase functions list
```

**✅ Resultado esperado:** Deberías ver `autoclose-work-sessions` con status `ACTIVE`

**Verificar variables de entorno:**
1. Ve a: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/functions/autoclose-work-sessions
2. Settings → Secrets
3. Verifica que existen:
   - `PROJECT_URL`
   - `SERVICE_ROLE_KEY`
   - `AUTO_CLOSE_MAX_MINUTES` (opcional)

---

## ✅ 3. Cron Job Programado

**Verificar en SQL Editor:**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'autoclose-work-sessions';
```

**✅ Resultado esperado:** 
- Una fila con `jobname = 'autoclose-work-sessions'`
- `schedule = '*/15 * * * *'`
- `active = t`

**Si no hay resultados:**
- Ejecuta el PASO 4 de `supabase/setup_cron_complete.sql`

**Verificar ejecuciones (después de 15 minutos):**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'autoclose-work-sessions')
ORDER BY start_time DESC 
LIMIT 5;
```

---

## ✅ 4. Middleware Funcionando

**Verificar en la aplicación:**
1. Abre la app en el navegador
2. Abre DevTools (F12) → Application → Cookies
3. Busca la cookie `company_status`
4. Debería existir si estás autenticado

**Probar redirecciones:**
- Intenta acceder sin estar logueado → debería redirigir a `/login`
- Si `force_password_reset=true` → debería redirigir a `/new-password`

---

## ✅ 5. Company Status Banner

**Probar el banner:**
1. En SQL Editor, cambia el status de una empresa:
   ```sql
   UPDATE companies 
   SET status = 'grace' 
   WHERE id = '<tu-company-id>';
   ```
2. Recarga la aplicación
3. Deberías ver un banner amarillo de advertencia

**Probar suspended:**
```sql
UPDATE companies 
SET status = 'suspended' 
WHERE id = '<tu-company-id>';
```
- Debería redirigir a `/configuracion/plan` y mostrar banner rojo

---

## ✅ 6. Fichajes Funcionando

**Probar desde dashboard:**
1. Ve a `/dashboard`
2. Usa el formulario de fichaje
3. Debería registrar correctamente

**Verificar en base de datos:**
```sql
SELECT * FROM time_events 
ORDER BY happened_at DESC 
LIMIT 5;

SELECT * FROM work_sessions 
ORDER BY started_at DESC 
LIMIT 5;
```

---

## ✅ 7. Geovalla Funcionando (si aplica)

**Solo se aplica si:**
- El dispositivo tiene `latitude` y `longitude`
- El fichaje incluye `latitude` y `longitude`

**Probar:**
- Fichar desde fuera del radio permitido (100m) → debería dar error
- Fichar desde dentro del radio → debería funcionar

---

## Resumen de Estado

Marca lo que ya verificaste:

- [ ] JWT Claims configurados
- [ ] Edge Function desplegada
- [ ] Variables de entorno configuradas
- [ ] Cron job programado
- [ ] Middleware funcionando
- [ ] Banner de company status funcionando
- [ ] Fichajes funcionando
- [ ] Geovalla funcionando (si aplica)

---

## Si algo no funciona

Revisa `docs/SETUP_STEPS.md` en la sección "Solución de problemas" para cada componente.

