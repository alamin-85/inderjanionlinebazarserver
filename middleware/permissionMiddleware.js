
const ROLE_PERMISSIONS = {
  super_admin: ["*"],

  admin: [
    "users:read",
    "users:update",
    "products:create",
    "products:read",
    "products:update",
    "products:delete",
    "categories:create",
    "categories:read",
    "categories:update",
    "categories:delete",
    "orders:read",
    "orders:update",
    "orders:delete",
  ],

  manager: [
    "products:create",
    "products:read",
    "products:update",
    "categories:read",
    "orders:read",
    "orders:update",
  ],

  staff: [
    "orders:read",
    "orders:update",
  ],

  customer: [
    "orders:create",
    "orders:read_own",
  ],
};

function permissionMiddleware(...requiredPermissions) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please login first.",
        });
      }

      const role = req.user.role;
      const permissions = ROLE_PERMISSIONS[role];

      if (!permissions) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Invalid user role.",
        });
      }

      // Super Admin has all permissions
      if (permissions.includes("*")) {
        return next();
      }

      // Check all required permissions
      const hasPermission = requiredPermissions.every(
        (permission) => permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You do not have the required permission.",
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        success: false,
        message: "Permission verification failed.",
      });
    }
  };
}

module.exports = {
  permissionMiddleware,
  ROLE_PERMISSIONS,
};
