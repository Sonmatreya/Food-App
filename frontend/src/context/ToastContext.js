import React, { createContext, useCallback, useContext, useState } from "react";
import "../Styles/Toast.css";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 2800) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { id, message, type }]);
    window.setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toastViewport" aria-live="polite">
        {toasts.map((toast) => (
          <button type="button" className={`appToast ${toast.type}`} key={toast.id} onClick={() => removeToast(toast.id)}>
            <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}</span>
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
