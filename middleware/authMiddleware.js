
const { getAuth } = require("../config/auth-loader.cjs");

// Verify authenticated user
async function authMiddleware(req, res, next) {
  try {
    // Get Better Auth instance
    const auth = await getAuth();

    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    // Check whether user is logged in
    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    // Attach authenticated user and session
    req.user = session.user;
    req.session = session.session;

    return next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication verification failed.",
    });
  }
}

module.exports = authMiddleware;
