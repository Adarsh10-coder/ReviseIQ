import { Server } from "socket.io";

let io = null;

export function initSocket(server, clientUrl) {
  io = new Server(server, {
    cors: {
      origin: [clientUrl, "http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("join-repo", (repoFullName) => {
      socket.join(`repo:${repoFullName}`);
      console.log(`[Socket.io] ${socket.id} joined repo:${repoFullName}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
