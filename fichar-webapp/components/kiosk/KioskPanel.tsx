"use client";

import { useEffect, useState, useTransition } from "react";
import { registerCheck } from "@/app/actions/timeEntries";
import { useToast } from "@/components/ToastProvider";

export function KioskPanel() {
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("kiosk_device_id");
      if (stored) setDeviceId(stored);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const handleAction = (type: "in" | "out") => {
    startTransition(async () => {
      const result = await registerCheck({
        type,
        notes: notes || null,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        device_id: deviceId || undefined,
      });
      if (!result.success) {
        showToast({ title: "No se pudo registrar", description: result.message, variant: "error" });
        return;
      }
      showToast({
        title: type === "in" ? "Entrada registrada" : "Salida registrada",
        description: notes ? `Nota: ${notes}` : undefined,
        variant: "success",
      });
      setNotes("");
    });
  };

  return (
    <div className="card kiosk-panel">
      <div>
        <p className="card-eyebrow">Fichaje rápido</p>
        <h2>Acerca tu tarjeta o usa el botón</h2>
      </div>
      <input
        className="kiosk-notes"
        placeholder="ID de dispositivo (opcional)"
        value={deviceId}
        onChange={(event) => {
          setDeviceId(event.target.value);
          localStorage.setItem("kiosk_device_id", event.target.value);
        }}
      />
      <input
        className="kiosk-notes"
        placeholder="Nota opcional (puesto, incidencia...)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <div className="kiosk-actions">
        <button className="kiosk-button in" onClick={() => handleAction("in")} disabled={isPending}>
          Entrada
        </button>
        <button className="kiosk-button out" onClick={() => handleAction("out")} disabled={isPending}>
          Salida
        </button>
      </div>
    </div>
  );
}
