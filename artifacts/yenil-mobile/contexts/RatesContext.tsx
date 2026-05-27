import React, { createContext, useContext, useState, useEffect } from "react";
import { watchRates, DEFAULT_RATES, type AppRates } from "@/lib/ratesConfig";

const RatesContext = createContext<AppRates>(DEFAULT_RATES);

export function RatesProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<AppRates>(DEFAULT_RATES);

  useEffect(() => {
    const unsub = watchRates(setRates);
    return unsub;
  }, []);

  return (
    <RatesContext.Provider value={rates}>
      {children}
    </RatesContext.Provider>
  );
}

export function useRates(): AppRates {
  return useContext(RatesContext);
}
