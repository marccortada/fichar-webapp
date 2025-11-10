/**
 * Tipos de dominio para las tablas en Supabase.
 *
 * IMPORTANTE: Ajusta los nombres de campos para que COINCIDAN EXACTAMENTE con
 * tu esquema en Supabase. Ahora mismo están definidos con convenciones típicas.
 * Cuando compartas el esquema real (DDL) puedo alinearlos al 100%.
 */

// Aliases útiles para mayor claridad semántica
export type UUID = string; // uuid
export type ISODateString = string; // timestamptz/ISO 8601

/**
 * Tabla: organizations (convención sugerida)
 */
export interface Organization {
  id: UUID;
  name: string;
  slug?: string | null;
  created_at: ISODateString;
  updated_at?: ISODateString | null;
}

/**
 * Tabla: memberships (convención sugerida)
 * Relaciona usuarios con organizaciones y su rol.
 */
export interface Membership {
  id: UUID;
  organization_id: UUID;
  user_id: UUID; // auth.users.id
  role: string; // ajusta a tu enum/valores reales
  created_at: ISODateString;
}

/**
 * Tabla: employees (convención sugerida)
 */
export interface Employee {
  id: UUID;
  organization_id: UUID;
  user_id?: UUID | null; // si mapea a auth.users
  email?: string | null;
  full_name?: string | null;
  active: boolean;
  created_at: ISODateString;
  updated_at?: ISODateString | null;
}

/**
 * Tabla: time_entries (convención sugerida)
 */
export interface TimeEntry {
  id: UUID;
  employee_id: UUID;
  started_at: ISODateString;
  ended_at?: ISODateString | null;
  duration_seconds?: number | null; // si lo calculas vía trigger, déjalo opcional
  note?: string | null;
  created_at: ISODateString;
}

/**
 * Tabla: audit_logs (convención sugerida)
 */
export interface AuditLog {
  id: UUID;
  organization_id?: UUID | null;
  actor_id?: UUID | null; // usuario o empleado que realizó la acción
  action: string; // e.g. 'time_entry.created'
  entity_type?: string | null; // e.g. 'time_entry'
  entity_id?: UUID | null;
  metadata?: Record<string, unknown> | null; // jsonb
  created_at: ISODateString;
}

/**
 * Si tus nombres de tabla difieren (por ejemplo singular/plural o snake_case),
 * actualiza las interfaces y sus propiedades para reflejarlo exactamente.
 */

