# Configuración de JWT Custom Claims

Este documento explica cómo configurar los custom claims del JWT en Supabase para incluir `company_id` y `role` en cada token.

## ¿Por qué es necesario?

Los custom claims permiten que:
- Los helpers de RLS (Row Level Security) sepan en qué tenant está el usuario
- El middleware y los guards puedan verificar permisos sin consultar la base de datos
- El código del cliente tenga acceso directo a `company_id` y `role` desde el JWT

## Instrucciones de instalación

### Paso 1: Ejecutar el SQL

1. Abre el **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido completo de `supabase/setup_jwt_claims.sql`
3. Ejecuta el script
4. Verifica que no haya errores

### Paso 2: Actualizar usuarios existentes (opcional)

Si tienes usuarios existentes, ejecuta esta consulta para actualizar sus claims:

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

### Paso 3: Verificar que funciona

Ejecuta esta consulta para verificar que los claims están en `raw_app_meta_data`:

```sql
SELECT 
  id, 
  email, 
  raw_app_meta_data->>'company_id' as company_id,
  raw_app_meta_data->>'role' as role
FROM auth.users 
LIMIT 5;
```

## Cómo funciona

El sistema funciona con varios triggers:

1. **`set_jwt_claims_trigger`**: Se ejecuta cuando se crea/actualiza un usuario en `auth.users`
   - Lee `company_id` y `role` desde `memberships` o `profiles`
   - Los añade a `raw_app_meta_data` (que se incluye en el JWT)

2. **`sync_membership_to_jwt_trigger`**: Se ejecuta cuando se crea/actualiza un `membership`
   - Actualiza automáticamente los claims del usuario

3. **`sync_profile_to_jwt_trigger`**: Se ejecuta cuando se crea/actualiza un `profile`
   - Actualiza automáticamente los claims del usuario

## Uso en el código

### En el cliente (Next.js)

```typescript
import { createClient } from '@/lib/supabaseClient';

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  const companyId = session.user.app_metadata.company_id;
  const role = session.user.app_metadata.role;
  
  console.log('Company ID:', companyId);
  console.log('Role:', role);
}
```

### En el servidor (Server Actions / API Routes)

```typescript
import { createSupabaseServerClient } from '@/lib/supabaseServer';

const supabase = await createSupabaseServerClient();
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  const companyId = session.user.app_metadata.company_id;
  const role = session.user.app_metadata.role;
}
```

### En RLS (Row Level Security)

```sql
-- Ejemplo de política RLS usando los custom claims
CREATE POLICY "Users can only see their company data"
  ON public.time_entries
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID = company_id
  );
```

### En el middleware

```typescript
// app/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const companyId = session.user.app_metadata.company_id;
    const role = session.user.app_metadata.role;
    
    // Usar companyId y role para lógica de redirección/permisos
  }
}
```

## Actualización manual de claims

Si necesitas actualizar los claims de un usuario específico manualmente:

```sql
SELECT public.refresh_user_jwt_claims('user-uuid-aqui');
```

## Solución de problemas

### Los claims no aparecen en el JWT

1. Verifica que el usuario tenga un `membership` o `profile` con `company_id` y `role`
2. Ejecuta manualmente: `SELECT public.refresh_user_jwt_claims('user-uuid');`
3. El usuario debe hacer logout y login de nuevo para obtener un nuevo JWT

### Los triggers no se ejecutan

1. Verifica que los triggers existan:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%jwt%';
   ```
2. Verifica que las funciones existan:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%jwt%';
   ```

### El JWT no incluye los claims

- Los claims están en `app_metadata`, no en `user_metadata`
- Accede con: `session.user.app_metadata.company_id`
- No con: `session.user.user_metadata.company_id`

## Orden de ejecución de scripts

1. **Primero**: `supabase/fix_memberships.sql` (crea la tabla memberships)
2. **Segundo**: `supabase/setup_jwt_claims.sql` (configura los custom claims)
3. **Tercero**: `node scripts/create-demo-user.js` (crea usuarios de prueba)

## Notas importantes

- Los custom claims se actualizan automáticamente cuando cambias `memberships` o `profiles`
- Los usuarios deben hacer logout/login para obtener un nuevo JWT con los claims actualizados
- Los claims están en `app_metadata`, que es de solo lectura para el usuario (solo el admin puede modificarlo)
- Los claims se validan en cada request, así que siempre reflejan el estado actual de la base de datos

