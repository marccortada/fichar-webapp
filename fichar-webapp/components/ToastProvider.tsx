"use client";

import { createContext, useContext, useCallback, useState, useMemo } from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() }]);
    setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.variant ?? "info"}`}>
            <strong>{toast.title}</strong>
            {toast.description && <p>{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return context;
}
