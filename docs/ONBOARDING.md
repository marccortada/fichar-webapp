# Guía de Onboarding - Nuevo Desarrollador

Esta guía te ayudará a configurar el proyecto desde cero.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- Git instalado
- Cuenta de Supabase (o acceso al proyecto)

---

## 🚀 Pasos de Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/marccortada/fichar-webapp.git
cd fichar-webapp
```

**O si ya tienes el repo clonado:**
```bash
cd fichar-webapp
git pull origin main
```

---

### 2. Instalar Dependencias

```bash
# Instalar dependencias de la raíz (si hay)
npm install

# Instalar dependencias de la aplicación
cd fichar-webapp
npm install
```

---

### 3. Configurar Variables de Entorno

Crea el archivo `.env.local` en `fichar-webapp/`:

```bash
cd fichar-webapp
cp .env.example .env.local
```

Edita `fichar-webapp/.env.local` y añade:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rwuozyncxlynuqvamdjd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Obtén las keys de:**
- Supabase Dashboard → Settings → API
- O pide las credenciales al equipo

---

### 4. Configurar Supabase (Opcional - Solo si necesitas la CLI)

Si necesitas usar Supabase CLI:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Login
supabase login

# Link al proyecto
cd /ruta/al/proyecto
supabase link --project-ref rwuozyncxlynuqvamdjd
```

---

### 5. Ejecutar el Proyecto

```bash
# Desde la raíz del proyecto
npm run dev

# O desde fichar-webapp/
cd fichar-webapp
npm run dev
```

El proyecto estará disponible en: **http://localhost:3000**

---

## 📚 Estructura del Proyecto

```
fichar-webapp/
├── fichar-webapp/          # Aplicación Next.js principal
│   ├── app/                # Rutas y páginas
│   ├── components/         # Componentes React
│   ├── lib/                # Utilidades y helpers
│   ├── middleware.ts       # Middleware de Next.js
│   └── package.json
├── docs/                   # Documentación
├── scripts/                # Scripts de utilidad
├── supabase/               # Scripts SQL y Edge Functions
│   ├── functions/          # Edge Functions
│   └── *.sql              # Scripts de setup
└── package.json            # Scripts root
```

---

## 🔧 Scripts Disponibles

### Desde la raíz:
```bash
npm run dev          # Ejecutar en desarrollo
npm run build        # Construir para producción
npm run start        # Ejecutar en producción
npm run lint         # Ejecutar linter
```

### Desde fichar-webapp/:
```bash
npm run dev          # Ejecutar Next.js
npm run build        # Construir Next.js
npm run start        # Ejecutar producción
npm run lint         # Linter
```

---

## 🗄️ Configuración de Base de Datos

### Ejecutar Scripts SQL en Supabase

1. Ve a: https://supabase.com/dashboard/project/rwuozyncxlynuqvamdjd/sql/new

2. Ejecuta en este orden:
   - `supabase/fix_memberships.sql` (si no está ejecutado)
   - `supabase/setup_jwt_claims.sql` (si no está ejecutado)

3. Verifica:
   ```sql
   -- Verificar JWT claims
   SELECT email, raw_app_meta_data->>'company_id' as company_id
   FROM auth.users LIMIT 5;
   ```

---

## 🧪 Crear Usuario de Prueba

```bash
# Desde la raíz del proyecto
node scripts/create-demo-user.js
```

**Nota:** Asegúrate de tener:
- `.env.local` configurado
- El UUID de la empresa en el script

---

## 📖 Documentación Importante

- `docs/SETUP_STEPS.md` - Pasos de configuración detallados
- `docs/COMPLETED_TASKS.md` - Resumen de funcionalidades implementadas
- `docs/JWT_CLAIMS_SETUP.md` - Configuración de JWT
- `docs/CRON_JOB_SETUP.md` - Configuración del cron job
- `docs/EDGE_FUNCTION_SETUP.md` - Configuración de Edge Functions

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
cd fichar-webapp
rm -rf node_modules package-lock.json
npm install
```

### Error: Variables de entorno no encontradas
- Verifica que `.env.local` existe en `fichar-webapp/`
- Verifica que las variables tienen los nombres correctos
- Reinicia el servidor de desarrollo

### Error: "Database error"
- Verifica que los scripts SQL están ejecutados en Supabase
- Verifica que las credenciales de Supabase son correctas

### Error: Lint falla
```bash
cd fichar-webapp
npm run lint
```

---

## ✅ Verificación Rápida

Después de configurar, verifica que todo funciona:

1. **Servidor corre:**
   ```bash
   npm run dev
   # Debería abrir http://localhost:3000
   ```

2. **Login funciona:**
   - Ve a `/login`
   - Intenta iniciar sesión

3. **Base de datos conectada:**
   - Verifica que puedes ver datos en el dashboard

---

## 📞 ¿Necesitas Ayuda?

- Revisa la documentación en `docs/`
- Consulta `docs/SETUP_STEPS.md` para pasos detallados
- Pregunta al equipo si algo no funciona

---

## 🎯 Próximos Pasos

Una vez configurado:
1. Explora la estructura del proyecto
2. Lee `docs/COMPLETED_TASKS.md` para entender las funcionalidades
3. Revisa `docs/FINAL_STATUS.md` para el estado actual
4. ¡Empieza a desarrollar! 🚀

