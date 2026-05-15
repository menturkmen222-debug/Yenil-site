import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db, ref, onValue, getUserBalance, deductBalance, saveOrder } from "@/lib/firebase";
import { getDeviceIdAsync } from "@/lib/deviceId";

interface BonusPulContextType {
  balance: number;
  deviceId: string;
  refreshBalance: () => void;
  deduct: (amount: number) => Promise<boolean>;
  buyBonusPul: (amount: number, phone: string) => Promise<void>;
  sellBonusPul: (amount: number, phone: string) => Promise<void>;
}

const BonusPulContext = createContext<BonusPulContextType>({
  balance: 0,
  deviceId: "",
  refreshBalance: () => {},
  deduct: async () => false,
  buyBonusPul: async () => {},
  sellBonusPul: async () => {},
});

export function BonusPulProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    getDeviceIdAsync().then(id => setDeviceId(id));
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    const balRef = ref(db, `user-balances/${deviceId}`);
    const unsub = onValue(balRef, snap => {
      if (snap.exists()) setBalance(snap.val().balance ?? 0);
      else setBalance(0);
    });
    return () => unsub();
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

  const buyBonusPul = useCallback(async (amount: number, phone: string) => {
    if (!deviceId) return;
    await saveOrder("bonus-orders", { deviceId, amount, userPhone: phone, status: "pending" });
  }, [deviceId]);

  const sellBonusPul = useCallback(async (amount: number, phone: string) => {
    if (!deviceId) return;
    await saveOrder("bonus-sell-orders", { deviceId, amount, userPhone: phone, status: "pending" });
  }, [deviceId]);

  return (
    <BonusPulContext.Provider value={{ balance, deviceId, refreshBalance, deduct, buyBonusPul, sellBonusPul }}>
      {children}
    </BonusPulContext.Provider>
  );
}

export const useBonusPul = () => useContext(BonusPulContext);
