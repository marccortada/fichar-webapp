"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { updateSettings } from "@/app/actions/settings";
import { useToast } from "@/components/ToastProvider";

type SettingsRow = {
  allow_manual_entries?: boolean;
  require_location?: boolean;
  lateness_threshold_minutes?: number;
  overtime_threshold_minutes?: number;
  timezone?: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: SettingsRow | null }) {
  const [form, setForm] = useState<SettingsRow>({
    allow_manual_entries: initialSettings?.allow_manual_entries ?? false,
    require_location: initialSettings?.require_location ?? false,
    lateness_threshold_minutes: initialSettings?.lateness_threshold_minutes ?? 10,
    overtime_threshold_minutes: initialSettings?.overtime_threshold_minutes ?? 480,
    timezone: initialSettings?.timezone ?? "UTC",
  });
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : Number.isNaN(Number(value))
          ? value
          : Number(value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const result = await updateSettings(form);
    setPending(false);
    if (!result.success) {
      showToast({ title: "No se pudo guardar", description: result.message, variant: "error" });
      return;
    }
    showToast({ title: "Ajustes guardados", variant: "success" });
  };

  return (
    <form className="card invite-form" onSubmit={handleSubmit}>
      <div>
        <p className="card-eyebrow">Preferencias</p>
        <h3>Define cómo se registran los fichajes</h3>
      </div>
      <label className="toggle">
        <input type="checkbox" name="allow_manual_entries" checked={!!form.allow_manual_entries} onChange={handleChange} />
        Permitir fichajes manuales
      </label>
      <label className="toggle">
        <input type="checkbox" name="require_location" checked={!!form.require_location} onChange={handleChange} />
        Requerir ubicación / GPS
      </label>
      <label>
        Tol. retrasos (min)
        <input
          name="lateness_threshold_minutes"
          type="number"
          min={0}
          max={180}
          value={form.lateness_threshold_minutes}
          onChange={handleChange}
        />
      </label>
      <label>
        Umbral horas extra (min)
        <input
          name="overtime_threshold_minutes"
          type="number"
          min={0}
          max={1440}
          value={form.overtime_threshold_minutes}
          onChange={handleChange}
        />
      </label>
      <label>
        Zona horaria
        <select name="timezone" value={form.timezone} onChange={handleChange}>
          <option value="UTC">UTC</option>
          <option value="Europe/Madrid">Europe/Madrid</option>
          <option value="America/Mexico_City">America/Mexico_City</option>
        </select>
      </label>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Guardando..." : "Guardar ajustes"}
      </button>
    </form>
  );
}
