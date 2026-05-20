import { db, ref, push, set, get, onValue } from "./firebase";
import { getDeviceIdAsync } from "./deviceId";

export type HyzmatCategory =
  | "transport"
  | "repair"
  | "beauty"
  | "food"
  | "education"
  | "digital"
  | "home"
  | "other";

export interface HyzmatItem {
  id: string;
  deviceId: string;
  ownerName: string;
  title: string;
  description: string;
  category: HyzmatCategory;
  phone: string;
  location: string;
  price: string;
  timestamp: number;
}

export const HYZMAT_CATEGORIES: {
  key: HyzmatCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "transport",  label: "Ulag / Transport", emoji: "🚌", color: "#3b82f6" },
  { key: "repair",     label: "Bejeriş / Usta",   emoji: "🔧", color: "#f59e0b" },
  { key: "beauty",     label: "Gözellik / Saç",    emoji: "💇", color: "#ec4899" },
  { key: "food",       label: "Nahar / Kafe",       emoji: "🍽️", color: "#ef4444" },
  { key: "education",  label: "Bilim / Okuw",       emoji: "📚", color: "#8b5cf6" },
  { key: "digital",    label: "SMM / Dizaýn",       emoji: "📱", color: "#06b6d4" },
  { key: "home",       label: "Öý hyzmatlary",      emoji: "🏠", color: "#10b981" },
  { key: "other",      label: "Beýleki",            emoji: "⚡", color: "#64748b" },
];

const PATH = "hyzmatlar-v1";

export async function addHyzmat(
  item: Omit<HyzmatItem, "id" | "timestamp" | "deviceId">
): Promise<string> {
  const deviceId = await getDeviceIdAsync();
  const newRef = push(ref(db, PATH));
  await set(newRef, {
    ...item,
    deviceId,
    timestamp: Date.now(),
  });
  return newRef.key || "";
}

export function listenHyzmatlar(
  callback: (items: HyzmatItem[]) => void
): () => void {
  const unsub = onValue(ref(db, PATH), (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const items: HyzmatItem[] = [];
    snap.forEach((child) => {
      items.push({ id: child.key || "", ...child.val() } as HyzmatItem);
    });
    items.sort((a, b) => b.timestamp - a.timestamp);
    callback(items);
  });
  return () => unsub();
}

export async function getMyHyzmatlar(deviceId: string): Promise<HyzmatItem[]> {
  const snap = await get(ref(db, PATH));
  if (!snap.exists()) return [];
  const all: HyzmatItem[] = [];
  snap.forEach((child) => {
    const val = child.val() as HyzmatItem;
    if (val.deviceId === deviceId) {
      all.push({ ...val, id: child.key || "" });
    }
  });
  return all.sort((a, b) => b.timestamp - a.timestamp);
}
