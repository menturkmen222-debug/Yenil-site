import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "yenil_device_id";

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

let cachedId: string | null = null;

export async function clearDeviceId(): Promise<void> {
  cachedId = null;
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {}
}

export async function getDeviceIdAsync(): Promise<string> {
  if (cachedId) return cachedId;
  try {
    if (Platform.OS === "web") {
      const stored = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
      if (stored) { cachedId = stored; return stored; }
      const newId = makeId();
      if (typeof localStorage !== "undefined") localStorage.setItem(KEY, newId);
      cachedId = newId;
      return newId;
    }
    const stored = await SecureStore.getItemAsync(KEY);
    if (stored) { cachedId = stored; return stored; }
    const newId = makeId();
    await SecureStore.setItemAsync(KEY, newId);
    cachedId = newId;
    return newId;
  } catch {
    if (!cachedId) cachedId = makeId();
    return cachedId;
  }
}
