
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const adminUploadRoutes = require("./routes/adminUploadRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    console.log("Initializing Better Auth...");

    // 2. Load Better Auth using dynamic imports
    const { auth } = await import("./config/auth.mjs");
    const { toNodeHandler } = await import("better-auth/node");

    const allowedOrigins = [
  "http://localhost:4000",
  "http://localhost:8081",
  "https://inderjanionlinebazar.vercel.app",
];

    // 3. CORS Configuration
   const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header (e.g. curl or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked this origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Key"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

    // 4. Better Auth Route
    // Must be before express.json()
    app.all("/api/auth/*splat", toNodeHandler(auth));

    // 5. Express Middleware
    app.use(express.json({ limit: "10mb" }));

    // 6. Existing API Routes
    app.use("/api/products", productRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/categories", categoryRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/admin/orders", adminOrderRoutes);
    app.use("/api/admin/users", adminUserRoutes);
    app.use("/api/admin/products", adminProductRoutes);
    app.use("/api/admin/upload", adminUploadRoutes);

    // 7. API Home
    app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Inderjani Online Bazar API is running!",
      });
    });

    // 8. Health Check
    app.get("/api/health", (req, res) => {
      res.json({
        success: true,
        message: "Server is healthy",
        database: "Connected",
        authentication: "Initialized",
      });
    });

    // 9. Start Server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("Better Auth initialized successfully!");
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
