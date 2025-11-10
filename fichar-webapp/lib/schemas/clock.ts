import { z } from "zod";

const optionalCoordinate = z
  .union([z.number(), z.string()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) return null;
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numeric)) {
      throw new Error("Coordenada inválida");
    }
    return numeric;
  })
  .nullable()
  .optional();

export const clockPayloadSchema = z.object({
  employeeId: z.string().uuid().optional(),
  deviceId: z.string().uuid().nullable().optional(),
  notes: z
    .string()
    .max(280, "La nota debe tener 280 caracteres o menos.")
    .nullable()
    .optional(),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  photoUrl: z.string().url().nullable().optional(),
  source: z.enum(["web", "mobile", "kiosk"]).optional(),
});

export const clockRequestSchema = clockPayloadSchema.extend({
  type: z.enum(["in", "out", "break_start", "break_end"]),
});

export type ClockRequestInput = z.infer<typeof clockRequestSchema>;
