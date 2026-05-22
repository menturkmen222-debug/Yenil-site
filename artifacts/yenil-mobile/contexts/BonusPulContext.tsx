import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  db, ref, onValue,
  getUserBalance, deductBalance, deductBalanceAtomic, saveOrder, transferBP,
} from "@/lib/firebase";
import { getDeviceIdAsync } from "@/lib/deviceId";

interface BonusPulContextType {
  balance: number;
  deviceId: string;
  reputationScore: number;
  refreshBalance: () => void;
  deduct: (amount: number) => Promise<boolean>;
  deductAtomic: (amount: number) => Promise<{ success: boolean; newBalance: number }>;
  buyBonusPul: (amount: number, phone: string) => Promise<void>;
  sellBonusPul: (amount: number, phone: string) => Promise<void>;
  sendBP: (toId: string, amount: number, note?: string) => Promise<{ success: boolean; message: string }>;
}

const BonusPulContext = createContext<BonusPulContextType>({
  balance: 0,
  deviceId: "",
  reputationScore: 20,
  refreshBalance: () => {},
  deduct: async () => false,
  deductAtomic: async () => ({ success: false, newBalance: 0 }),
  buyBonusPul: async () => {},
  sellBonusPul: async () => {},
  sendBP: async () => ({ success: false, message: "" }),
});

export function BonusPulProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>("");
  const [reputationScore, setReputationScore] = useState<number>(20);

  useEffect(() => {
    getDeviceIdAsync().then(id => setDeviceId(id));
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    const balRef = ref(db, `user-balances/${deviceId}`);
    const unsubBal = onValue(balRef, snap => {
      setBalance(snap.exists() ? (snap.val().balance ?? 0) : 0);
    });

    const repRef = ref(db, `reputation/${deviceId}/score`);
    const unsubRep = onValue(repRef, snap => {
      setReputationScore(snap.exists() ? (snap.val() ?? 20) : 20);
    });

    return () => {
      unsubBal();
      unsubRep();
    };
  }, [deviceId]);

  const refreshBalance = useCallback(async () => {
    if (!deviceId) return;
    const bal = await getUserBalance(deviceId);
    setBalance(bal);
  }, [deviceId]);

  const deduct = useCallback(async (amount: number) => {
    if (!deviceId) return false;
    return deductBalance(deviceId, amount);
  }, [deviceId]);

  const deductAtomic = useCallback(async (amount: number) => {
    if (!deviceId) return { success: false, newBalance: 0 };
    return deductBalanceAtomic(deviceId, amount);
  }, [deviceId]);

  const buyBonusPul = useCallback(async (amount: number, phone: string) => {
    if (!deviceId) return;
    await saveOrder("bonus-orders", { deviceId, amount, userPhone: phone, status: "pending" });
  }, [deviceId]);

  const sellBonusPul = useCallback(async (amount: number, phone: string) => {
    if (!deviceId) return;
    await saveOrder("bonus-sell-orders", { deviceId, amount, userPhone: phone, status: "pending" });
  }, [deviceId]);

  const sendBP = useCallback(async (toId: string, amount: number, note = "") => {
    if (!deviceId) return { success: false, message: "Ulgam taýýar däl" };
    return transferBP(deviceId, toId, amount, note);
  }, [deviceId]);

  return (
    <BonusPulContext.Provider
      value={{ balance, deviceId, reputationScore, refreshBalance, deduct, deductAtomic, buyBonusPul, sellBonusPul, sendBP }}
    >
      {children}
    </BonusPulContext.Provider>
  );
}

export const useBonusPul = () => useContext(BonusPulContext);
