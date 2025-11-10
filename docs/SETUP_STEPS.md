# Pasos de Configuración Final

Este documento guía los pasos finales para completar la configuración del proyecto.

## ✅ Paso 1: Configurar ESLint (opcional)

**Nota:** Next.js requiere configuración de ESLint para que `next lint` funcione.

**Si quieres configurar ESLint:**
```bash
cd fichar-webapp
npm install --save-dev eslint eslint-config-next
```

Luego crea `.eslintrc.json`:
```json
{
  "extends": "next/core-web-vitals"
}
```

**Alternativa:** Si no necesitas lint ahora, puedes comentar el script en `package.json` o usar TypeScript directamente:
```bash
npx tsc --noEmit
```

**Verificar TypeScript:**
```bash
cd fichar-webapp && npx tsc --noEmit
```

---

## ✅ Paso 2: Ejecutar setup_jwt_claims.sql

**Archivo:** `supabase/setup_jwt_claims.sql`

**Instrucciones:**
1. Abre el **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido completo de `supabase/setup_jwt_claims.sql`
3. Ejecuta el script
4. Verifica que no haya errores

**Verificar que funciona:**
```sql
SELECT 
  id, 
  email, 
  raw_app_meta_data->>'company_id' as company_id,
  raw_app_meta_data->>'role' as role
FROM auth.users 
LIMIT 5;
```

**Actualizar usuarios existentes (opcional):**
```sql
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.refresh_user_jwt_claims(user_record.id);
  END LOOP;
END $$;
```

**Documentación completa:** Ver `docs/JWT_CLAIMS_SETUP.md`

---

## ✅ Paso 3: Desplegar Edge Function autoclose-work-sessions

### 3.1 Obtener tu Project Ref

1. Ve a tu dashboard de Supabase
2. En **Settings > General**, copia el **Reference ID** (ej: `rwuozyncxlynuqvamdjd`)

### 3.2 Configurar Supabase CLI (si no lo tienes)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link tu proyecto
supabase link --project-ref <tu-project-ref>
```

### 3.3 Desplegar la función

```bash
cd /Users/gnerai/Desktop/fichargg

# Verificar que la función existe
ls -la supabase/functions/autoclose-work-sessions/

# Desplegar
supabase functions deploy autoclose-work-sessions --project-ref <tu-project-ref>
```

### 3.4 Configurar variables de entorno

En el dashboard de Supabase:
1. Ve a **Edge Functions > autoclose-work-sessions**
2. En **Settings**, añade las variables:
   - `SUPABASE_URL`: Tu URL de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key
   - `AUTO_CLOSE_MAX_MINUTES`: `720` (opcional, por defecto 12 horas)

### 3.5 Programar el cron job

```bash
supabase functions schedule autoclose-work-sessions \
  --project-ref <tu-project-ref> \
  --cron "*/15 * * * *"
```

Esto ejecutará la función cada 15 minutos. Ajusta según necesites:
- `*/15 * * * *` = cada 15 minutos
- `0 * * * *` = cada hora
- `0 */6 * * *` = cada 6 horas

**Verificar:**
- Ve a **Edge Functions > autoclose-work-sessions > Logs** para ver las ejecuciones
- Verifica que se están cerrando sesiones en `work_sessions` con `status='auto_closed'`

**Documentación completa:** Ver `docs/JOBS.md`

---

## ✅ Paso 4: Ajustar UI para leer company_status

El middleware ya está configurando:
- Header: `x-company-status`
- Cookie: `company_status`

**Componente Banner creado:** `fichar-webapp/components/CompanyStatusBanner.tsx`

**AppShell actualizado:** Ya incluye el banner que muestra advertencias cuando:
- `status = 'grace'`: Muestra banner de advertencia
- `status = 'suspended'`: Muestra banner de error (ya redirige a /configuracion/plan)

**Verificar:**
1. Cambia el status de una empresa en Supabase:
   ```sql
   UPDATE companies SET status = 'grace' WHERE id = '<company-id>';
   ```
2. Recarga la página y verifica que aparece el banner

---

## ✅ Paso 5: Verificar que todo funciona

### 5.1 Lint
```bash
cd fichar-webapp && npm run lint
```

### 5.2 JWT Claims
```sql
-- Verificar que los claims están en los usuarios
SELECT 
  email,
  raw_app_meta_data->>'company_id' as company_id,
  raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE raw_app_meta_data->>'company_id' IS NOT NULL;
```

### 5.3 Edge Function
- Ve a **Edge Functions > autoclose-work-sessions > Logs**
- Verifica que hay ejecuciones recientes
- Verifica que no hay errores

### 5.4 Company Status Banner
- Cambia el status de una empresa a `grace` o `suspended`
- Recarga la aplicación
- Verifica que aparece el banner correspondiente

---

## Orden de ejecución recomendado

1. ✅ Arreglar lint (ya hecho)
2. ✅ Ejecutar `setup_jwt_claims.sql`
3. ✅ Desplegar Edge Function
4. ✅ Programar cron job
5. ✅ Verificar que todo funciona

---

## Solución de problemas

### Lint sigue fallando
- Verifica que estás en `fichar-webapp/`
- Ejecuta: `npm run lint -- --dir .`

### JWT Claims no aparecen
- Verifica que el usuario tiene `membership` o `profile` con `company_id` y `role`
- Ejecuta manualmente: `SELECT public.refresh_user_jwt_claims('user-uuid');`
- El usuario debe hacer logout/login para obtener nuevo JWT

### Edge Function no se despliega
- Verifica que tienes Supabase CLI instalado y logueado
- Verifica que el Project Ref es correcto
- Verifica que las variables de entorno están configuradas

### Banner no aparece
- Verifica que el middleware está configurando la cookie
- Abre DevTools > Application > Cookies y busca `company_status`
- Verifica que el componente `CompanyStatusBanner` está en `AppShell`

