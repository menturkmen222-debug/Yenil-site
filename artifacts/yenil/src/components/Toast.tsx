import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const colors = { success: "#0d9488", error: "#dc2626", info: "#3b82f6" };
  const icons = { success: "✓", error: "✕", info: "ℹ" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, display: "flex", flexDirection: "column", gap: 12 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)",
            color: "white", padding: "14px 20px", borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            borderLeft: `4px solid ${colors[t.type]}`,
            animation: "toastIn 0.4s ease",
            maxWidth: 360, minWidth: 280,
          }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: colors[t.type], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {icons[t.type]}
            </span>
            <span style={{ fontSize: "0.9rem", lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
