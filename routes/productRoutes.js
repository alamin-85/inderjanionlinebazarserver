
const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const products = await db
      .collection("products")
      .find({ status: "active" })
      .sort({ id: 1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();

    const product = await db.collection("products").findOne({
      id: req.params.id,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

module.exports = router;
