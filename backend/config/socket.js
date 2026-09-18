const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { jwtSecret, corsOrigins } = require("./config/env");

const USER_ROOM_PREFIX = "user:";

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

  // Socket.IO does not pass Express middleware cookies through req.cookies,
  // so authenticate the same httpOnly JWT cookie used by the REST API.
  io.use((socket, next) => {
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

      socket.user = decoded;
      return next();
    } catch {
      return next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user.userId);

    // Each authenticated customer receives only events for their own orders.
    socket.join(`${USER_ROOM_PREFIX}${userId}`);

    console.log(`Socket connected: user ${userId}`);

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
};
