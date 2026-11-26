
const express = require("express");
const { getDB } = require("../config/db");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const { ObjectId } = require("mongodb");

const router = express.Router();

const PAYMENT_METHODS = [
  "Cash on Delivery",
  "bKash",
  "Nagad",
  "Rocket",
];

// POST: Create new order
router.post("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const db = getDB();

    const {
      customer,
      items,
      paymentMethod,
      coordinates,
      deliveryNote,
    } = req.body;

    // Validate customer information
    if (
      !customer ||
      !customer.name?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone and address are required.",
      });
    }

    // Bangladesh mobile number validation
    if (!/^01[3-9]\d{8}$/.test(customer.phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladesh mobile number.",
      });
    }

    // Validate cart items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Validate payment method
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Validate GPS coordinates when provided
    if (coordinates != null) {
      const { latitude, longitude } = coordinates;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid GPS coordinates.",
        });
      }
    }

    // Build order items using database product information
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const productId = item.productId;
      const quantity = Number(item.quantity);

      if (
        typeof productId !== "string" ||
        !productId.trim() ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID or quantity.",
        });
      }

      const product = await db.collection("products").findOne({
        id: productId,
        status: "active",
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productId}`,
        });
      }

      if (
        !Number.isFinite(Number(product.price)) ||
        Number(product.price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price.",
        });
      }

      if (
        !Number.isSafeInteger(Number(product.stock)) ||
        Number(product.stock) < quantity
      ) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock or has insufficient stock.`,
        });
      }

      const price = Number(product.price);
      const subtotal = price * quantity;

      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        banglaName: product.bn || "",
        price,
        quantity,
        subtotal,
      });
    }

    // Create order
    const order = {
      orderNumber: `IOB-${Date.now()}`,

      // Authenticated customer ID from verified session.
      // Guest checkout will save null.
      userId: req.user?.id || null,

      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },

      items: orderItems,
      deliveryCharge: 60,
      totalAmount: totalAmount + 60,

      paymentMethod,
      paymentStatus: "unpaid",
      orderStatus: "pending",

      coordinates: coordinates || null,

      deliveryNote:
        typeof deliveryNote === "string"
          ? deliveryNote.trim()
          : "",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: {
        ...order,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to place order. Please try again.",
    });
  }
});


// GET: Logged-in customer's order history
router.get("/my-orders",authMiddleware, async (req, res) => {
  try {
    // This route requires login
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Please login to view your orders.",
      });
    }

    const db = getDB();

    const orders = await db
      .collection("orders")
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Customer order history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order history.",
    });
  }
});


// GET: Single order details for logged-in customer
router.get("/:orderId", authMiddleware, async (req, res) => {
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
      userId: req.user.id,
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
    console.error("Order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details.",
    });
  }
});


// GET: Track order using order number
router.get("/track/:orderNumber", async (req, res) => {
  try {
    const db = getDB();
    const { orderNumber } = req.params;

    if (
      typeof orderNumber !== "string" ||
      !/^IOB-\d+$/.test(orderNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order number.",
      });
    }

    const order = await db.collection("orders").findOne(
      { orderNumber },
      {
        projection: {
          orderNumber: 1,
          orderStatus: 1,
          paymentStatus: 1,
          paymentMethod: 1,
          totalAmount: 1,
          createdAt: 1,
          updatedAt: 1,
          items: 1,
        },
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("Order tracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to track order.",
    });
  }
});


module.exports = router;
