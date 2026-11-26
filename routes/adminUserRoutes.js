
const express = require("express");

const { getDB } = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { permissionMiddleware } = require("../middleware/permissionMiddleware");

const router = express.Router();

// GET: View all users
router.get(
  "/",
  authMiddleware,
  permissionMiddleware("users:read"),
  async (req, res) => {
    try {
      const db = getDB();

      const users = await db
        .collection("user")
        .find({})
        .project({
          _id: 1,
          id: 1,
          name: 1,
          email: 1,
          role: 1,
          image: 1,
          emailVerified: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        totalUsers: users.length,
        users,
      });
    } catch (error) {
      console.error("Admin get users error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve users.",
      });
    }
  }
);

// PATCH: Update user role (Super Admin only)
router.patch(
  "/:userId/role",
  authMiddleware,
  adminMiddleware("super_admin"),
  permissionMiddleware("users:update"),
  async (req, res) => {
    try {
      const db = getDB();
      const { userId } = req.params;
      const { role } = req.body;

      const ALLOWED_ROLES = [
        "admin",
        "manager",
        "staff",
        "customer",
      ];

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Super Admin cannot be assigned through this API.",
        });
      }

      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role.",
        });
      }

      const result = await db.collection("user").updateOne(
        { id: userId },
        {
          $set: {
            role,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User role updated successfully.",
      });
    } catch (error) {
      console.error("Admin update user role error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update user role.",
      });
    }
  }
);

module.exports = router;
