import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "yenil_order_history_v1";

export type OrderType = "bonus-buy" | "bonus-sell" | "currency-buy" | "currency-sell" | "sim";

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
    if (existing.length > 100) existing.splice(100);
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

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}
