# Jobs y tareas programadas

## Auto cierre de sesiones abiertas

| Elemento | Valor |
| --- | --- |
| Carpeta | `supabase/functions/autoclose-work-sessions` |
| Variables requeridas | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTO_CLOSE_MAX_MINUTES` (opcional, por defecto 720 min) |
| Propósito | Cierra automáticamente las `work_sessions` abiertas más allá del umbral y genera un registro en `alerts` |

### Cómo desplegar

```bash
cd supabase
supabase functions deploy autoclose-work-sessions --project-ref <tu-ref>
```

### Cómo programarla (cron Supabase)

```bash
supabase functions schedule autoclose-work-sessions \
  --project-ref <tu-ref> \
  --cron "*/15 * * * *"
```

> Ajusta la expresión cron al intervalo deseado (en el ejemplo, cada 15 min).

### Qué hace

1. Busca sesiones en `work_sessions` con `status='open'` cuyo `started_at` sea anterior al umbral (`AUTO_CLOSE_MAX_MINUTES`).
2. Actualiza la sesión a `status='auto_closed'`, completa `ended_at` y calcula `effective_minutes`.
3. Inserta un registro en `alerts` con `kind='work_session_auto_closed'` para que la UI los muestre en el panel de control.

Los logs del Edge Function quedan disponibles en el dashboard de Supabase (`Functions -> Logs`). Si hay algún fallo en la actualización o inserción de alertas se imprime en consola y el job continúa con el resto de sesiones.
