-- Fix: Crear tabla memberships y corregir trigger sync_user_app_metadata
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Crear tabla memberships si no existe
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON public.memberships(company_id);

-- 3. Habilitar RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 4. Política básica de RLS (ajusta según tus necesidades)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.memberships;
CREATE POLICY "Users can view their own memberships"
  ON public.memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Eliminar el trigger problemático si existe
-- El trigger sync_user_app_metadata está intentando consultar memberships antes de que exista
DROP TRIGGER IF EXISTS sync_user_app_metadata_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.sync_user_app_metadata() CASCADE;

-- 6. Crear una versión corregida del trigger que sincroniza app_metadata desde memberships
CREATE OR REPLACE FUNCTION public.sync_user_app_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_role TEXT;
  v_app_meta_data JSONB;
BEGIN
  -- Intentar obtener company_id y role de memberships
  -- Si no hay registro, las variables quedarán NULL
  SELECT company_id, role
  INTO v_company_id, v_role
  FROM public.memberships
  WHERE user_id = NEW.id
  ORDER BY company_id
  LIMIT 1;

  -- Inicializar app_metadata si no existe
  v_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);

  -- Si encontramos valores en memberships, actualizar app_metadata
  IF v_company_id IS NOT NULL AND v_role IS NOT NULL THEN
    v_app_meta_data := v_app_meta_data || 
      jsonb_build_object('company_id', v_company_id::text, 'role', v_role);
    NEW.raw_app_meta_data := v_app_meta_data;
  -- Si no hay en memberships pero hay valores en app_metadata, mantenerlos
  ELSIF v_app_meta_data->>'company_id' IS NOT NULL OR v_app_meta_data->>'role' IS NOT NULL THEN
    -- Mantener los valores existentes en app_metadata
    NEW.raw_app_meta_data := v_app_meta_data;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error (ej: tabla no existe), mantener app_metadata original
    -- Esto evita que falle la creación de usuarios si hay problemas con memberships
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recrear el trigger
CREATE TRIGGER sync_user_app_metadata_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_app_metadata();

-- Comentarios
COMMENT ON TABLE public.memberships IS 'Relaciona usuarios con empresas y sus roles';
COMMENT ON COLUMN public.memberships.company_id IS 'ID de la empresa';
COMMENT ON COLUMN public.memberships.user_id IS 'ID del usuario de auth.users';
COMMENT ON COLUMN public.memberships.role IS 'Rol del usuario en la empresa (owner, admin, employee, etc.)';

-- NOTAS IMPORTANTES:
-- 1. Este script debe ejecutarse ANTES de crear usuarios, ya que el trigger
--    sync_user_app_metadata() consulta la tabla memberships.
-- 2. La función sync_user_app_metadata() sincroniza automáticamente los valores
--    de company_id y role desde memberships hacia raw_app_meta_data en auth.users.
-- 3. Si la tabla memberships no existe o hay un error, el trigger no fallará
--    y simplemente mantendrá los valores existentes en app_metadata.
-- 4. Después de ejecutar este script, puedes ejecutar: node scripts/create-demo-user.js
