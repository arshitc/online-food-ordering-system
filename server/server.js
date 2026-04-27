const fs = require("fs");
const path = require("path");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const isVercelRuntime = Boolean(process.env.VERCEL);
const noopIo = {
  to() {
    return {
      emit() {}
    };
  }
};

const normalizeUrl = (value = "") => value.trim().replace(/\/+$/, "");

const configuredClientUrls = [process.env.CLIENT_URL, process.env.CLIENT_URLS]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map(normalizeUrl)
  .filter(Boolean);

const defaultClientUrls = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const allowedOrigins = [
  ...new Set(
    (configuredClientUrls.length ? configuredClientUrls : defaultClientUrls).flatMap((url) => {
      if (url.includes("://localhost")) {
        return [url, url.replace("://localhost", "://127.0.0.1")];
      }

      if (url.includes("://127.0.0.1")) {
        return [url, url.replace("://127.0.0.1", "://localhost")];
      }

      return [url];
    })
  )
];

const allowAnyProductionOrigin =
  process.env.NODE_ENV === "production" && configuredClientUrls.length === 0;

const isAllowedOrigin = (origin) => {
  if (!origin || allowAnyProductionOrigin) {
    return true;
  }

  const normalizedOrigin = normalizeUrl(origin);

  return (
    allowedOrigins.includes(normalizedOrigin) ||
    /^http:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):4321$/.test(normalizedOrigin)
  );
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy blocked this origin"));
  },
  credentials: true
};

const app = express();
const server = isVercelRuntime ? null : http.createServer(app);
const io = isVercelRuntime
  ? noopIo
  : new Server(server, {
      cors: corsOptions
    });

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/server/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/api", (req, res) => {
  res.json({
    message: "Online Food Ordering System API running",
    docsHint: "See README.md for architecture, routes, and setup details"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

if (!isVercelRuntime) {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ userId, role, restaurantId }) => {
      if (userId) socket.join(`user:${userId}`);
      if (role === "delivery" && userId) socket.join(`delivery:${userId}`);
      if (restaurantId) socket.join(`restaurant:${restaurantId}`);
    });
  });
}

const clientBuildPath = path.resolve(__dirname, "../client/build");
const clientEntryFile = path.join(clientBuildPath, "index.html");

if (process.env.NODE_ENV === "production" && fs.existsSync(clientEntryFile)) {
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/server/uploads")) {
      return next();
    }

    return res.sendFile(clientEntryFile);
  });
} else if (process.env.NODE_ENV !== "production") {
  app.get("/", (req, res) => {
    res.json({
      message: "Online Food Ordering System API running",
      docsHint: "See README.md for architecture, routes, and setup details"
    });
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
if (process.env.NODE_ENV !== "test" && !isVercelRuntime) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
