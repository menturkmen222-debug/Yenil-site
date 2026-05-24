import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, ref, push, set, onValue, update } from "@/lib/firebase";
import { useBonusPul } from "@/contexts/BonusPulContext";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  iconColor?: string;
  read: boolean;
  timestamp: number;
  type?: "order" | "bp" | "system" | "promo";
}

interface NotifContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "timestamp">) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotifContext = createContext<NotifContextType>({
  notifications: [],
  unreadCount: 0,
  markAllRead: async () => {},
  markRead: async () => {},
  addNotification: async () => {},
  clearAll: async () => {},
});

const LOCAL_KEY = "@yenil_notifications";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { deviceId } = useBonusPul();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  // Load from cache first
  useEffect(() => {
    AsyncStorage.getItem(LOCAL_KEY).then((raw) => {
      if (raw) {
        try {
          setNotifications(JSON.parse(raw) as AppNotification[]);
        } catch {}
      }
    });
  }, []);

  // Listen from Firebase
  useEffect(() => {
    if (!deviceId) return;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    const notifRef = ref(db, `notifications/${deviceId}`);
    const unsub = onValue(notifRef, (snap) => {
      if (!snap.exists()) {
        setNotifications([]);
        return;
      }
      const val = snap.val() as Record<string, Omit<AppNotification, "id">>;
      const list: AppNotification[] = Object.entries(val)
        .map(([id, n]) => ({ ...n, id }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(list);
      AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    });

    unsubRef.current = unsub;
    return () => { unsub(); unsubRef.current = null; };
  }, [deviceId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id: string) => {
    if (!deviceId) return;
    try {
      await update(ref(db, `notifications/${deviceId}/${id}`), { read: true });
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  }, [deviceId]);

  const markAllRead = useCallback(async () => {
    if (!deviceId) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const updates: Record<string, boolean> = {};
    unread.forEach((n) => {
      updates[`notifications/${deviceId}/${n.id}/read`] = true;
    });
    try {
      await update(ref(db, "/"), updates);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [deviceId, notifications]);

  const addNotification = useCallback(
    async (n: Omit<AppNotification, "id" | "read" | "timestamp">) => {
      if (!deviceId) return;
      const newRef = push(ref(db, `notifications/${deviceId}`));
      await set(newRef, { ...n, read: false, timestamp: Date.now() });
    },
    [deviceId]
  );

  const clearAll = useCallback(async () => {
    if (!deviceId) return;
    try {
      await set(ref(db, `notifications/${deviceId}`), null);
      setNotifications([]);
      await AsyncStorage.removeItem(LOCAL_KEY);
    } catch {}
  }, [deviceId]);

  return (
    <NotifContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead, addNotification, clearAll }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
