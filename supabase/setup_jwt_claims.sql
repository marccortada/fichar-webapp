-- ============================================================================
-- Configuración de JWT Custom Claims en Supabase
-- ============================================================================
-- Este script configura los custom claims del JWT para incluir company_id y role
-- Esto es necesario para que los helpers de RLS sepan en qué tenant está el usuario
--
-- EJECUTAR EN: SQL Editor de Supabase
-- ============================================================================

-- 1. Función para obtener company_id y role desde memberships o profiles
CREATE OR REPLACE FUNCTION public.get_user_company_and_role(p_user_id UUID)
RETURNS TABLE(company_id UUID, role TEXT) AS $$
BEGIN
  -- Intentar obtener de memberships primero (tabla de relación)
  RETURN QUERY
  SELECT m.company_id, m.role
  FROM public.memberships m
  WHERE m.user_id = p_user_id
  ORDER BY m.created_at
  LIMIT 1;
  
  -- Si no hay en memberships, intentar desde profiles
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.company_id, p.role::TEXT
    FROM public.profiles p
    WHERE p.id = p_user_id OR p.user_id = p_user_id
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Función que actualiza los custom claims del JWT
-- Esta función se ejecuta automáticamente cuando se genera un token
CREATE OR REPLACE FUNCTION public.set_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_role TEXT;
  v_claims JSONB;
BEGIN
  -- Obtener company_id y role del usuario
  SELECT company_id, role INTO v_company_id, v_role
  FROM public.get_user_company_and_role(NEW.id);
  
  -- Construir los custom claims
  v_claims := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  
  -- Actualizar con company_id y role si existen
  IF v_company_id IS NOT NULL THEN
    v_claims := v_claims || jsonb_build_object('company_id', v_company_id::text);
  END IF;
  
  IF v_role IS NOT NULL THEN
    v_claims := v_claims || jsonb_build_object('role', v_role);
  END IF;
  
  -- Actualizar raw_app_meta_data (esto se incluye en el JWT)
  NEW.raw_app_meta_data := v_claims;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger que actualiza los claims antes de INSERT o UPDATE en auth.users
DROP TRIGGER IF EXISTS set_jwt_claims_trigger ON auth.users;
CREATE TRIGGER set_jwt_claims_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jwt_claims();

-- 4. Función para actualizar los claims de usuarios existentes
-- Úsala después de crear/actualizar memberships o profiles
CREATE OR REPLACE FUNCTION public.refresh_user_jwt_claims(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_company_id UUID;
  v_role TEXT;
  v_claims JSONB;
BEGIN
  -- Obtener company_id y role
  SELECT company_id, role INTO v_company_id, v_role
  FROM public.get_user_company_and_role(p_user_id);
  
  -- Construir claims
  SELECT COALESCE(raw_app_meta_data, '{}'::jsonb) INTO v_claims
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Actualizar
  IF v_company_id IS NOT NULL THEN
    v_claims := v_claims || jsonb_build_object('company_id', v_company_id::text);
  END IF;
  
  IF v_role IS NOT NULL THEN
    v_claims := v_claims || jsonb_build_object('role', v_role);
  END IF;
  
  -- Actualizar en auth.users
  UPDATE auth.users
  SET raw_app_meta_data = v_claims
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para actualizar automáticamente cuando se crea/actualiza un membership
CREATE OR REPLACE FUNCTION public.sync_membership_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar los claims del usuario cuando cambia su membership
  PERFORM public.refresh_user_jwt_claims(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_membership_to_jwt_trigger ON public.memberships;
CREATE TRIGGER sync_membership_to_jwt_trigger
  AFTER INSERT OR UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_membership_to_jwt();

-- 6. Trigger para actualizar automáticamente cuando se crea/actualiza un profile
CREATE OR REPLACE FUNCTION public.sync_profile_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar los claims del usuario cuando cambia su profile
  PERFORM public.refresh_user_jwt_claims(COALESCE(NEW.id, NEW.user_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_to_jwt_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_jwt_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_jwt();

-- 7. Script para actualizar todos los usuarios existentes (ejecutar una vez)
-- Descomenta y ejecuta esta sección si quieres actualizar usuarios existentes:
/*
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.refresh_user_jwt_claims(user_record.id);
  END LOOP;
END $$;
*/

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar que funciona, ejecuta esto después de crear un usuario:
-- SELECT id, email, raw_app_meta_data FROM auth.users WHERE email = 'tu-email@example.com';
-- Deberías ver company_id y role en raw_app_meta_data

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Los custom claims se incluyen en el JWT como app_metadata
-- 2. Para acceder en el cliente: session.user.app_metadata.company_id
-- 3. Para usar en RLS: (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID
-- 4. Los claims se actualizan automáticamente cuando:
--    - Se crea/actualiza un usuario
--    - Se crea/actualiza un membership
--    - Se crea/actualiza un profile
-- 5. Si necesitas forzar una actualización: SELECT refresh_user_jwt_claims('user-uuid');

