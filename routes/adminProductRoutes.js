
const express = require("express");
const crypto = require("crypto");
const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { permissionMiddleware } = require("../middleware/permissionMiddleware");

const router = express.Router();

// POST: Create New Product
router.post(
  "/",
  authMiddleware,
  permissionMiddleware("products:create"),
  async (req, res) => {
    try {
      const db = getDB();

      const {
        name,
        banglaName,
        category,
        description,
        price,
        stock,
        image,
        badge,
        status,
        benefits,
        usage,
        supply,
      } = req.body;

      if (
        !name?.trim() ||
        !category?.trim() ||
        !description?.trim() ||
        !image?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name, category, description and image are required.",
        });
      }

      const productPrice = Number(price);
      const productStock = Number(stock);

      if (
        !Number.isFinite(productPrice) ||
        productPrice <= 0 ||
        !Number.isInteger(productStock) ||
        productStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product price or stock.",
        });
      }

      const product = {
        id: crypto.randomUUID(),
        name: name.trim(),
        bn: banglaName?.trim() || "",
        category: category.trim(),
        description: description.trim(),
        price: productPrice,
        stock: productStock,
        image: image.trim(),
        badge: badge?.trim() || "",
        status: status === "inactive" ? "inactive" : "active",
        benefits: Array.isArray(benefits) ? benefits : [],
        usage: Array.isArray(usage) ? usage : [],
        supply: Array.isArray(supply) ? supply : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("products").insertOne(product);

      return res.status(201).json({
        success: true,
        message: "Product created successfully.",
        product,
      });
    } catch (error) {
      console.error("Admin create product error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create product.",
      });
    }
  }
);

module.exports = router;
