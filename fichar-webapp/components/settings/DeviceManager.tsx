"use client";

import { useState, useTransition } from "react";
import { upsertDevice, deleteDevice } from "@/app/actions/devices";
import { useToast } from "@/components/ToastProvider";

type DeviceType = "kiosk" | "tablet" | "mobile";

type Device = {
  id: string;
  name: string;
  type: DeviceType;
  identifier: string | null;
  location: string | null;
  last_seen: string | null;
  is_active: boolean;
};

const deviceTypes: { value: DeviceType; label: string }[] = [
  { value: "kiosk", label: "Kiosco" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Móvil" },
];

export function DeviceManager({ devices }: { devices: Device[] }) {
  const [form, setForm] = useState({
    name: "",
    type: "kiosk",
    identifier: "",
    location: "",
  });
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await upsertDevice({
        name: form.name,
        type: form.type as DeviceType,
        identifier: form.identifier,
        location: form.location,
      });
      if (!result.success) {
        showToast({ title: "No se pudo guardar el dispositivo", description: result.message, variant: "error" });
        return;
      }
      showToast({ title: "Dispositivo guardado", variant: "success" });
      setForm({ name: "", type: "kiosk", identifier: "", location: "" });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteDevice(id);
      if (!result.success) {
        showToast({ title: "No se pudo eliminar", description: result.message, variant: "error" });
      } else {
        showToast({ title: "Dispositivo eliminado", variant: "info" });
      }
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="card-eyebrow">Dispositivos kiosco</p>
          <h3>{devices.length} activos</h3>
        </div>
      </div>
      <form className="invite-form" onSubmit={handleSubmit}>
        <div className="invite-grid">
          <label>
            Nombre
            <input name="name" value={form.name} onChange={handleChange} placeholder="Recepción principal" required />
          </label>
          <label>
            Tipo
            <select name="type" value={form.type} onChange={handleChange}>
              {deviceTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Identificador (MAC, serie…)
            <input name="identifier" value={form.identifier} onChange={handleChange} placeholder="ABC-123" required />
          </label>
          <label>
            Ubicación / coordenadas
            <input name="location" value={form.location} onChange={handleChange} placeholder="Entrada, 41.38,2.17" />
          </label>
        </div>
        <button className="primary" type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar dispositivo"}
        </button>
      </form>

      <ul className="team-list" style={{ marginTop: 24 }}>
        {devices.length === 0 && <p className="activity-note">No hay dispositivos registrados.</p>}
        {devices.map((device) => (
          <li key={device.id}>
            <div>
              <p className="team-name">{device.name}</p>
              <p className="team-role">
                {device.type} · {device.location ?? "Ubicación desconocida"}
              </p>
            </div>
            <button className="ghost small" type="button" onClick={() => handleDelete(device.id)} disabled={isPending}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
