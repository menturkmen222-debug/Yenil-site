import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase, ref, set, get, push, onValue, update, remove,
  query, orderByChild, limitToLast, equalTo, runTransaction,
} from "firebase/database";
import { COMMISSION_RATES, MIN_CASHOUT_BP } from "@/lib/payments";

const firebaseConfig = {
  apiKey: "AIzaSyBGu5beomNMKW12amssM8GLiEK-8M0Y-iU",
  authDomain: "yenil-f8c12.firebaseapp.com",
  databaseURL: "https://yenil-f8c12-default-rtdb.firebaseio.com",
  projectId: "yenil-f8c12",
  storageBucket: "yenil-f8c12.firebasestorage.app",
  messagingSenderId: "405972999183",
  appId: "1:405972999183:android:0563331ffb77d7373ed77a",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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

// ─── Balance ──────────────────────────────────────────────────────────────────

/**
 * Jemi BP (real + bonus) — diňe görkezmek üçin.
 * Çykaryş üçin getUserRealBalance() ulanyň.
 */
export async function getUserBalance(deviceId: string): Promise<number> {
  try {
    const snap = await get(ref(db, `user-balances/${deviceId}`));
    if (snap.exists()) {
      const v = snap.val();
      return (v.balance ?? 0) + (v.bonusBalance ?? 0);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Diňe hakyky BP (TMT → BP çalyşylandan gelen) — çykaryş üçin.
 * Bonus BP (sowgat, referal, e-bilim) bu ýere girmeýär.
 */
export async function getUserRealBalance(deviceId: string): Promise<number> {
  try {
    const snap = await get(ref(db, `user-balances/${deviceId}`));
    if (snap.exists()) return snap.val().balance ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

/** Hakyky BP goş (TMT → BP agent çalşy). Çykarylyp bilner. */
export async function addBalance(deviceId: string, amount: number): Promise<void> {
  const snap = await get(ref(db, `user-balances/${deviceId}`));
  const cur = snap.exists() ? (snap.val().balance ?? 0) : 0;
  await update(ref(db, `user-balances/${deviceId}`), {
    balance: cur + amount,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Bonus BP goş — tizim tarapyndan berilýän sylag (sowgat, referal, e-bilim...).
 * Bu BP çykarylyp bilmez, diňe içerde ulanylyp bilner.
 */
export async function addBonusBalance(deviceId: string, amount: number): Promise<void> {
  try {
    const snap = await get(ref(db, `user-balances/${deviceId}`));
    const cur = snap.exists() ? (snap.val().bonusBalance ?? 0) : 0;
    await update(ref(db, `user-balances/${deviceId}`), {
      bonusBalance: cur + amount,
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

/**
 * BP aýyr (içerde harçlamak üçin — bonus first, soň hakyky).
 * Çykaryş üçin cashout screenlerinde getUserRealBalance() barlaň.
 */
export async function deductBalance(deviceId: string, amount: number): Promise<boolean> {
  try {
    const snap = await get(ref(db, `user-balances/${deviceId}`));
    const val = snap.exists() ? snap.val() : {};
    const real  = val.balance      ?? 0;
    const bonus = val.bonusBalance ?? 0;
    const total = real + bonus;
    if (total < amount) return false;
    // Bonus öňi bilen harçlanýar
    const newBonus = Math.max(0, bonus - amount);
    const remainder = amount - (bonus - newBonus);
    const newReal  = Math.max(0, real - remainder);
    await update(ref(db, `user-balances/${deviceId}`), {
      balance: newReal,
      bonusBalance: newBonus,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Gündelik Sowgat (Daily Gift) ────────────────────────────────────────────

/**
 * Gündelik sowgat alyş. Her 24 sagatda 1 gezek.
 * Firebase: `users/{deviceId}/lastGiftDate` (YYYY-MM-DD)
 *
 * Sylag (tizim tarapyndan bellenilýär):
 *   • 95% ähtimallyk — 0.01–0.10 BP
 *   •  5% ähtimallyk — 2.00 BP (seýrek)
 *
 * Berlen BP bonus balansa goşulýar (çykarylyp bilmez).
 */
export async function claimDailyGift(
  deviceId: string
): Promise<{ canClaim: boolean; reward?: number }> {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Anti-cheat: serwerde saklanýan sene
    const lastSnap = await get(ref(db, `users/${deviceId}/lastGiftDate`));
    if (lastSnap.exists() && lastSnap.val() === today) {
      return { canClaim: false };
    }

    // Sylag kesgitle
    const rand = Math.random();
    const reward = rand < 0.05
      ? 2
      : Math.round((Math.random() * 0.09 + 0.01) * 100) / 100;

    // Serwerde senäni ýazgyla (anti-cheat)
    await set(ref(db, `users/${deviceId}/lastGiftDate`), today);

    // Bonus balansa goş
    await addBonusBalance(deviceId, reward);

    // Tranzaksiýa ýazgyla
    const txRef = push(ref(db, `transactions/${deviceId}`));
    await set(txRef, {
      type: "bonus",
      label: "Gündelik Sowgat",
      amount: reward,
      direction: "in",
      timestamp: new Date().toISOString(),
    });

    return { canClaim: true, reward };
  } catch {
    return { canClaim: false };
  }
}

export async function checkDailyGiftClaimed(deviceId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const snap = await get(ref(db, `users/${deviceId}/lastGiftDate`));
    return snap.exists() && snap.val() === today;
  } catch {
    return false;
  }
}

// ─── Nickname ─────────────────────────────────────────────────────────────────

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
  const fn = nickname?.trim() || (await getUserNickname(sanitized)) || sanitized.slice(0, 12) + "...";
  await set(ref(db, `friends/${myDeviceId}/${sanitized}`), {
    nickname: fn,
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
    if (!sanitizedTo || sanitizedTo === fromId)
      return { success: false, message: "Nädogry ID girizildi" };
    if (amount <= 0)
      return { success: false, message: "Mukdar nädogry" };

    const senderBalance = await getUserBalance(fromId);
    if (senderBalance < amount)
      return { success: false, message: `Hasabyňyzda ýeterlik BP ýok (${senderBalance.toFixed(2)} BP)` };

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
      if (val.from === deviceId || val.to === deviceId)
        result.push({ id: child.key || "", ...val });
    });
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════
//  PUL GAZAN — EARN MONEY ECOSYSTEM
// ══════════════════════════════════════════════════════════════════

// ─── Referral System ─────────────────────────────────────────────────────────

export interface ReferralStats {
  code: string;
  totalJoins: number;
  totalEarned: number;
  passiveEarned: number;
}

function makeReferralCode(deviceId: string): string {
  const base = deviceId.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 4);
  return (base + suffix).slice(0, 8);
}

export async function getOrCreateReferralCode(deviceId: string): Promise<string> {
  try {
    const snap = await get(ref(db, `user-profiles/${deviceId}/referralCode`));
    if (snap.exists()) return String(snap.val());
    const code = makeReferralCode(deviceId);
    await set(ref(db, `user-profiles/${deviceId}/referralCode`), code);
    await set(ref(db, `referral-codes/${code}`), { ownerDeviceId: deviceId, createdAt: new Date().toISOString() });
    return code;
  } catch {
    return makeReferralCode(deviceId);
  }
}

export async function applyReferralCode(newUserDeviceId: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const codeSnap = await get(ref(db, `referral-codes/${code.trim().toUpperCase()}`));
    if (!codeSnap.exists()) return { success: false, message: "Nädogry referral kod" };
    const { ownerDeviceId } = codeSnap.val() as { ownerDeviceId: string };
    if (ownerDeviceId === newUserDeviceId) return { success: false, message: "Öz kodunuzy ulanyp bilmersiňiz" };

    const alreadyUsed = await get(ref(db, `user-profiles/${newUserDeviceId}/referredBy`));
    if (alreadyUsed.exists()) return { success: false, message: "Siz eýýäm referral kod ulanypsyňyz" };

    await set(ref(db, `user-profiles/${newUserDeviceId}/referredBy`), ownerDeviceId);
    await set(ref(db, `referral-joins/${ownerDeviceId}/${newUserDeviceId}`), { joinedAt: new Date().toISOString() });

    const joinBonus = 0.5;
    await addBonusBalance(ownerDeviceId, joinBonus);
    await saveReputationEntry(ownerDeviceId, {
      type: "positive",
      reason: "Täze agza çagyryldy (Referral)",
      delta: 1,
      timestamp: new Date().toISOString(),
      isPublic: true,
    });

    return { success: true, message: `Üstünlikli! ${ownerDeviceId.slice(0, 8)}... 0.5 BP aldy` };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function getReferralStats(deviceId: string): Promise<ReferralStats> {
  try {
    const [codeSnap, joinsSnap, earningsSnap] = await Promise.all([
      get(ref(db, `user-profiles/${deviceId}/referralCode`)),
      get(ref(db, `referral-joins/${deviceId}`)),
      get(ref(db, `referral-earnings/${deviceId}`)),
    ]);
    const code = codeSnap.exists() ? String(codeSnap.val()) : await getOrCreateReferralCode(deviceId);
    const totalJoins = joinsSnap.exists() ? Object.keys(joinsSnap.val()).length : 0;
    const earnings = earningsSnap.exists() ? earningsSnap.val() : { total: 0, passive: 0 };
    return {
      code,
      totalJoins,
      totalEarned: earnings.total ?? 0,
      passiveEarned: earnings.passive ?? 0,
    };
  } catch {
    return { code: "", totalJoins: 0, totalEarned: 0, passiveEarned: 0 };
  }
}

export async function addPassiveReferralCommission(deviceId: string, amount = 0.2): Promise<void> {
  try {
    const referredBySnap = await get(ref(db, `user-profiles/${deviceId}/referredBy`));
    if (!referredBySnap.exists()) return;
    const referrerId = String(referredBySnap.val());
    await addBonusBalance(referrerId, amount);
    const earningsSnap = await get(ref(db, `referral-earnings/${referrerId}`));
    const cur = earningsSnap.exists() ? earningsSnap.val() : { total: 0, passive: 0 };
    await set(ref(db, `referral-earnings/${referrerId}`), {
      total: (cur.total ?? 0) + amount,
      passive: (cur.passive ?? 0) + amount,
      updatedAt: new Date().toISOString(),
    });
  } catch {
  }
}

// ─── Agent Deposit (TMT → BP) ─────────────────────────────────────────────────

export const ADMIN_CARD_NUMBER = "8600 3497 5521 7384";
export const ADMIN_CARD_HOLDER = "Ý. Haýytjanow";
export const BP_BONUS_PERCENT = 15;

export interface AgentDeposit {
  id: string;
  deviceId: string;
  tmtAmount: number;
  bpAmount: number;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  confirmedAt?: string;
  note?: string;
}

export async function createAgentDeposit(deviceId: string, tmtAmount: number): Promise<string> {
  const bpAmount = tmtAmount * (1 + BP_BONUS_PERCENT / 100);
  const r = push(ref(db, "agent-deposits"));
  await set(r, {
    deviceId,
    tmtAmount,
    bpAmount: Math.round(bpAmount * 100) / 100,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return r.key || "";
}

export function watchAgentDeposits(deviceId: string, cb: (deps: AgentDeposit[]) => void): () => void {
  const r = ref(db, "agent-deposits");
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: AgentDeposit[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.deviceId === deviceId) result.push({ id: child.key || "", ...val });
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

// ─── Road Reports — Informator ────────────────────────────────────────────────

export type RoadReportType = "gai" | "probka" | "yopyk" | "basha";

export interface RoadReport {
  id: string;
  type: RoadReportType;
  location: string;
  description: string;
  reporterDeviceId: string;
  reporterNickname: string;
  upvotes: Record<string, boolean>;
  upvoteCount: number;
  rewarded: boolean;
  active: boolean;
  createdAt: string;
}

export async function createRoadReport(
  reporterDeviceId: string,
  type: RoadReportType,
  location: string,
  description: string
): Promise<string> {
  const nickname = await getUserNickname(reporterDeviceId);
  const r = push(ref(db, "road-reports"));
  await set(r, {
    type,
    location: location.trim(),
    description: description.trim(),
    reporterDeviceId,
    reporterNickname: nickname || reporterDeviceId.slice(0, 10),
    upvotes: {},
    upvoteCount: 0,
    rewarded: false,
    active: true,
    createdAt: new Date().toISOString(),
  });
  return r.key || "";
}

export async function upvoteRoadReport(reportId: string, voterDeviceId: string): Promise<{ rewarded: boolean }> {
  try {
    const reportSnap = await get(ref(db, `road-reports/${reportId}`));
    if (!reportSnap.exists()) return { rewarded: false };
    const report = reportSnap.val() as Omit<RoadReport, "id">;

    if (report.reporterDeviceId === voterDeviceId) return { rewarded: false };
    if (report.upvotes?.[voterDeviceId]) return { rewarded: false };

    const newCount = (report.upvoteCount ?? 0) + 1;
    await update(ref(db, `road-reports/${reportId}`), {
      [`upvotes/${voterDeviceId}`]: true,
      upvoteCount: newCount,
    });

    if (newCount >= 3 && !report.rewarded) {
      await update(ref(db, `road-reports/${reportId}`), { rewarded: true });
      await addBonusBalance(report.reporterDeviceId, 1);
      await saveReputationEntry(report.reporterDeviceId, {
        type: "positive",
        reason: "Informator sylagy — 3 tassyklama aldy",
        delta: 2,
        timestamp: new Date().toISOString(),
        isPublic: true,
      });
      return { rewarded: true };
    }
    return { rewarded: false };
  } catch {
    return { rewarded: false };
  }
}

export function watchRoadReports(cb: (reports: RoadReport[]) => void): () => void {
  const r = query(ref(db, "road-reports"), orderByChild("createdAt"), limitToLast(30));
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: RoadReport[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.active) result.push({ id: child.key || "", ...val });
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

// ─── Crypto P2P — USDT ↔ BP ──────────────────────────────────────────────────

export type CryptoAdType = "sell_usdt" | "buy_usdt";

export interface CryptoAd {
  id: string;
  type: CryptoAdType;
  ownerDeviceId: string;
  ownerNickname: string;
  ownerRepScore: number;
  usdtAmount: number;
  bpPerUsdt: number;
  totalBP: number;
  status: "open" | "locked" | "completed" | "cancelled";
  escrow?: {
    buyerDeviceId: string;
    lockedBP: number;
    lockedAt: string;
  };
  createdAt: string;
}

export async function createCryptoAd(
  ownerDeviceId: string,
  type: CryptoAdType,
  usdtAmount: number,
  bpPerUsdt: number
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const rep = await getReputation(ownerDeviceId);
    if (rep.score < 45) {
      return { success: false, message: "Kripto birjasy üçin abraý derejeniz ýeterlik däl (min 45 bal)" };
    }
    const nickname = await getUserNickname(ownerDeviceId);
    const totalBP = usdtAmount * bpPerUsdt;

    if (type === "sell_usdt") {
      const deducted = await deductBalance(ownerDeviceId, totalBP);
      if (!deducted) return { success: false, message: `Ýeterlik BP ýok (${totalBP.toFixed(2)} BP gerek)` };
    }

    const r = push(ref(db, "crypto-ads"));
    await set(r, {
      type,
      ownerDeviceId,
      ownerNickname: nickname || ownerDeviceId.slice(0, 10),
      ownerRepScore: rep.score,
      usdtAmount,
      bpPerUsdt,
      totalBP: Math.round(totalBP * 100) / 100,
      status: "open",
      createdAt: new Date().toISOString(),
    });
    return { success: true, message: "E'lon ýerleşdirildi!", id: r.key || "" };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function initiateCryptoTrade(
  adId: string,
  buyerDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adSnap = await get(ref(db, `crypto-ads/${adId}`));
    if (!adSnap.exists()) return { success: false, message: "E'lon tapylmady" };
    const ad = adSnap.val() as Omit<CryptoAd, "id">;

    if (ad.status !== "open") return { success: false, message: "Bu e'lon eýýäm band" };
    if (ad.ownerDeviceId === buyerDeviceId) return { success: false, message: "Öz e'lonyňyzy satyn alyp bilmersiňiz" };

    if (ad.type === "buy_usdt") {
      const deducted = await deductBalance(buyerDeviceId, ad.totalBP);
      if (!deducted) return { success: false, message: `Ýeterlik BP ýok (${ad.totalBP.toFixed(2)} BP gerek)` };
    }

    await update(ref(db, `crypto-ads/${adId}`), {
      status: "locked",
      escrow: {
        buyerDeviceId,
        lockedBP: ad.totalBP,
        lockedAt: new Date().toISOString(),
      },
    });

    await push(ref(db, "crypto-chat"), {
      adId,
      from: "system",
      text: `Söwda başlandy. BP eskroda saklanýar. Admin tassyklamasyny garaşyň.`,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: "Söwda başlandy! Admin tassyklamasyny garaşyň." };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export function watchCryptoAds(cb: (ads: CryptoAd[]) => void): () => void {
  const r = query(ref(db, "crypto-ads"), orderByChild("createdAt"), limitToLast(50));
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: CryptoAd[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.status === "open" || val.status === "locked") {
        result.push({ id: child.key || "", ...val });
      }
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

export async function cancelCryptoAd(adId: string, ownerDeviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const adSnap = await get(ref(db, `crypto-ads/${adId}`));
    if (!adSnap.exists()) return { success: false, message: "Tapylmady" };
    const ad = adSnap.val() as Omit<CryptoAd, "id">;
    if (ad.ownerDeviceId !== ownerDeviceId) return { success: false, message: "Rugsat ýok" };
    if (ad.status !== "open") return { success: false, message: "Diňe açyk e'lonlary ýatyrsa bolýar" };

    if (ad.type === "sell_usdt") {
      await addBalance(ownerDeviceId, ad.totalBP);
    }
    await update(ref(db, `crypto-ads/${adId}`), { status: "cancelled" });
    return { success: true, message: "E'lon ýatyryldy" };
  } catch {
    return { success: false, message: "Ýalňyşlyk" };
  }
}

// ─── Nagt Cashout — Cash P2P ──────────────────────────────────────────────────

export type NagtOrderStatus = "open" | "matched" | "completed" | "cancelled";

export interface NagtOrder {
  id: string;
  userDeviceId: string;
  userNickname: string;
  bpAmount: number;
  tmtEquivalent: number;
  city: string;
  status: NagtOrderStatus;
  agentDeviceId?: string;
  agentNickname?: string;
  createdAt: string;
  matchedAt?: string;
}

export const NAGT_RATE = 1;

export async function createNagtOrder(
  userDeviceId: string,
  bpAmount: number,
  city: string
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    if (bpAmount < 10) return { success: false, message: "Minimum 10 BP çykaryp bolýar" };
    const deducted = await deductBalance(userDeviceId, bpAmount);
    if (!deducted) return { success: false, message: `Ýeterlik BP ýok (${bpAmount} BP gerek)` };

    const nickname = await getUserNickname(userDeviceId);
    const r = push(ref(db, "nagt-orders"));
    await set(r, {
      userDeviceId,
      userNickname: nickname || userDeviceId.slice(0, 10),
      bpAmount,
      tmtEquivalent: bpAmount * NAGT_RATE,
      city: city.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
    });
    return { success: true, message: "Sargyt ýerleşdirildi!", id: r.key || "" };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function acceptNagtOrder(
  orderId: string,
  agentDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const orderSnap = await get(ref(db, `nagt-orders/${orderId}`));
    if (!orderSnap.exists()) return { success: false, message: "Sargyt tapylmady" };
    const order = orderSnap.val() as Omit<NagtOrder, "id">;

    if (order.status !== "open") return { success: false, message: "Bu sargyt eýýäm band" };
    if (order.userDeviceId === agentDeviceId) return { success: false, message: "Öz sargytyňyzy kabul edip bilmersiňiz" };

    const rep = await getReputation(agentDeviceId);
    if (rep.score < 30) return { success: false, message: "Agent bolmak üçin abraý derejeniz ýeterlik däl (min 30 bal)" };

    const agentNickname = await getUserNickname(agentDeviceId);
    await update(ref(db, `nagt-orders/${orderId}`), {
      status: "matched",
      agentDeviceId,
      agentNickname: agentNickname || agentDeviceId.slice(0, 10),
      matchedAt: new Date().toISOString(),
    });
    return { success: true, message: "Sargyt kabul edildi! Ulanyjy bilen habarlaşyň." };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function completeNagtOrder(
  orderId: string,
  agentDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const orderSnap = await get(ref(db, `nagt-orders/${orderId}`));
    if (!orderSnap.exists()) return { success: false, message: "Tapylmady" };
    const order = orderSnap.val() as Omit<NagtOrder, "id">;
    if (order.agentDeviceId !== agentDeviceId) return { success: false, message: "Rugsat ýok" };
    if (order.status !== "matched") return { success: false, message: "Sargyt dürli ýagdaýda" };

    await addBalance(agentDeviceId, order.bpAmount);
    await update(ref(db, `nagt-orders/${orderId}`), { status: "completed", completedAt: new Date().toISOString() });
    await saveReputationEntry(agentDeviceId, {
      type: "positive", reason: "Nagt P2P söwda tamamlandy", delta: 2,
      timestamp: new Date().toISOString(), isPublic: true,
    });
    await saveReputationEntry(order.userDeviceId, {
      type: "positive", reason: "Nagt P2P söwda tamamlandy", delta: 1,
      timestamp: new Date().toISOString(), isPublic: true,
    });
    return { success: true, message: "Söwda tamamlandy!" };
  } catch {
    return { success: false, message: "Ýalňyşlyk" };
  }
}

export function watchNagtOrders(cb: (orders: NagtOrder[]) => void): () => void {
  const r = query(ref(db, "nagt-orders"), orderByChild("createdAt"), limitToLast(40));
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: NagtOrder[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.status === "open" || val.status === "matched") {
        result.push({ id: child.key || "", ...val });
      }
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

// ─── Micro-tasks — Kuryer ─────────────────────────────────────────────────────

export type MicroTaskStatus = "open" | "taken" | "completed" | "cancelled";

export interface MicroTask {
  id: string;
  from: string;
  to: string;
  description: string;
  reward: number;
  weight?: string;
  posterDeviceId: string;
  posterNickname: string;
  courierDeviceId?: string;
  courierNickname?: string;
  status: MicroTaskStatus;
  createdAt: string;
  completedAt?: string;
}

export async function createMicroTask(
  posterDeviceId: string,
  from: string,
  to: string,
  description: string,
  reward: number,
  weight?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    if (reward < 5) return { success: false, message: "Minimum sylag 5 BP" };
    const deducted = await deductBalance(posterDeviceId, reward);
    if (!deducted) return { success: false, message: `Ýeterlik BP ýok (${reward} BP gerek)` };

    const nickname = await getUserNickname(posterDeviceId);
    const r = push(ref(db, "micro-tasks"));
    await set(r, {
      from: from.trim(),
      to: to.trim(),
      description: description.trim(),
      reward,
      weight: weight?.trim() || "",
      posterDeviceId,
      posterNickname: nickname || posterDeviceId.slice(0, 10),
      status: "open",
      createdAt: new Date().toISOString(),
    });
    return { success: true, message: "Tapşyryk ýerleşdirildi!", id: r.key || "" };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function acceptMicroTask(
  taskId: string,
  courierDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const taskSnap = await get(ref(db, `micro-tasks/${taskId}`));
    if (!taskSnap.exists()) return { success: false, message: "Tapşyryk tapylmady" };
    const task = taskSnap.val() as Omit<MicroTask, "id">;
    if (task.status !== "open") return { success: false, message: "Bu tapşyryk eýýäm band" };
    if (task.posterDeviceId === courierDeviceId) return { success: false, message: "Öz tapşyrygyňyzy kabul edip bilmersiňiz" };

    const nickname = await getUserNickname(courierDeviceId);
    await update(ref(db, `micro-tasks/${taskId}`), {
      status: "taken",
      courierDeviceId,
      courierNickname: nickname || courierDeviceId.slice(0, 10),
      takenAt: new Date().toISOString(),
    });
    return { success: true, message: "Tapşyryk kabul edildi! Buýrujy bilen habarlaşyň." };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function completeMicroTask(
  taskId: string,
  courierDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const taskSnap = await get(ref(db, `micro-tasks/${taskId}`));
    if (!taskSnap.exists()) return { success: false, message: "Tapylmady" };
    const task = taskSnap.val() as Omit<MicroTask, "id">;
    if (task.courierDeviceId !== courierDeviceId) return { success: false, message: "Rugsat ýok" };
    if (task.status !== "taken") return { success: false, message: "Tapşyryk dürli ýagdaýda" };

    await addBalance(courierDeviceId, task.reward);
    await update(ref(db, `micro-tasks/${taskId}`), { status: "completed", completedAt: new Date().toISOString() });
    await saveReputationEntry(courierDeviceId, {
      type: "positive", reason: "Kuryer tapşyrygy tamamlandy",
      delta: 3, timestamp: new Date().toISOString(), isPublic: true,
    });
    await saveReputationEntry(task.posterDeviceId, {
      type: "positive", reason: "Kuryer tapşyrygyny buýurdyňyz",
      delta: 1, timestamp: new Date().toISOString(), isPublic: true,
    });
    return { success: true, message: `${task.reward} BP hasabyňyza geçirildi!` };
  } catch {
    return { success: false, message: "Ýalňyşlyk" };
  }
}

export function watchMicroTasks(cb: (tasks: MicroTask[]) => void): () => void {
  const r = query(ref(db, "micro-tasks"), orderByChild("createdAt"), limitToLast(40));
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: MicroTask[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.status === "open" || val.status === "taken") {
        result.push({ id: child.key || "", ...val });
      }
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

// ─── Sanly Bazar — Digital Listings ──────────────────────────────────────────

export type DigitalCategory = "vpn" | "gaming" | "software" | "education" | "other";

export interface DigitalListing {
  id: string;
  title: string;
  category: DigitalCategory;
  description: string;
  price: number;
  sellerDeviceId: string;
  sellerNickname: string;
  sellerRepScore: number;
  deliveryMethod: string;
  status: "active" | "sold" | "cancelled";
  createdAt: string;
  buyerDeviceId?: string;
}

export async function createDigitalListing(
  sellerDeviceId: string,
  title: string,
  category: DigitalCategory,
  description: string,
  price: number,
  deliveryMethod: string
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    if (price < 1) return { success: false, message: "Minimum baha 1 BP" };
    const [nickname, rep] = await Promise.all([
      getUserNickname(sellerDeviceId),
      getReputation(sellerDeviceId),
    ]);
    const r = push(ref(db, "digital-listings"));
    await set(r, {
      title: title.trim(),
      category,
      description: description.trim(),
      price,
      sellerDeviceId,
      sellerNickname: nickname || sellerDeviceId.slice(0, 10),
      sellerRepScore: rep.score,
      deliveryMethod: deliveryMethod.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    });
    return { success: true, message: "Haryt ýerleşdirildi!", id: r.key || "" };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export async function buyDigitalListing(
  listingId: string,
  buyerDeviceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const snap = await get(ref(db, `digital-listings/${listingId}`));
    if (!snap.exists()) return { success: false, message: "Haryt tapylmady" };
    const listing = snap.val() as Omit<DigitalListing, "id">;

    if (listing.status !== "active") return { success: false, message: "Bu haryt eýýäm satyldy" };
    if (listing.sellerDeviceId === buyerDeviceId) return { success: false, message: "Öz harydyňyzy satyn alyp bilmersiňiz" };

    const deducted = await deductBalance(buyerDeviceId, listing.price);
    if (!deducted) return { success: false, message: `Ýeterlik BP ýok (${listing.price} BP gerek)` };

    await addBalance(listing.sellerDeviceId, listing.price);
    await update(ref(db, `digital-listings/${listingId}`), {
      status: "sold",
      buyerDeviceId,
      soldAt: new Date().toISOString(),
    });

    await addPassiveReferralCommission(listing.sellerDeviceId, 0.2);

    await saveReputationEntry(listing.sellerDeviceId, {
      type: "positive", reason: "Sanly bazar: haryt satyldy",
      delta: 2, timestamp: new Date().toISOString(), isPublic: true,
    });

    return { success: true, message: "Üstünlikli satyn alyndy! Satyjy size haryt ýollar." };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

export function watchDigitalListings(cb: (listings: DigitalListing[]) => void): () => void {
  const r = query(ref(db, "digital-listings"), orderByChild("createdAt"), limitToLast(50));
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const result: DigitalListing[] = [];
    snap.forEach(child => {
      const val = child.val();
      if (val.status === "active") result.push({ id: child.key || "", ...val });
    });
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    cb(result);
  });
}

export async function cancelDigitalListing(listingId: string, sellerDeviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const snap = await get(ref(db, `digital-listings/${listingId}`));
    if (!snap.exists()) return { success: false, message: "Tapylmady" };
    const listing = snap.val() as Omit<DigitalListing, "id">;
    if (listing.sellerDeviceId !== sellerDeviceId) return { success: false, message: "Rugsat ýok" };
    if (listing.status !== "active") return { success: false, message: "Diňe işjeň harytlary ýatyryp bolýar" };
    await update(ref(db, `digital-listings/${listingId}`), { status: "cancelled" });
    return { success: true, message: "Haryt ýatyryldy" };
  } catch {
    return { success: false, message: "Ýalňyşlyk" };
  }
}

// ─── Atomic Balance Deduction (anti-double-spend) ────────────────────────────

export async function deductBalanceAtomic(
  deviceId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const balRef = ref(db, `user-balances/${deviceId}`);
    const result = await runTransaction(balRef, (current) => {
      if (!current) return undefined;
      const bal = typeof current.balance === "number" ? current.balance : 0;
      if (bal < amount) return undefined;
      return { ...current, balance: parseFloat((bal - amount).toFixed(2)), updatedAt: new Date().toISOString() };
    });
    if (result.committed && result.snapshot.exists()) {
      return { success: true, newBalance: result.snapshot.val().balance };
    }
    return { success: false, newBalance: 0 };
  } catch {
    return { success: false, newBalance: 0 };
  }
}

// ─── Inline Top-up (credits missing BP + saves pending order) ────────────────

export async function createInlineTopUpOrder(
  deviceId: string,
  missingBP: number,
  method: "card" | "tmcell",
  serviceAmount: number,
  serviceName: string
): Promise<{ success: boolean }> {
  try {
    const commissionRate = method === "card" ? COMMISSION_RATES.bank_topup : COMMISSION_RATES.tmcell_topup;
    const tmtAmount = parseFloat((missingBP * (1 + commissionRate)).toFixed(2));
    await addBalance(deviceId, missingBP);
    await saveOrder("inline-topup-orders", {
      deviceId, missingBP, method, tmtAmount, commissionRate,
      serviceName, serviceCost: serviceAmount, status: "pending",
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ─── TMCell Cashout (BP → TMCell balance, 0.5% commission) ───────────────────

export async function createTMCellCashout(
  deviceId: string,
  bpAmount: number,
  phone: string
): Promise<{ success: boolean; message: string; commission?: number; receiveAmount?: number }> {
  try {
    if (bpAmount < MIN_CASHOUT_BP) return { success: false, message: `Minimum ${MIN_CASHOUT_BP} BP çykaryp bolýar` };
    const result = await deductBalanceAtomic(deviceId, bpAmount);
    if (!result.success) return { success: false, message: `Ýeterlik BP ýok (${bpAmount} BP gerek)` };
    const commission = parseFloat((bpAmount * COMMISSION_RATES.tmcell_cashout).toFixed(2));
    const receiveAmount = parseFloat((bpAmount - commission).toFixed(2));
    await saveOrder("tmcell-cashout-orders", {
      deviceId, bpAmount, commission, receiveAmount, phone, status: "pending",
    });
    return { success: true, message: "Çykaryş haýyşnamasy kabul edildi!", commission, receiveAmount };
  } catch {
    return { success: false, message: "Ýalňyşlyk ýüz berdi" };
  }
}

// ─── Seed Test Account (1000 BP + reputation 80) ────────────────────────────

export async function seedTestAccount(deviceId: string): Promise<void> {
  await set(ref(db, `user-balances/${deviceId}`), {
    balance: 1000,
    updatedAt: new Date().toISOString(),
  });
  const repRef = ref(db, `reputation/${deviceId}`);
  const repSnap = await get(repRef);
  const existing = repSnap.exists() ? repSnap.val() : {};
  await set(repRef, {
    ...existing,
    score: 80,
    updatedAt: new Date().toISOString(),
  });
}

// ══════════════════════════════════════════════════════════════════
//  E-BİLİM — Learn & Earn Ecosystem
// ══════════════════════════════════════════════════════════════════

export function watchCompletedLessons(
  deviceId: string,
  cb: (ids: string[]) => void
): () => void {
  const r = ref(db, `e-bilim/${deviceId}/completed`);
  return onValue(r, snap => {
    cb(snap.exists() ? Object.keys(snap.val()) : []);
  });
}

export function watchUnlockedLessons(
  deviceId: string,
  cb: (ids: string[]) => void
): () => void {
  const r = ref(db, `e-bilim/${deviceId}/unlocked`);
  return onValue(r, snap => {
    cb(snap.exists() ? Object.keys(snap.val()) : []);
  });
}

export async function submitQuizAndEarnBP(
  deviceId: string,
  lessonId: string,
  passed: boolean,
  bpReward: number
): Promise<{ alreadyClaimed: boolean; bpAwarded: number }> {
  try {
    const claimedSnap = await get(ref(db, `e-bilim/${deviceId}/completed/${lessonId}`));
    if (claimedSnap.exists()) return { alreadyClaimed: true, bpAwarded: 0 };

    await set(ref(db, `e-bilim/${deviceId}/completed/${lessonId}`), {
      completedAt: new Date().toISOString(),
      passed,
      bpAwarded: passed ? bpReward : 0,
    });

    if (passed) {
      await addBalance(deviceId, bpReward);
      const totalSnap = await get(ref(db, `e-bilim/${deviceId}/totalBPEarned`));
      const prev = totalSnap.exists() ? (totalSnap.val() as number) : 0;
      await set(ref(db, `e-bilim/${deviceId}/totalBPEarned`), prev + bpReward);
      await saveReputationEntry(deviceId, {
        type: "positive",
        reason: `E-Bilim sapak tamamlandy (+${bpReward.toFixed(2)} BP)`,
        delta: 1,
        timestamp: new Date().toISOString(),
        isPublic: false,
      });
    }

    return { alreadyClaimed: false, bpAwarded: passed ? bpReward : 0 };
  } catch {
    return { alreadyClaimed: false, bpAwarded: 0 };
  }
}

export async function unlockPremiumLesson(
  deviceId: string,
  lessonId: string,
  bpCost: number
): Promise<{ success: boolean; message: string }> {
  try {
    const snap = await get(ref(db, `e-bilim/${deviceId}/unlocked/${lessonId}`));
    if (snap.exists()) return { success: true, message: "Eýýäm açyk" };

    const result = await deductBalanceAtomic(deviceId, bpCost);
    if (!result.success) {
      return { success: false, message: `Ýeterlik BP ýok (${bpCost} BP gerek)` };
    }

    await set(ref(db, `e-bilim/${deviceId}/unlocked/${lessonId}`), {
      unlockedAt: new Date().toISOString(),
      bpSpent: bpCost,
    });

    return { success: true, message: "Sapak açyldy!" };
  } catch {
    return { success: false, message: "Açmak mümkin bolmady" };
  }
}

export async function getEBilimStats(
  deviceId: string
): Promise<{ completedCount: number; totalBPEarned: number }> {
  try {
    const [completedSnap, bpSnap] = await Promise.all([
      get(ref(db, `e-bilim/${deviceId}/completed`)),
      get(ref(db, `e-bilim/${deviceId}/totalBPEarned`)),
    ]);
    return {
      completedCount: completedSnap.exists() ? Object.keys(completedSnap.val()).length : 0,
      totalBPEarned: bpSnap.exists() ? (bpSnap.val() as number) : 0,
    };
  } catch {
    return { completedCount: 0, totalBPEarned: 0 };
  }
}

// ══════════════════════════════════════════════════════════════════
//  SMS Anti-Spoofing — Agent Deposit Auto-Verification
// ══════════════════════════════════════════════════════════════════

const TRUSTED_BANK_SHORT_NUMBERS = ["8600", "900", "5000", "1400", "1700", "3600"];

export interface SmsVerificationData {
  sender: string;
  amount: number;
  transactionId: string;
  timestamp: string;
}

export async function verifySmsAndConfirmDeposit(
  deviceId: string,
  depositId: string,
  sms: SmsVerificationData
): Promise<{ verified: boolean; message: string }> {
  try {
    const isTrustedSender = TRUSTED_BANK_SHORT_NUMBERS.some(n =>
      sms.sender.replace(/\s/g, "").includes(n)
    );

    if (!isTrustedSender) {
      await saveReputationEntry(deviceId, {
        type: "negative",
        reason: "Soxta SMS ibermeye synanyşdy — penaltý",
        delta: -20,
        timestamp: new Date().toISOString(),
        isPublic: false,
      });
      await set(ref(db, `sms-violations/${deviceId}`), {
        lastAttempt: new Date().toISOString(),
        sender: sms.sender,
        blocked: true,
      });
      return {
        verified: false,
        message: "Ynamly bank belgisinden däl. Abraý balyňyz -20 bal düşdi we bloklandy.",
      };
    }

    const depositSnap = await get(ref(db, `agent-deposits/${depositId}`));
    if (!depositSnap.exists()) return { verified: false, message: "Goýum tapylmady" };

    const deposit = depositSnap.val() as {
      deviceId: string;
      tmtAmount: number;
      status: string;
    };

    if (deposit.deviceId !== deviceId) return { verified: false, message: "Rugsat ýok" };
    if (deposit.status !== "pending") return { verified: false, message: "Goýum eýýäm işlendi" };

    const amountMatch = Math.abs(deposit.tmtAmount - sms.amount) < 0.01;
    if (!amountMatch) {
      await saveReputationEntry(deviceId, {
        type: "negative",
        reason: "SMS möçberi goýum bilen gabat gelmedi",
        delta: -5,
        timestamp: new Date().toISOString(),
        isPublic: false,
      });
      return {
        verified: false,
        message: `SMS-däki möçber gabat gelenok. Abraý balyňyz -5 bal düşdi.`,
      };
    }

    const smsAge = Date.now() - new Date(sms.timestamp).getTime();
    if (smsAge > 30 * 60 * 1000) {
      return { verified: false, message: "SMS möhleti geçipdir (30 minut çägi)" };
    }

    const bpAmount = Math.round(deposit.tmtAmount * 1.15 * 100) / 100;
    await update(ref(db, `agent-deposits/${depositId}`), {
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
      transactionId: sms.transactionId,
      autoVerified: true,
    });
    await addBalance(deviceId, bpAmount);

    return { verified: true, message: `Tassyklandy! +${bpAmount.toFixed(2)} BP goşuldy.` };
  } catch {
    return { verified: false, message: "Tassyklama ýerine ýetirilmedi. Täzeden synanyşyň." };
  }
}

// ─── Ulanyjy profili ──────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  surname: string;
  username?: string;
  phone: string;
  region: string;
  district: string;
  profession: string;
  bio: string;
  updatedAt: string;
  createdAt: number;
}

export async function saveUserProfile(
  deviceId: string,
  data: Omit<UserProfile, "updatedAt" | "createdAt">
): Promise<void> {
  await set(ref(db, `users/${deviceId}/profile`), {
    ...data,
    updatedAt: new Date().toISOString(),
    createdAt: Date.now(),
  });
}

export async function getUserProfile(deviceId: string): Promise<UserProfile | null> {
  try {
    const snap = await get(ref(db, `users/${deviceId}/profile`));
    if (!snap.exists()) return null;
    return snap.val() as UserProfile;
  } catch {
    return null;
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export async function setUserAvatar(deviceId: string, dataUri: string): Promise<void> {
  await set(ref(db, `user-profiles/${deviceId}/avatar`), dataUri);
}

export async function getUserAvatar(deviceId: string): Promise<string | null> {
  try {
    const snap = await get(ref(db, `user-profiles/${deviceId}/avatar`));
    return snap.exists() ? String(snap.val()) : null;
  } catch {
    return null;
  }
}

export function watchUserAvatar(deviceId: string, cb: (uri: string | null) => void): () => void {
  const r = ref(db, `user-profiles/${deviceId}/avatar`);
  return onValue(r, (snap) => cb(snap.exists() ? String(snap.val()) : null));
}
