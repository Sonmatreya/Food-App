const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { jwtSecret, corsOrigins } = require("./env");

const USER_ROOM_PREFIX = "user:";
const ADMIN_ROOM = "admins";

const parseCookies = (cookieHeader = "") => {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) return cookies;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (!key) return cookies;

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }

    return cookies;
  }, {});
};

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.token;

      if (!token) {
        return next(new Error("Not authenticated"));
      }

      const decoded = jwt.verify(token, jwtSecret);

      if (!decoded?.userId) {
        return next(new Error("Invalid authentication token"));
      }

      const user = await User.findById(decoded.userId).select("_id role").lean();

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = {
        userId: String(user._id),
        role: user.role,
      };

      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user.userId);

    socket.join(`${USER_ROOM_PREFIX}${userId}`);

    if (socket.user.role === "admin") {
      socket.join(ADMIN_ROOM);
    }

    console.log(`Socket connected: user ${userId}${socket.user.role === "admin" ? " (admin)" : ""}`);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: user ${userId} (${reason})`);
    });
  });

  return io;
};

const getUserRoom = (userId) => `${USER_ROOM_PREFIX}${userId}`;

module.exports = {
  initializeSocket,
  getUserRoom,
  ADMIN_ROOM,
};