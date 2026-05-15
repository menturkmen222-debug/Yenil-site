import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, onValue, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCc3EdDkk_Bhvw8TphLj60aJSXtyWwWpZw",
  authDomain: "yenil-app.firebaseapp.com",
  databaseURL: "https://yenil-app-default-rtdb.firebaseio.com",
  projectId: "yenil-app",
  storageBucket: "yenil-app.appspot.com",
  messagingProjectId: "yenil-app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, push, onValue, update };

export function generateOrderId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export async function saveOrder(path: string, data: Record<string, unknown>): Promise<string> {
  const ordersRef = ref(db, path);
  const newRef = push(ordersRef);
  await set(newRef, { ...data, timestamp: new Date().toISOString(), created: Date.now() });
  return newRef.key || "";
}

export async function getUserBalance(deviceId: string): Promise<number> {
  try {
    const snap = await get(ref(db, `user-balances/${deviceId}`));
    if (snap.exists()) return snap.val().balance ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

export async function deductBalance(deviceId: string, amount: number): Promise<boolean> {
  try {
    const current = await getUserBalance(deviceId);
    if (current < amount) return false;
    await set(ref(db, `user-balances/${deviceId}`), {
      balance: current - amount,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}
