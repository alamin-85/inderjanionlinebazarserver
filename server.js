
// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const { connectDB } = require("./config/db");

// const productRoutes = require("./routes/productRoutes");
// const orderRoutes = require("./routes/orderRoutes");
// const categoryRoutes = require("./routes/categoryRoutes");

// const app = express();
// const PORT = process.env.PORT || 4000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // API Routes
// app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/categories", categoryRoutes);

// // API Home
// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Inderjani Online Bazar API is running!",
//   });
// });

// // Health Check
// app.get("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Server is healthy",
//     database: "Connected",
//   });
// });

// // Start server after database connection
// async function startServer() {
//   try {
//     await connectDB();

//     app.listen(PORT, () => {
//       console.log(`Server running at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Server startup failed:", error.message);
//     process.exit(1);
//   }
// }

// startServer();


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
];

    // 3. CORS Configuration
    app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:8081",
        credentials: true,
      })
    );

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
