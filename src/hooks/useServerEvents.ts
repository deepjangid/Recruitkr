import { useEffect, useRef, useState } from "react";

import { createSseUrl } from "@/lib/api";

export type SseConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type SseEventPayload = {
  type: string;
  data: unknown;
};

type UseServerEventsOptions = {
  enabled?: boolean;
  path?: string;
  eventNames?: string[];
  onEvent?: (event: SseEventPayload) => void;
};

const DEFAULT_PATH = "/events/stream";
const DEFAULT_EVENTS = ["connected", "heartbeat", "application-created", "application-updated"];
const RECONNECT_DELAYS_MS = [3000, 5000, 10000];

export const useServerEvents = ({
  enabled = true,
  path = DEFAULT_PATH,
  eventNames = DEFAULT_EVENTS,
  onEvent,
}: UseServerEventsOptions = {}) => {
  const [status, setStatus] = useState<SseConnectionStatus>(enabled ? "connecting" : "disconnected");
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const manuallyClosedRef = useRef(false);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      manuallyClosedRef.current = true;
      sourceRef.current?.close();
      sourceRef.current = null;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setStatus("disconnected");
      return;
    }

    manuallyClosedRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const cleanupSource = () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (manuallyClosedRef.current || reconnectTimerRef.current !== null) return;

      const nextDelay = RECONNECT_DELAYS_MS[Math.min(attemptRef.current, RECONNECT_DELAYS_MS.length - 1)];
      setStatus("reconnecting");
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, nextDelay);
    };

    const handleEvent = (type: string, rawData: string) => {
      let data: unknown = rawData;
      try {
        data = rawData ? JSON.parse(rawData) : null;
      } catch {
        data = rawData;
      }

      onEventRef.current?.({ type, data });
    };

    const connect = () => {
      if (manuallyClosedRef.current || sourceRef.current) return;

      clearReconnectTimer();
      setStatus(attemptRef.current === 0 ? "connecting" : "reconnecting");

      let eventSource: EventSource;
      try {
        eventSource = new EventSource(createSseUrl(path), { withCredentials: true });
      } catch {
        scheduleReconnect();
        return;
      }

      sourceRef.current = eventSource;

      eventSource.onopen = () => {
        attemptRef.current = 0;
        setStatus("connected");
      };

      eventSource.onmessage = (event) => {
        handleEvent("message", event.data);
      };

      for (const eventName of eventNames) {
        eventSource.addEventListener(eventName, (event) => {
          handleEvent(eventName, (event as MessageEvent).data);
        });
      }

      eventSource.onerror = () => {
        cleanupSource();
        attemptRef.current += 1;

        if (manuallyClosedRef.current) {
          setStatus("disconnected");
          return;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      manuallyClosedRef.current = true;
      clearReconnectTimer();
      cleanupSource();
      setStatus("disconnected");
    };
  }, [enabled, path, eventNames]);

  return { status };
};
