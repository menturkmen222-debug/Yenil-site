import { useState, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

const PING_URL = "https://www.google.com/generate_204";
const PING_INTERVAL = 10000;

async function checkConnectivity(): Promise<boolean> {
  if (Platform.OS === "web") {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(PING_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res.status < 500;
  } catch {
    return false;
  }
}

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    const online = await checkConnectivity();
    setIsOffline(!online);
  };

  useEffect(() => {
    check();

    intervalRef.current = setInterval(check, PING_INTERVAL);

    if (Platform.OS === "web") {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      appStateSub.remove();
    };
  }, []);

  return { isOffline };
}
