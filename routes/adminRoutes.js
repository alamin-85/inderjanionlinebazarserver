
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// GET: Current Admin Profile
router.get(
  "/me",
  authMiddleware,
  adminMiddleware(),
  (req, res) => {
    try {
      const user = req.user;

      return res.status(200).json({
        success: true,
        message: "Admin profile retrieved successfully",
        admin: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image || null,
        },
      });
    } catch (error) {
      console.error("Admin profile error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve admin profile",
      });
    }
  }
);

module.exports = router;
