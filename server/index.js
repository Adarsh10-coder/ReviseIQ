import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";

// Load environment variables from .env
dotenv.config();

import { connectDB } from "./src/config/db.js";
import { configurePassport } from "./src/config/passport.js";
import { initSocket } from "./src/config/socket.js";

// Routes
import authRoutes from "./src/routes/auth.routes.js";
import repoRoutes from "./src/routes/repo.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Connect to MongoDB
connectDB();

// Initialize Passport GitHub OAuth Strategy
configurePassport();

// Initialize Socket.io
initSocket(server, CLIENT_URL);

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Healthcheck
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ReviseIQ Server",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/auth", authRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/ai", aiRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 ReviseIQ Server running on http://localhost:${PORT}`);
  console.log(`📡 Client URL: ${CLIENT_URL}`);
});
