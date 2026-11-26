
const express = require("express");
const { getDB } = require("../config/db");

const router = express.Router();

// GET all active categories
router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const categories = await db
      .collection("categories")
      .find({ status: "active" })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

// ADMIN: Add new category
router.post("/", async (req, res) => {
  try {
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    const { name, bn, icon } = req.body;

    if (
      typeof name !== "string" ||
      typeof bn !== "string" ||
      !name.trim() ||
      !bn.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "English and Bangla category names are required",
      });
    }

    const db = getDB();
    const collection = db.collection("categories");

    const existingCategory = await collection.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = {
      name: name.trim(),
      bn: bn.trim(),
      icon: typeof icon === "string" ? icon.trim() : "🛍️",
      status: "active",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(category);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: {
        ...category,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
});

module.exports = router;
