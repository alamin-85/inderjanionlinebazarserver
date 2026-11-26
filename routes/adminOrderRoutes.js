
const express = require("express");
const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { permissionMiddleware } = require("../middleware/permissionMiddleware");

const router = express.Router();

// GET: Admin view all customer orders
router.get(
  "/",
  authMiddleware,
  permissionMiddleware("orders:read"),
  async (req, res) => {
    try {
      const db = getDB();

      const orders = await db
        .collection("orders")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        totalOrders: orders.length,
        orders,
      });
    } catch (error) {
      console.error("Admin get orders error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve orders.",
      });
    }
  }
);

// GET: Admin dashboard order statistics
router.get(
  "/stats",
  authMiddleware,
  permissionMiddleware("orders:read"),
  async (req, res) => {
    try {
      const db = getDB();
      const ordersCollection = db.collection("orders");

      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        unpaidOrders,
        totalPaidOrders,
        revenueResult,
      ] = await Promise.all([
        ordersCollection.countDocuments({}),
        ordersCollection.countDocuments({ orderStatus: "pending" }),
        ordersCollection.countDocuments({ orderStatus: "confirmed" }),
        ordersCollection.countDocuments({ orderStatus: "processing" }),
        ordersCollection.countDocuments({ orderStatus: "shipped" }),
        ordersCollection.countDocuments({ orderStatus: "delivered" }),
        ordersCollection.countDocuments({ orderStatus: "cancelled" }),
        ordersCollection.countDocuments({ paymentStatus: "unpaid" }),
        ordersCollection.countDocuments({ paymentStatus: "paid" }),

        ordersCollection.aggregate([
          { $match: { paymentStatus: "paid" } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ]).toArray(),
      ]);

      const totalRevenue = revenueResult[0]?.totalRevenue || 0;

      return res.status(200).json({
        success: true,
        statistics: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          unpaidOrders,
          totalPaidOrders,
          totalRevenue,
          currency: "BDT",
        },
      });
    } catch (error) {
      console.error("Admin dashboard statistics error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard statistics.",
      });
    }
  }
);

// GET: Admin view single order details
router.get(
  "/:orderId",
  authMiddleware,
  permissionMiddleware("orders:read"),
  async (req, res) => {
    try {
      const db = getDB();
      const { orderId } = req.params;

      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      const order = await db.collection("orders").findOne({
        _id: new ObjectId(orderId),
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      return res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Admin order details error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve order details.",
      });
    }
  }
);

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];


// PATCH: Admin update order status
router.patch(
  "/:orderId/status",
  authMiddleware,
  permissionMiddleware("orders:update"),
  async (req, res) => {
    try {
      const db = getDB();
      const { orderId } = req.params;
      const { orderStatus } = req.body;

      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      if (!ORDER_STATUSES.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            orderStatus,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const updatedOrder = await db.collection("orders").findOne({
        _id: new ObjectId(orderId),
      });

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully.",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Admin update order status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update order status.",
      });
    }
  }
);


// PATCH: Admin update payment status
router.patch(
  "/:orderId/payment-status",
  authMiddleware,
  permissionMiddleware("orders:update"),
  async (req, res) => {
    try {
      const db = getDB();
      const { orderId } = req.params;
      const { paymentStatus } = req.body;

      if (!ObjectId.isValid(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        });
      }

      const result = await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            paymentStatus,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const updatedOrder = await db.collection("orders").findOne({
        _id: new ObjectId(orderId),
      });

      return res.status(200).json({
        success: true,
        message: "Payment status updated successfully.",
        order: updatedOrder,
      });
    } catch (error) {
      console.error("Admin payment status error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update payment status.",
      });
    }
  }
);

// Allowed payment statuses
const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
];





module.exports = router;
