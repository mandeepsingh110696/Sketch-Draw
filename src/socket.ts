import { io } from "socket.io-client";

const url =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8500");

export const socket = io(url, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
