import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: missing token" });
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const decoded = jwt.verify(token, secret);
    if (decoded.type === "refresh") {
      return res.status(401).json({ message: "Unauthorized: refresh tokens cannot authenticate requests" });
    }

    // Re-check the account on every request so a deactivation takes effect
    // immediately instead of waiting out the token's 7-day lifetime.
    const user = await User.findById(decoded.userId).select("isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized: account is deactivated" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user?.role || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  return next();
};

export const requirePermission = (permission) => (req, res, next) => {
  const perms = req.user?.permissions || [];
  if (!perms.includes(permission)) {
    return res.status(403).json({ message: "Forbidden: missing permission" });
  }
  return next();
};
