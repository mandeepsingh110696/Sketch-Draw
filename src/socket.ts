import { io, type Socket } from "socket.io-client";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:8500")
  );
}

function readRoomId(): string {
  if (typeof window === "undefined") return "public";
  const q = new URLSearchParams(window.location.search).get("room");
  const trimmed = q?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 64) : "public";
}

let socket: Socket | null = null;

export function initSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket) return socket;
  const room = readRoomId();
  socket = io(baseUrl(), {
    query: { room },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function getSocket(): Socket {
  const s = initSocket();
  if (!s) {
    throw new Error("Socket is only available in the browser");
  }
  return s;
}
