
const express = require("express");
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");
const {
  permissionMiddleware,
} = require("../middleware/permissionMiddleware");

const router = express.Router();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// POST: Upload Product Image to ImgBB
router.post(
  "/image",
  authMiddleware,
  permissionMiddleware("products:create"),
  async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || !mimeType) {
        return res.status(400).json({
          success: false,
          message: "Image and mimeType are required.",
        });
      }

      if (!ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG and WEBP images are allowed.",
        });
      }

      const base64Image = image.replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ""
      );

      const buffer = Buffer.from(base64Image, "base64");

      if (
        buffer.length === 0 ||
        buffer.length > MAX_IMAGE_SIZE ||
        buffer.toString("base64") !== base64Image
      ) {
        return res.status(400).json({
          success: false,
          message: "Image must be valid and smaller than 5MB.",
        });
      }

      if (!process.env.IMGBB_API_KEY) {
        return res.status(500).json({
          success: false,
          message: "Image upload service is not configured.",
        });
      }

      const formData = new URLSearchParams();

      formData.append("key", process.env.IMGBB_API_KEY);
      formData.append("image", base64Image);

      const response = await axios.post(
        "https://api.imgbb.com/1/upload",
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 30000,
        }
      );

      if (!response.data?.success || !response.data?.data?.url) {
        return res.status(502).json({
          success: false,
          message: "Image upload failed.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: response.data.data.url,
        deleteUrl: response.data.data.delete_url,
      });
    } catch (error) {
      console.error(
        "ImgBB upload error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to upload image.",
      });
    }
  }
);

module.exports = router;
