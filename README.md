# Fichar Webapp

Panel horario multiempresa con Next.js 16 + Supabase. Incluye fichajes geolocalizados, incidencias, turnos, kioscos, notificaciones Slack/Resend y endpoints de exportación.

## Requisitos
- Node.js 20+
- Proyecto Supabase con el esquema SQL del repo
- Bucket de Storage `fichajes`
- Vars de entorno (ver `.env.example`)

## Scripts
| Comando | Descripción |
| --- | --- |
| `npm run dev` | Desarrollo |
| `npm run build && npm start` | Producción |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit+integration) |
| `npm run test:e2e` | Playwright |
| `npm run ci` | Lint + Vitest + Playwright |

## Tests
- **Vitest** (`tests/unit`, `tests/integration`) con `vitest.config.ts` y `vitest.setup.ts`.
- **Playwright** (`playwright-tests`). Configura `PLAYWRIGHT_BASE_URL` y guarda sesiones en `playwright/.auth/admin.json` si quieres e2e autenticadas.

## Clock API
Los endpoints de fichaje viven en `/api/v1/clock/{in|out|break_start|break_end}`. Cada request debe:
- Estar autenticada (cookies Supabase)
- Enviar el payload definido en `lib/schemas/clock.ts` (`deviceId`, `lat/long`, `notes`, etc.)
- Respetar el RLS (el helper `processClockEvent` valida empresa/dispositivo y abre/cierra `work_sessions`)

Tras cada inserción se revalida `/dashboard`, `/equipo`, `/incidencias` y `/kiosco` para tener datos frescos.

## Seeds
Consulta `supabase/seed.sql` para poblar empresas/usuarios demo. Ejecuta desde la consola SQL o CLI.

## Entornos
| Entorno | Variables |
| --- | --- |
| Local | `.env.local` |
| Staging | Secrets en la plataforma (Vercel, etc.) usando llaves Supabase staging |
| Prod | Llaves Supabase prod + `SLACK_WEBHOOK_URL`, `RESEND_API_KEY` |

🔐 Mantén `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` y `SLACK_WEBHOOK_URL` solo en entornos seguros.

## Jobs
`supabase/functions/autoclose-work-sessions` contiene el Edge Function que cierra sesiones abiertas y genera alertas. Sigue `docs/JOBS.md` para desplegarlo y programarlo.
