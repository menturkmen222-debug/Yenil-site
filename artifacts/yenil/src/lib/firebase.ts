import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, onValue, update, remove, query, orderByChild, limitToLast } from "firebase/database";

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

// ─── User Nickname ───────────────────────────────────────────────────────────

export async function setUserNickname(deviceId: string, nickname: string): Promise<void> {
  await set(ref(db, `user-profiles/${deviceId}/nickname`), nickname.trim());
}

export async function getUserNickname(deviceId: string): Promise<string> {
  try {
    const snap = await get(ref(db, `user-profiles/${deviceId}/nickname`));
    return snap.exists() ? String(snap.val()) : "";
  } catch {
    return "";
  }
}

// ─── Reputation ──────────────────────────────────────────────────────────────

export interface ReputationEntry {
  type: "positive" | "negative" | "neutral";
  reason: string;
  delta: number;
  timestamp: string;
  isPublic: boolean;
}

export interface ReputationData {
  score: number;
  entries: ReputationEntry[];
}

export async function getReputation(deviceId: string): Promise<ReputationData> {
  try {
    const snap = await get(ref(db, `reputation/${deviceId}`));
    if (!snap.exists()) return { score: 20, entries: [] };
    const val = snap.val();
    const entries: ReputationEntry[] = [];
    if (val.history) {
      Object.values(val.history).forEach((e: unknown) => entries.push(e as ReputationEntry));
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return { score: val.score ?? 20, entries };
  } catch {
    return { score: 20, entries: [] };
  }
}

export function watchReputation(deviceId: string, cb: (data: ReputationData) => void): () => void {
  const r = ref(db, `reputation/${deviceId}`);
  return onValue(r, snap => {
    if (!snap.exists()) { cb({ score: 20, entries: [] }); return; }
    const val = snap.val();
    const entries: ReputationEntry[] = [];
    if (val.history) {
      Object.values(val.history).forEach((e: unknown) => entries.push(e as ReputationEntry));
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    cb({ score: val.score ?? 20, entries });
  });
}

export async function saveReputationEntry(deviceId: string, entry: ReputationEntry): Promise<void> {
  const current = await getReputation(deviceId);
  const newScore = Math.max(0, Math.min(100, current.score + entry.delta));
  const histRef = push(ref(db, `reputation/${deviceId}/history`));
  await set(histRef, entry);
  await set(ref(db, `reputation/${deviceId}/score`), newScore);
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export interface DisputeData {
  reporterDeviceId: string;
  targetDeviceId: string;
  description: string;
  evidence: string;
  status: "pending";
}

export async function saveDispute(data: DisputeData): Promise<string> {
  const r = push(ref(db, "disputes"));
  await set(r, { ...data, timestamp: new Date().toISOString() });
  return r.key || "";
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface FriendEntry {
  deviceId: string;
  nickname: string;
  addedAt: string;
}

export async function getFriends(myDeviceId: string): Promise<FriendEntry[]> {
  try {
    const snap = await get(ref(db, `friends/${myDeviceId}`));
    if (!snap.exists()) return [];
    const result: FriendEntry[] = [];
    snap.forEach(child => {
      result.push({ deviceId: child.key || "", ...child.val() });
    });
    return result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch {
    return [];
  }
}

export function watchFriends(myDeviceId: string, cb: (friends: FriendEntry[]) => void): () => void {
  const r = ref(db, `friends/${myDeviceId}`);
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: FriendEntry[] = [];
    snap.forEach(child => {
      result.push({ deviceId: child.key || "", ...child.val() });
    });
    result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    cb(result);
  });
}

export async function addFriend(myDeviceId: string, friendId: string, nickname?: string): Promise<void> {
  const sanitized = friendId.trim();
  if (!sanitized || sanitized === myDeviceId) throw new Error("invalid_id");
  const friendNickname = nickname?.trim() || (await getUserNickname(sanitized)) || sanitized.slice(0, 12) + "...";
  await set(ref(db, `friends/${myDeviceId}/${sanitized}`), {
    nickname: friendNickname,
    addedAt: new Date().toISOString(),
  });
}

export async function removeFriend(myDeviceId: string, friendId: string): Promise<void> {
  await remove(ref(db, `friends/${myDeviceId}/${friendId}`));
}

// ─── BP Transfer ─────────────────────────────────────────────────────────────

export interface BPTransfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  note: string;
  timestamp: string;
  fromNickname?: string;
  toNickname?: string;
}

export async function transferBP(
  fromId: string,
  toId: string,
  amount: number,
  note = ""
): Promise<{ success: boolean; message: string }> {
  try {
    const sanitizedTo = toId.trim();
    if (!sanitizedTo || sanitizedTo === fromId) {
      return { success: false, message: "Nädogry ID girizildi" };
    }
    if (amount <= 0) {
      return { success: false, message: "Mukdar nädogry" };
    }

    const senderBalance = await getUserBalance(fromId);
    if (senderBalance < amount) {
      return { success: false, message: `Hasabyňyzda ýeterlik BP ýok (${senderBalance.toFixed(2)} BP)` };
    }

    const recipientSnap = await get(ref(db, `user-balances/${sanitizedTo}`));
    const recipientBalance = recipientSnap.exists() ? (recipientSnap.val().balance ?? 0) : 0;

    const [fromNickname, toNickname] = await Promise.all([
      getUserNickname(fromId),
      getUserNickname(sanitizedTo),
    ]);

    const now = new Date().toISOString();

    await set(ref(db, `user-balances/${fromId}`), {
      balance: senderBalance - amount,
      updatedAt: now,
    });

    await set(ref(db, `user-balances/${sanitizedTo}`), {
      balance: recipientBalance + amount,
      updatedAt: now,
    });

    const transferRef = push(ref(db, "bp-transfers"));
    await set(transferRef, {
      from: fromId,
      to: sanitizedTo,
      amount,
      note: note.trim(),
      timestamp: now,
      fromNickname: fromNickname || fromId.slice(0, 12),
      toNickname: toNickname || sanitizedTo.slice(0, 12),
    });

    return { success: true, message: `${amount} BP üstünlikli geçirildi!` };
  } catch {
    return { success: false, message: "Geçirme ýerine ýetirilmedi, täzeden synanyşyň" };
  }
}

export async function getBPTransferHistory(deviceId: string): Promise<BPTransfer[]> {
  try {
    const snap = await get(query(ref(db, "bp-transfers"), orderByChild("timestamp"), limitToLast(50)));
    if (!snap.exists()) return [];
    const result: BPTransfer[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.from === deviceId || val.to === deviceId) {
        result.push({ id: child.key || "", ...val });
      }
    });
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}
