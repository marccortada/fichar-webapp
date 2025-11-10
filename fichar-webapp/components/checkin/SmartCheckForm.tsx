"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { registerCheck } from "@/app/actions/timeEntries";
import { useToast } from "@/components/ToastProvider";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ActionType = "in" | "out";

export function SmartCheckForm() {
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDevice = localStorage.getItem("kiosk_device_id");
      if (storedDevice) setDeviceId(storedDevice);
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      showToast({ title: "Geolocalización no soportada", variant: "error" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        showToast({ title: "Ubicación capturada", variant: "success" });
      },
      () => showToast({ title: "No se pudo obtener la ubicación", variant: "error" }),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;
    const fileName = `photo-${Date.now()}-${photoFile.name}`;
    const { data, error } = await supabase.storage.from("fichajes").upload(fileName, photoFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error || !data) {
      showToast({ title: "No se pudo subir la foto", description: error?.message, variant: "error" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("fichajes").getPublicUrl(data.path);
    return urlData.publicUrl ?? null;
  };

  const handleAction = (type: ActionType) => {
    startTransition(async () => {
      const photoUrl = await uploadPhoto();
      const result = await registerCheck({
        type,
        notes,
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
        device_id: deviceId ?? undefined,
        photo_url: photoUrl ?? undefined,
      });
      if (!result.success) {
        showToast({ title: "No se pudo registrar", description: result.message, variant: "error" });
        return;
      }
      if (result.lateMinutes) {
        showToast({
          title: "Entrada tardía",
          description: `Se registró como tardanza (${result.lateMinutes} min).`,
          variant: "info",
        });
      } else {
        showToast({
          title: type === "in" ? "Entrada registrada" : "Salida registrada",
          variant: "success",
        });
      }
      setNotes("");
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  return (
    <div className="smart-check-form">
      <textarea
        placeholder="Nota opcional"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
      />
      <div className="smart-check-actions">
        <button type="button" className="ghost small" onClick={requestLocation}>
          Añadir ubicación
        </button>
        <label className="ghost small">
          Capturar foto
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <div className="quick-actions-buttons">
        <button className="primary" type="button" onClick={() => handleAction("in")} disabled={pending}>
          {pending ? "Enviando..." : "Registrar entrada"}
        </button>
        <button className="ghost" type="button" onClick={() => handleAction("out")} disabled={pending}>
          {pending ? "Procesando..." : "Registrar salida"}
        </button>
      </div>
    </div>
  );
}
