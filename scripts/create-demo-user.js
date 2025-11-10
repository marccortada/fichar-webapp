// scripts/create-demo-user.js
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Construir ruta absoluta al .env.local (buscar en fichar-webapp/ primero, luego en raíz)
const scriptDir = __dirname; // Directorio donde está este script (scripts/)
const projectRoot = path.resolve(scriptDir, ".."); // Raíz del proyecto
// Intentar primero en fichar-webapp/.env.local (ubicación común en proyectos Next.js)
const envPathWebapp = path.join(projectRoot, "fichar-webapp", ".env.local");
const envPathRoot = path.join(projectRoot, ".env.local");
// Usar la primera que exista
const envPath = fs.existsSync(envPathWebapp) ? envPathWebapp : envPathRoot;

console.log("🔍 Cargando .env.local desde:", envPath);
const envExists = fs.existsSync(envPath);
console.log("📦 Existe:", envExists);

// Cargar variables de entorno (solo si el archivo existe)
if (envExists) {
  const result = require("dotenv").config({ path: envPath });
  if (result.error) {
    console.warn("⚠️ Advertencia al cargar .env.local:", result.error.message);
    console.warn("   Continuando con variables de entorno del sistema...");
  } else {
    console.log("✅ .env.local cargado correctamente");
  }
} else {
  console.warn("⚠️ .env.local no encontrado. Usando variables de entorno del sistema.");
  console.warn("   Si necesitas crear el archivo, créalo en:", envPath);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🌍 URL:", url || "No encontrada ❌");
console.log("🔑 SERVICE ROLE:", serviceRole ? "Cargada ✅" : "No encontrada ❌");

if (!url || !serviceRole) {
  console.error("\n❌ ERROR: Faltan variables de entorno requeridas");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", url ? "✅" : "❌ No encontrada");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", serviceRole ? "✅" : "❌ No encontrada");
  console.error("\n💡 Solución:");
  console.error("   1. Crea el archivo .env.local en la raíz del proyecto:", envPath);
  console.error("   2. Añade las siguientes variables:");
  console.error("      NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase");
  console.error("      SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key");
  console.error("\n   O exporta las variables en tu terminal antes de ejecutar el script.");
  process.exit(1);
}

// ⚠️ REEMPLAZA por el UUID real de tu empresa (consulta: select id,name from companies;)
const COMPANY_ID = "21b02e99-8010-45a0-9770-4e73152998e9";
const OWNER_EMAIL = "demo@example.com";
const OWNER_PASSWORD = "demo1234";

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
if (!UUID_RE.test(COMPANY_ID)) {
  console.error("❌ COMPANY_ID no parece un UUID válido. Edita el script y pon el correcto.");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRole, { auth: { persistSession: false } });

async function run() {
  try {
    console.log("🧱 Creando/asegurando empresa y usuario owner…");
    
    // Verificar que el COMPANY_ID existe en la base de datos
    console.log("🔍 Verificando que la empresa existe...");
    const { data: companyData, error: companyErr } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("id", COMPANY_ID)
      .single();
    
    if (companyErr || !companyData) {
      console.error("❌ La empresa con ID", COMPANY_ID, "no existe en la base de datos");
      console.error("   Error:", companyErr?.message || "No se encontró la empresa");
      console.error("\n💡 Solución:");
      console.error("   1. Verifica el UUID de la empresa ejecutando:");
      console.error("      SELECT id, name FROM companies;");
      console.error("   2. Actualiza COMPANY_ID en el script con un UUID válido");
      process.exit(1);
    }
    console.log("✅ Empresa encontrada:", companyData.name, "(" + COMPANY_ID + ")");
    
    // 1) Crear usuario owner (si no existe)
    let userId;

    console.log("👤 Creando usuario...");
    
    // Verificar si el usuario ya existe
    const { data: existingUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    
    if (!listErr && existingUsers) {
      const existing = existingUsers.users.find((u) => u.email === OWNER_EMAIL);
      if (existing) {
        console.log("⚠️ El usuario ya existe. Usando usuario existente...");
        userId = existing.id;
        
        // Actualizar app_metadata si es necesario
        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          app_metadata: { company_id: COMPANY_ID, role: "owner" },
        });
        if (updErr) {
          console.warn("   ⚠️ No se pudo actualizar app_metadata:", updErr.message);
        } else {
          console.log("✅ app_metadata actualizado correctamente");
        }
      }
    }
    
    // Si el usuario no existe, intentar crearlo
    if (!userId) {
      const { data: createRes, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        email_confirm: true,
        app_metadata: { company_id: COMPANY_ID, role: "owner" },
      });
      
      if (createErr) {
        console.error("\n❌ ERROR: No se pudo crear el usuario a través de Auth API");
        console.error("   Mensaje:", createErr.message);
        
        // Detectar el error específico de memberships
        if (createErr.message && createErr.message.toLowerCase().includes("memberships") && 
            (createErr.message.toLowerCase().includes("does not exist") || 
             createErr.message.toLowerCase().includes("relation"))) {
          console.error("\n🔍 PROBLEMA DETECTADO: La tabla 'memberships' no existe");
          console.error("   Hay un trigger 'sync_user_app_metadata()' que intenta consultar esta tabla.");
          console.error("\n💡 SOLUCIÓN:");
          console.error("   1. Abre el SQL Editor en tu dashboard de Supabase");
          console.error("   2. Ejecuta el archivo: supabase/fix_memberships.sql");
          console.error("   3. Este script creará la tabla 'memberships' y corregirá el trigger");
          console.error("   4. Vuelve a ejecutar este script: node scripts/create-demo-user.js");
        } else {
          console.error("\n💡 Otras posibles soluciones:");
          console.error("   1. Revisa los logs de Supabase en el dashboard para ver el error específico");
          console.error("   2. Verifica si hay triggers en auth.users que puedan estar fallando");
          console.error("   3. Intenta crear el usuario manualmente desde el dashboard de Supabase");
        }
        throw createErr;
      }
      
      userId = createRes.user.id;
      console.log("✅ Usuario creado:", {
        id: createRes.user.id,
        email: createRes.user.email,
        app_metadata: createRes.user.app_metadata,
      });
    }

    // 2) Insertar/asegurar profile
    // Nota: En profiles, 'id' debe ser el mismo UUID que el user_id (auth.users.id)
    // La tabla profiles requiere tanto 'id' como 'user_id'
    const { error: pInsErr } = await supabaseAdmin.from("profiles").insert(
      [{ 
        id: userId, 
        user_id: userId,  // También se requiere user_id
        company_id: COMPANY_ID, 
        full_name: "Demo Owner", 
        role: "owner", 
        is_active: true 
      }],
      { count: "exact" }
    );
    if (pInsErr && !/duplicate key value|already exists/i.test(pInsErr.message)) {
      // Ignora duplicados; solo lanza si es otro tipo de error
      console.error("❌ Error al insertar profile:", pInsErr.message);
      console.error("   Detalles:", JSON.stringify(pInsErr, null, 2));
      throw pInsErr;
    }

    // 3) Insertar/asegurar membership
    const { error: mInsErr } = await supabaseAdmin.from("memberships").insert(
      [{ company_id: COMPANY_ID, user_id: userId, role: "owner" }],
      { count: "exact" }
    );
    if (mInsErr && !/duplicate key value|already exists/i.test(mInsErr.message)) {
      throw mInsErr;
    }

    console.log("✅ Profile + Membership creados/asegurados para", userId);
    console.log("➡️ Empresa ID:", COMPANY_ID);
    console.log("➡️ Usuario ID:", userId);
    console.log("🎉 Listo. Este usuario ya tendrá company_id y role='owner' en el JWT al iniciar sesión.");
  } catch (err) {
    console.error("\n❌ ERROR GENERAL:");
    console.error("   Mensaje:", err?.message || err);
    if (err?.status) console.error("   Status:", err.status);
    if (err?.code) console.error("   Código:", err.code);
    if (err?.error) console.error("   Error:", JSON.stringify(err.error, null, 2));
    if (err?.stack) {
      console.error("\n📋 Stack trace:");
      console.error(err.stack);
    }
    console.error("\n💡 Posibles causas:");
    console.error("   - SERVICE_ROLE_KEY inválida o sin permisos");
    console.error("   - Problema de conexión con Supabase");
    console.error("   - Configuración incorrecta de Auth en Supabase");
    console.error("   - El COMPANY_ID no existe en la base de datos");
    process.exit(1);
  }
}

run();
