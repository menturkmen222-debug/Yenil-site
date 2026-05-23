import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  db,
  ref,
  onValue,
  getUserBalance,
  addBalance,
  deductBalance,
  deductBalanceAtomic,
  saveOrder,
  transferBP,
  saveReputationEntry,
  type ReputationEntry,
} from "@/lib/firebase";
import { getDeviceIdAsync } from "@/lib/deviceId";
import { MIN_CASHOUT_BP, COMMISSION_RATES } from "@/lib/payments";

export interface PayResult {
  success: boolean;
  message: string;
  txId: string | null;
}

export interface WithdrawResult {
  success: boolean;
  message: string;
  orderId: string | null;
}

interface BonusPulContextType {
  balance: number;
  balanceBP: number;
  deviceId: string;
  reputationPoints: number;
  paymentLocked: boolean;

  payWithBP: (
    amount: number,
    serviceId: string,
    description: string
  ) => Promise<PayResult>;
  earnBP: (
    amount: number,
    reason: string,
    meta?: Record<string, unknown>
  ) => Promise<boolean>;
  sendBP: (
    toId: string,
    amount: number,
    note?: string
  ) => Promise<{ success: boolean; message: string }>;
  addReputation: (delta: number, reason: string) => Promise<void>;
  withdrawToTMCell: (amount: number, phone: string) => Promise<WithdrawResult>;
  checkInsufficientAmount: (price: number) => number;
  refreshBalance: () => void;

  /** @deprecated payWithBP ishlet */
  deduct: (amount: number) => Promise<boolean>;
  /** @deprecated payWithBP ishlet */
  deductAtomic: (
    amount: number
  ) => Promise<{ success: boolean; newBalance: number }>;
}

const BonusPulContext = createContext<BonusPulContextType>({
  balance: 0,
  balanceBP: 0,
  deviceId: "",
  reputationPoints: 20,
  paymentLocked: false,

  payWithBP: async () => ({ success: false, message: "", txId: null }),
  earnBP: async () => false,
  sendBP: async () => ({ success: false, message: "" }),
  addReputation: async () => {},
  withdrawToTMCell: async () => ({
    success: false,
    message: "",
    orderId: null,
  }),
  checkInsufficientAmount: () => 0,
  refreshBalance: () => {},

  deduct: async () => false,
  deductAtomic: async () => ({ success: false, newBalance: 0 }),
});

export function BonusPulProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>("");
  const [reputationPoints, setReputationPoints] = useState<number>(20);
  const [paymentLocked, setPaymentLocked] = useState<boolean>(false);

  const paymentLockRef = useRef(false);

  useEffect(() => {
    getDeviceIdAsync().then((id) => setDeviceId(id));
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    const balRef = ref(db, `user-balances/${deviceId}`);
    const unsubBal = onValue(balRef, (snap) => {
      setBalance(snap.exists() ? (snap.val().balance ?? 0) : 0);
    });

    const repRef = ref(db, `reputation/${deviceId}/score`);
    const unsubRep = onValue(repRef, (snap) => {
      setReputationPoints(snap.exists() ? (snap.val() ?? 20) : 20);
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

  const checkInsufficientAmount = useCallback(
    (price: number): number => {
      return Math.max(0, parseFloat((price - balance).toFixed(2)));
    },
    [balance]
  );

  const payWithBP = useCallback(
    async (
      amount: number,
      serviceId: string,
      description: string
    ): Promise<PayResult> => {
      if (!deviceId) {
        return { success: false, message: "Ulgam taýýar däl", txId: null };
      }
      if (paymentLockRef.current) {
        return {
          success: false,
          message: "Töleg eýýäm işlenýär",
          txId: null,
        };
      }

      paymentLockRef.current = true;
      setPaymentLocked(true);

      try {
        const result = await deductBalanceAtomic(deviceId, amount);
        if (!result.success) {
          return {
            success: false,
            message: "Balans ýetmezçilik edýär",
            txId: null,
          };
        }

        const txId = await saveOrder(`transactions/${deviceId}`, {
          type: "payment",
          serviceId,
          description,
          amount,
          createdAt: Date.now(),
        });

        return {
          success: true,
          message: "Töleg üstünlikli geçirildi",
          txId,
        };
      } catch {
        return {
          success: false,
          message: "Ulgam ýalňyşlygy. Gaýtadan synanyşyň.",
          txId: null,
        };
      } finally {
        paymentLockRef.current = false;
        setPaymentLocked(false);
      }
    },
    [deviceId]
  );

  const earnBP = useCallback(
    async (
      amount: number,
      reason: string,
      meta?: Record<string, unknown>
    ): Promise<boolean> => {
      if (!deviceId || amount <= 0) return false;
      try {
        await addBalance(deviceId, amount);
        await saveOrder(`bp-earnings/${deviceId}`, {
          amount,
          reason,
          meta: meta ?? null,
          createdAt: Date.now(),
        });
        return true;
      } catch {
        return false;
      }
    },
    [deviceId]
  );

  const sendBP = useCallback(
    async (
      toId: string,
      amount: number,
      note = ""
    ): Promise<{ success: boolean; message: string }> => {
      if (!deviceId) return { success: false, message: "Ulgam taýýar däl" };
      return transferBP(deviceId, toId, amount, note);
    },
    [deviceId]
  );

  const addReputation = useCallback(
    async (delta: number, reason: string): Promise<void> => {
      if (!deviceId) return;
      const entry: ReputationEntry = {
        type: delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral",
        reason,
        delta,
        timestamp: new Date().toISOString(),
        isPublic: true,
      };
      await saveReputationEntry(deviceId, entry);
    },
    [deviceId]
  );

  const withdrawToTMCell = useCallback(
    async (amount: number, phone: string): Promise<WithdrawResult> => {
      if (!deviceId) {
        return { success: false, message: "Ulgam taýýar däl", orderId: null };
      }
      if (amount < MIN_CASHOUT_BP) {
        return {
          success: false,
          message: `Iň az çykaryş mukdary ${MIN_CASHOUT_BP} BP`,
          orderId: null,
        };
      }
      try {
        const deducted = await deductBalance(deviceId, amount);
        if (!deducted) {
          return {
            success: false,
            message: "Balans ýetmezçilik edýär",
            orderId: null,
          };
        }
        const orderId = await saveOrder("tmcell-cashout-orders", {
          deviceId,
          amount,
          phone,
          commissionRate: COMMISSION_RATES.tmcell_cashout,
          status: "pending",
          createdAt: Date.now(),
        });
        return {
          success: true,
          message: "Çykaryş buýrugy kabul edildi",
          orderId,
        };
      } catch {
        return {
          success: false,
          message: "Ulgam ýalňyşlygy. Gaýtadan synanyşyň.",
          orderId: null,
        };
      }
    },
    [deviceId]
  );

  const deduct = useCallback(
    async (amount: number) => {
      if (!deviceId) return false;
      return deductBalance(deviceId, amount);
    },
    [deviceId]
  );

  const deductAtomic = useCallback(
    async (amount: number) => {
      if (!deviceId) return { success: false, newBalance: 0 };
      return deductBalanceAtomic(deviceId, amount);
    },
    [deviceId]
  );

  return (
    <BonusPulContext.Provider
      value={{
        balance,
        balanceBP: balance,
        deviceId,
        reputationPoints,
        paymentLocked,

        payWithBP,
        earnBP,
        sendBP,
        addReputation,
        withdrawToTMCell,
        checkInsufficientAmount,
        refreshBalance,

        deduct,
        deductAtomic,
      }}
    >
      {children}
    </BonusPulContext.Provider>
  );
}

export const useBonusPul = () => useContext(BonusPulContext);
