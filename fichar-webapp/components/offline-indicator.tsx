"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setOffline] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-indicator">
      <p>Sin conexión. Seguimos guardando tus acciones y se sincronizarán al volver.</p>
    </div>
  );
}
