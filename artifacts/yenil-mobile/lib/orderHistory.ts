import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "yenil_order_history_v1";

export type OrderType = "bonus-buy" | "bonus-sell" | "currency-buy" | "currency-sell" | "sim" | "demiryol" | "walýuta" | "howa-bilet";

export interface OrderHistoryItem {
  id: string;
  type: OrderType;
  title: string;
  details: string;
  amount: number;
  amountLabel: string;
  timestamp: number;
  phone?: string;
  walletId?: string;
  crypto?: string;
  currency?: string;
  operator?: string;
  simPhone?: string;
  extraData?: Record<string, unknown>;
}

export async function addToHistory(
  item: Omit<OrderHistoryItem, "id" | "timestamp">
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const existing: OrderHistoryItem[] = raw ? JSON.parse(raw) : [];
    const newItem: OrderHistoryItem = {
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
    };
    existing.unshift(newItem);
    if (existing.length > 200) existing.splice(200);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
  } catch {}
}

export async function getHistory(): Promise<OrderHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const existing: OrderHistoryItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Indi";
  if (mins < 60) return `${mins} min öň`;
  if (hours < 24) return `${hours} sag öň`;
  if (days < 7) return `${days} gün öň`;
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

export function groupByDate(items: OrderHistoryItem[]): { date: string; data: OrderHistoryItem[] }[] {
  const map = new Map<string, OrderHistoryItem[]>();
  for (const item of items) {
    const d = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Şu gün";
    else if (d.toDateString() === yesterday.toDateString()) label = "Düýn";
    else label = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([date, data]) => ({ date, data }));
}
