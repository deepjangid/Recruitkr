import { useEffect } from "react";

import { pingApi } from "@/lib/api";

const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000;

const ApiKeepAlive = () => {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let cancelled = false;

    const ping = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      await pingApi();
    };

    void ping();
    const intervalId = window.setInterval(() => {
      void ping();
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default ApiKeepAlive;
