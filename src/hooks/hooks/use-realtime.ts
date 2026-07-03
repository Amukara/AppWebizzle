"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { PresenceEntry } from "@/lib/types";

// Connect to the WeBizzle realtime mini-service on port 3001.
// Per the gateway rules: path "/", XTransformPort in the query.
const URL = "/?XTransformPort=3001";

let socketPromise: Promise<Socket> | null = null;
function getSocket(): Promise<Socket> {
  if (!socketPromise) {
    socketPromise = new Promise((resolve, reject) => {
      const s = io(URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
      });
      s.on("connect", () => resolve(s));
      s.on("connect_error", () => reject(new Error("connect_error")));
      // Fallback: resolve even if connect is slow so callers can retry.
      setTimeout(() => resolve(s), 3000);
    });
  }
  return socketPromise;
}

type Presence = { kind: "vendor" | "rider" | "admin"; id: string; name: string };

/**
 * useRealtime — registers a vendor/rider/admin presence, subscribes to
 * presence updates, notifications, order-status, and chat messages.
 * Returns the socket + live data.
 */
export function useRealtime(me: Presence | null) {
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!me) return;
    let s: Socket | null = null;
    let alive = true;
    getSocket().then((sock) => {
      if (!alive) return;
      s = sock;
      setSocket(sock);
      sock.emit("register", me);
      setConnected(true);
      sock.on("presence", (list: PresenceEntry[]) => setPresence(list));
      sock.on("notification", (n: unknown) =>
        setNotifications((prev) => [n, ...prev].slice(0, 50))
      );
      sock.on("disconnect", () => setConnected(false));
      sock.on("connect", () => setConnected(true));
    });
    return () => {
      alive = false;
      if (s) {
        s.off("presence");
        s.off("notification");
      }
    };
  }, [me?.kind, me?.id]);

  return { connected, presence, notifications, socket };
}

export { getSocket };
export type { Presence };
