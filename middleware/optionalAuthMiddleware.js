
const { getAuth } = require("../config/auth-loader.cjs");

async function optionalAuthMiddleware(req, res, next) {
  try {
    const auth = await getAuth();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (session && session.user) {
      req.user = session.user;
      req.session = session.session;
    } else {
      req.user = null;
      req.session = null;
    }

    return next();
  } catch (error) {
    console.error("Optional authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify customer session.",
    });
  }
}

module.exports = optionalAuthMiddleware;
