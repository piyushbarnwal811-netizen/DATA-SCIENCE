import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  if (!payload || typeof payload === "string" || !["admin", "student"].includes(payload.role)) {
    return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
  }
  try {
    const Model = payload.role === "admin" ? Admin : Student;
    const user = await Model.findById(payload.sub).select("-password");
    if (!user) return res.status(401).json({ message: "This account is no longer available." });
    req.user = { id: String(user._id), role: payload.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "You do not have permission to do that." });
    }
    return next();
  };
}