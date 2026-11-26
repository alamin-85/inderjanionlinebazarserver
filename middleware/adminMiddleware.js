
const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "staff",
];

// Admin role authorization middleware
function adminMiddleware(...allowedRoles) {
  return (req, res, next) => {
    try {
      // User must first pass authMiddleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please login first.",
        });
      }

      const userRole = req.user.role;

      // Reject users without an authorized admin role
      if (!ADMIN_ROLES.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Admin access required.",
        });
      }

      // Super Admin has full admin access
      if (userRole === "super_admin") {
        return next();
      }

      // If specific roles are required, check them
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(userRole)
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You do not have permission.",
        });
      }

      next();
    } catch (error) {
      console.error("Admin authorization error:", error);

      return res.status(500).json({
        success: false,
        message: "Admin authorization failed.",
      });
    }
  };
}

module.exports = adminMiddleware;
