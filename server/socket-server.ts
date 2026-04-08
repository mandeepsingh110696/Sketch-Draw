import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";

const PORT = Number(process.env.PORT ?? 8500);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});

function parseRoomId(socket: Socket): string {
  const raw = socket.handshake.query.room;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value ?? "public").slice(0, 64);
}

function broadcastPeerCount(room: string): void {
  const roomSet = io.sockets.adapter.rooms.get(room);
  const count = roomSet?.size ?? 0;
  io.to(room).emit("roomPeers", { count });
}

type RelayEvent = "beginPath" | "drawLine" | "changeConfig";

function relayToRoom(sock: Socket, room: string, event: RelayEvent) {
  return (payload: unknown) => {
    sock.to(room).emit(event, payload);
  };
}

io.on("connection", (socket) => {
  const room = parseRoomId(socket);
  socket.join(room);
  broadcastPeerCount(room);

  const relay = (event: RelayEvent) => relayToRoom(socket, room, event);

  socket.on("beginPath", relay("beginPath"));
  socket.on("drawLine", relay("drawLine"));
  socket.on("changeConfig", relay("changeConfig"));

  socket.on("disconnect", () => {
    broadcastPeerCount(room);
  });
});

httpServer.listen(PORT, () => {
  console.log(`SketchDraw socket relay listening on ${PORT}`);
});
