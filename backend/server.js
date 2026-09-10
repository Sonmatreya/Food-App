const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Load environment variables FIRST
dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const captchaRoutes = require("./routes/captchaRoutes");
const passport = require("./config/googleAuth");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Cookies
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/captcha", captchaRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Food App API is running",
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed");
    process.exit(1);
  }
};

startServer();