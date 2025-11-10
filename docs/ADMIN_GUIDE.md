# Guía rápida para administradores

1. **Crear usuarios**: usa Supabase Auth -> add user. Copia el UUID en `/equipo` para enlazar el perfil y asignar rol.
2. **Fichajes**: los empleados usan `/dashboard` o `/kiosco`. El formulario captura ubicación/foto si el navegador lo permite.
3. **Incidencias**: `/incidencias` permite crear, asignar y cerrar incidencias. Configura `SLACK_WEBHOOK_URL`/`RESEND_API_KEY` para alertas automáticas.
4. **Turnos y horarios**: gestiona turnos desde los server actions (`app/actions/schedules.ts`) o expande la UI en `/dashboard`.
5. **Dispositivos**: registra kioscos en `/configuracion`. Cada kiosco puede guardar su `device_id` local y se controla desde esa vista.
6. **Exportaciones**: `/configuracion` contiene enlaces a `/api/export/csv` y `/api/export/json` para integrarte con ERPs.
7. **Seeds**: ejecuta `supabase/seed.sql` en el proyecto deseado para crear empresas demo.
