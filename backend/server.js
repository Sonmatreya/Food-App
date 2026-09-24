const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

dotenv.config();

const env = require("./config/env");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const captchaRoutes = require("./routes/captchaRoutes");
const orderRoutes = require("./routes/orderRoutes");
const foodRoutes = require("./routes/foodRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const adminCustomerRoutes = require("./routes/adminCustomerRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminStaffRoutes = require("./routes/adminStaffRoutes");
const addressRoutes = require("./routes/addressRoutes");
const aiRoutes = require("./routes/aiRoutes");
const passport = require("./config/googleAuth");
const { initializeSocket } = require("./config/socket");

const app = express();
const httpServer = http.createServer(app);
const io = initializeSocket(httpServer);
app.set("io", io);
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Captcha-Proof"],
}));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/captcha", captchaRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => res.json({ success: true, message: "Food App API is running" }));
app.use((req, res) => res.status(404).json({ success: false, message: "API route not found" }));
app.use((error, req, res, next) => {
  if (error.message === "Origin is not allowed by CORS") return res.status(403).json({ success: false, message: "Origin is not allowed by CORS" });
  console.error("Unhandled API error:", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = env.port;
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Server startup failed");
    process.exit(1);
  }
};
startServer();
