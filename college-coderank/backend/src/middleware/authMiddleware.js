import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js";

const STAFF_ROLES = ["super_admin", "admin", "tpo", "director", "hod", "teacher"];

/**
 * Standard Route Protection Middleware
 * - Verifies JWT
 * - Enforces session invalidation via tokenVersion
 * - Intercepts and blocks students with must_change_password === true or restricted scope
 */
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

  if (!payload || typeof payload === "string") {
    return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
  }

  // 1. Intercept tokens with restricted FORCE_PASSWORD_CHANGE scope
  if (payload.scope === "FORCE_PASSWORD_CHANGE") {
    return res.status(403).json({
      status: "FORCE_PASSWORD_CHANGE",
      code: "PASSWORD_CHANGE_REQUIRED",
      must_change_password: true,
      message: "You hold a temporary password and must complete mandatory password change before accessing portal endpoints."
    });
  }

  const rawRole = payload.role === "admin" ? "super_admin" : payload.role;

  try {
    let user;
    if (rawRole === "student") {
      user = await Student.findById(payload.sub).select("-password");
    } else if (STAFF_ROLES.includes(rawRole)) {
      user = await Admin.findById(payload.sub)
        .populate("directorateId", "name code")
        .populate("departmentId", "name code")
        .select("-password");
    }

    if (!user) return res.status(401).json({ message: "This account is no longer available." });

    // 2. Intercept student accounts if must_change_password is still active in database
    if (rawRole === "student" && (user.mustChangePassword || user.must_change_password)) {
      return res.status(403).json({
        status: "FORCE_PASSWORD_CHANGE",
        code: "PASSWORD_CHANGE_REQUIRED",
        must_change_password: true,
        message: "First-time password change required before accessing portal features."
      });
    }

    // 3. Invalidate older sessions if tokenVersion has been incremented (e.g. after password reset)
    if (payload.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (payload.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({
          message: "Your session has been invalidated due to a password change. Please sign in again."
        });
      }
    }

    const effectiveRole = user.role || rawRole;

    req.user = {
      id: String(user._id),
      role: effectiveRole,
      name: user.name,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
      mustChangePassword: Boolean(user.mustChangePassword || user.must_change_password),
      employeeId: user.employeeId,
      designation: user.designation,
      directorateId: user.directorateId?._id || user.directorateId,
      directorate: user.directorateId,
      departmentId: user.departmentId?._id || user.departmentId,
      department: user.departmentId,
      assignedSections: user.assignedSections || [],
      assignedSubjects: user.assignedSubjects || []
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Gatekeeper Middleware for the Force Change Password endpoint.
 * Accepts either:
 * 1. Restricted token with scope "FORCE_PASSWORD_CHANGE"
 * 2. Regular token where user still has mustChangePassword === true
 */
export async function requirePasswordChangePendingAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({ message: "Authorization token required to change temporary password." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }

  if (!payload || typeof payload === "string") {
    return res.status(401).json({ message: "Invalid session token." });
  }

  try {
    const student = await Student.findById(payload.sub).select("+password");
    if (!student) {
      return res.status(401).json({ message: "Student account not found." });
    }

    // Check tokenVersion match
    if (payload.tokenVersion !== undefined && student.tokenVersion !== undefined) {
      if (payload.tokenVersion !== student.tokenVersion) {
        return res.status(401).json({
          message: "This session token has been revoked. Please sign in again."
        });
      }
    }

    req.user = student;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Middleware to restrict access to one or more allowed roles.
 * Usage: requireRole("super_admin") or requireRole("super_admin", "tpo", "director")
 */
export function requireRole(...allowedRoles) {
  const flatRoles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const currentRole = req.user.role === "admin" ? "super_admin" : req.user.role;
    const isSuper = currentRole === "super_admin" || req.user.role === "admin";

    // Super Admin has universal access
    if (isSuper) {
      return next();
    }

    if (!flatRoles.includes(currentRole) && !flatRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: Access requires [${flatRoles.join(" or ")}] privileges. Your role is '${req.user.role}'.`
      });
    }

    return next();
  };
}