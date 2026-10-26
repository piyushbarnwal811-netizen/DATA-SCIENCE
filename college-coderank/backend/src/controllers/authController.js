import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Department from "../models/Department.js";
import Student from "../models/Student.js";
import { cleanGitHubUsername } from "../services/githubService.js";
import { cleanLeetCodeUsername } from "../services/leetcodeService.js";
import { cleanHackerRankUsername } from "../services/hackerrankService.js";
import { cleanCodeChefUsername } from "../services/codechefService.js";
import { cleanGeeksforGeeksUsername } from "../services/geeksforgeeksService.js";
import { syncStudentAllStats } from "../utils/studentSync.js";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangedConfirmationEmail
} from "../services/emailService.js";

/**
 * Generates a full-access JWT session token.
 */
export function createToken(user, role) {
  const effectiveRole = role === "admin" ? "super_admin" : role;
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      role: effectiveRole,
      scope: "FULL_ACCESS",
      tokenVersion: user.tokenVersion ?? 0
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Generates a restricted-scope JWT for users flagged with must_change_password: true.
 * Blocks all standard portal features until force-change-password is completed.
 */
export function createRestrictedToken(user, role = "student") {
  const effectiveRole = user.role || (role === "admin" ? "super_admin" : role);
  return jwt.sign(
    {
      sub: String(user._id || user.id),
      role: effectiveRole,
      scope: "FORCE_PASSWORD_CHANGE",
      tokenVersion: user.tokenVersion ?? 0
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" }
  );
}

export function publicUser(user, role) {
  const effectiveRole = user.role || (role === "admin" ? "super_admin" : role);
  const mustChange = Boolean(user.mustChangePassword || user.must_change_password);

  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: effectiveRole,
    must_change_password: mustChange,
    mustChangePassword: mustChange,
    ...(effectiveRole === "student"
      ? {
          studentId: user.studentId,
          branch: user.branch,
          section: user.section,
          year: user.year,
          githubUsername: user.githubUsername,
          leetcodeUsername: user.leetcodeUsername,
          hackerrankUsername: user.hackerrankUsername,
          codechefUsername: user.codechefUsername,
          geeksforgeeksUsername: user.geeksforgeeksUsername
        }
      : {
          employeeId: user.employeeId,
          phone: user.phone,
          designation: user.designation,
          qualification: user.qualification,
          status: user.status || "active",
          directorateId: user.directorateId,
          departmentId: user.departmentId,
          assignedSections: user.assignedSections || [],
          assignedSubjects: user.assignedSubjects || [],
          maxWeeklyHours: user.maxWeeklyHours
        })
  };
}

export async function registerStudent(req, res, next) {
  try {
    const {
      name,
      fullName,
      email,
      password,
      studentId,
      rollNumber,
      rollNo,
      branch,
      department,
      section,
      year,
      githubUsername,
      github,
      githubHandle,
      leetcodeUsername,
      leetcode,
      leetcodeHandle,
      hackerrankUsername,
      hackerrank,
      hackerrankHandle,
      codechefUsername,
      codechef,
      codechefHandle,
      geeksforgeeksUsername,
      geeksforgeeks,
      geeksforgeeksHandle,
      gfg,
      gfgUsername,
      gfgHandle
    } = req.body;

    const resolvedName = String(name || fullName || "").trim();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedBranch = String(branch || department || "").trim();
    const normalizedSection = String(section ?? "").trim();
    const numericYear = Number(year);
    const rawStudentId = studentId || rollNumber || rollNo;
    const resolvedStudentId = rawStudentId && String(rawStudentId).trim() ? String(rawStudentId).trim() : undefined;

    const rawGh = githubUsername || github || githubHandle;
    const rawLc = leetcodeUsername || leetcode || leetcodeHandle;
    const rawHr = hackerrankUsername || hackerrank || hackerrankHandle;
    const rawCc = codechefUsername || codechef || codechefHandle;
    const rawGfg = geeksforgeeksUsername || geeksforgeeks || geeksforgeeksHandle || gfg || gfgUsername || gfgHandle;

    if (!resolvedName || !normalizedEmail || !password || !normalizedBranch || !normalizedSection || !year) {
      return res.status(400).json({ message: "Complete all required fields to create an account." });
    }
    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 8) {
      return res.status(400).json({ message: "Choose a valid year between 1 and 8." });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ message: passwordCheck.message });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await Student.findOne({ email: normalizedEmail }).select("+password");

    const cleanGh = cleanGitHubUsername(rawGh);
    const cleanLc = cleanLeetCodeUsername(rawLc);
    const cleanHr = cleanHackerRankUsername(rawHr);
    const cleanCc = cleanCodeChefUsername(rawCc);
    const cleanGfg = cleanGeeksforGeeksUsername(rawGfg);

    let student;

    if (existing) {
      if (existing.password) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      Object.assign(existing, {
        name: resolvedName,
        password: passwordHash,
        studentId: resolvedStudentId || existing.studentId,
        branch: normalizedBranch,
        section: normalizedSection,
        year: numericYear,
        mustChangePassword: false,
        tokenVersion: (existing.tokenVersion || 0) + 1,
        ...(cleanGh ? { githubUsername: cleanGh } : {}),
        ...(cleanLc ? { leetcodeUsername: cleanLc } : {}),
        ...(cleanHr ? { hackerrankUsername: cleanHr } : {}),
        ...(cleanCc ? { codechefUsername: cleanCc } : {}),
        ...(cleanGfg ? { geeksforgeeksUsername: cleanGfg } : {})
      });
      student = await existing.save();
    } else {
      student = await Student.create({
        name: resolvedName,
        email: normalizedEmail,
        password: passwordHash,
        studentId: resolvedStudentId,
        branch: normalizedBranch,
        section: normalizedSection,
        year: numericYear,
        mustChangePassword: false,
        githubUsername: cleanGh,
        leetcodeUsername: cleanLc,
        hackerrankUsername: cleanHr,
        codechefUsername: cleanCc,
        geeksforgeeksUsername: cleanGfg
      });
    }

    await Department.updateOne(
      { name: normalizedBranch },
      { $setOnInsert: { name: normalizedBranch }, $addToSet: { sections: normalizedSection } },
      { upsert: true }
    );

    // Auto-sync platform stats immediately in the background
    if (student.githubUsername || student.leetcodeUsername || student.hackerrankUsername || student.codechefUsername || student.geeksforgeeksUsername) {
      syncStudentAllStats(student._id, { source: "registration" }).catch((syncErr) => {
        console.warn(`[Registration] Immediate sync for ${student.email} failed:`, syncErr.message);
      });
    }

    return res.status(201).json({
      token: createToken(student, "student"),
      user: publicUser(student, "student")
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, role, accountType } = req.body;
    const requestedRole = role || accountType;
    if (!email || !password) {
      return res.status(400).json({ message: "Enter your email and password." });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Helper to evaluate student login and flag temporary password
    const handleStudentLogin = (student) => {
      const isForced = Boolean(student.mustChangePassword || student.must_change_password);

      if (isForced) {
        return res.status(200).json({
          status: "FORCE_PASSWORD_CHANGE",
          must_change_password: true,
          mustChangePassword: true,
          message: "First-time login detected. You hold a temporary password and must set a new one before continuing.",
          token: createRestrictedToken(student),
          user: publicUser(student, "student")
        });
      }

      return res.json({
        token: createToken(student, "student"),
        user: publicUser(student, "student")
      });
    };

    // 1. If explicitly requested student, or check student first
    if (requestedRole === "student") {
      const student = await Student.findOne({ email: cleanEmail }).select("+password");
      if (!student?.password || !(await bcrypt.compare(password, student.password))) {
        return res.status(401).json({ message: "Email or password is incorrect." });
      }
      return handleStudentLogin(student);
    }

    // 2. Check Admin / Hierarchy Staff collection
    const staffUser = await Admin.findOne({ email: cleanEmail })
      .populate("directorateId", "name code")
      .populate("departmentId", "name code")
      .select("+password");

    if (staffUser) {
      if (!staffUser.password || !(await bcrypt.compare(password, staffUser.password))) {
        return res.status(401).json({ message: "Email or password is incorrect." });
      }

      if (staffUser.status === "inactive" || staffUser.status === "suspended") {
        return res.status(403).json({
          message: "Your account has been deactivated or suspended. Please contact the administrator."
        });
      }

      const userRole = staffUser.role || "super_admin";
      const isForced = Boolean(staffUser.mustChangePassword);

      if (isForced) {
        return res.status(200).json({
          status: "FORCE_PASSWORD_CHANGE",
          must_change_password: true,
          mustChangePassword: true,
          message: "First-time login detected. You hold a temporary password and must set a new one before continuing.",
          token: createRestrictedToken(staffUser, userRole),
          user: publicUser(staffUser, userRole)
        });
      }

      return res.json({ token: createToken(staffUser, userRole), user: publicUser(staffUser, userRole) });
    }

    // 3. Fallback: if user didn't specify role, check student
    const fallbackStudent = await Student.findOne({ email: cleanEmail }).select("+password");
    if (fallbackStudent && fallbackStudent.password && (await bcrypt.compare(password, fallbackStudent.password))) {
      return handleStudentLogin(fallbackStudent);
    }

    return res.status(401).json({ message: "Email or password is incorrect." });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/force-change-password
 * First-Time Mandatory Password Change Workflow
 */
export async function forceChangePassword(req, res, next) {
  try {
    const currentPassword = req.body.current_password || req.body.currentPassword;
    const newPassword = req.body.new_password || req.body.newPassword;
    const confirmPassword = req.body.confirm_password || req.body.confirmPassword;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please provide current_password, new_password, and confirm_password."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match."
      });
    }

    // req.user was populated with student or admin (+password) by requirePasswordChangePendingAuth
    const user = req.user;
    const effectiveRole = req.userRole || user.role || "student";

    if (!user.password) {
      return res.status(400).json({ message: "No password configured for this account." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({ message: strengthCheck.message });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password cannot be identical to the temporary password."
      });
    }

    // Hash with bcrypt (10 rounds per spec)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.mustChangePassword = false;
    // Invalidate prior temporary session tokens
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Return fresh full-access JWT
    const fullAccessToken = createToken(user, effectiveRole);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Password changed successfully! You now have full access to the portal.",
      token: fullAccessToken,
      user: publicUser(user, effectiveRole)
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 * Self-Service Forgot Password Request via Email Verification
 */
export async function forgotPassword(req, res, next) {
  try {
    const target = String(
      req.body.email || req.body.roll_number || req.body.rollNumber || req.body.studentId || ""
    ).trim();

    if (!target) {
      return res.status(400).json({
        message: "Please enter your registered email address or student roll number."
      });
    }

    const normalizedEmail = target.toLowerCase();
    const student = await Student.findOne({
      $or: [
        { email: normalizedEmail },
        { studentId: target }
      ]
    });

    // Security Measure: Generic success message to prevent user enumeration
    const genericResponse = {
      message: "If an account exists with this email or student ID, a password reset link has been sent to the registered email."
    };

    if (!student || !student.email) {
      return res.status(200).json(genericResponse);
    }

    // Cryptographically secure random token (32 bytes hex)
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Store SHA-256 hash in database
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    // Expiration window: exactly 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    student.resetPasswordTokenHash = tokenHash;
    student.resetPasswordExpiresAt = expiresAt;
    student.resetPasswordUsed = false;
    await student.save();

    const clientBaseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(student.email)}`;
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "Unknown";

    sendPasswordResetEmail({
      to: student.email,
      studentName: student.name,
      resetLink,
      expiresInMinutes: 15,
      clientIp
    }).catch((emailErr) => {
      console.error(`[ForgotPassword] Failed to send email to ${student.email}:`, emailErr.message);
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Password Reset Execution using Token Verification
 */
export async function resetPassword(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const token = String(req.body.token || "").trim();
    const newPassword = req.body.new_password || req.body.newPassword;
    const confirmPassword = req.body.confirm_password || req.body.confirmPassword;

    if (!email || !token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Email, reset token, new password, and confirmation are required."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match."
      });
    }

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({ message: strengthCheck.message });
    }

    const incomingTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const student = await Student.findOne({ email }).select(
      "+password +resetPasswordTokenHash +resetPasswordExpiresAt +resetPasswordUsed"
    );

    // Look up record, verify token has not expired and used == false
    if (
      !student ||
      !student.resetPasswordTokenHash ||
      student.resetPasswordUsed === true ||
      !student.resetPasswordExpiresAt ||
      student.resetPasswordExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "The password reset link is invalid, expired, or has already been used. Please request a new link."
      });
    }

    // Constant-time comparison to prevent timing side-channel attacks
    const storedHashBuffer = Buffer.from(student.resetPasswordTokenHash, "hex");
    const incomingHashBuffer = Buffer.from(incomingTokenHash, "hex");

    if (
      storedHashBuffer.length !== incomingHashBuffer.length ||
      !crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer)
    ) {
      return res.status(400).json({
        message: "The password reset link is invalid, expired, or has already been used. Please request a new link."
      });
    }

    // Ensure new_password is not identical to existing password
    if (student.password && (await bcrypt.compare(newPassword, student.password))) {
      return res.status(400).json({
        message: "New password cannot be identical to your current password."
      });
    }

    // Hash new password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    student.password = hashedPassword;
    student.resetPasswordUsed = true;
    student.resetPasswordTokenHash = null;
    student.resetPasswordExpiresAt = null;
    student.mustChangePassword = false;
    // Invalidate all existing active sessions/refresh tokens for that student
    student.tokenVersion = (student.tokenVersion || 0) + 1;
    await student.save();

    const clientIp = req.ip || req.headers["x-forwarded-for"] || "Unknown";

    // Send transactional confirmation email
    sendPasswordChangedConfirmationEmail({
      to: student.email,
      studentName: student.name,
      timestamp: new Date().toUTCString(),
      clientIp
    }).catch((emailErr) => {
      console.error(`[ResetPassword] Failed to send confirmation email to ${student.email}:`, emailErr.message);
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Your portal password was successfully updated. All active sessions have been invalidated. Please sign in with your new password."
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/auth/verify-reset-token
 * Validates a reset token from URL parameters before displaying the reset form
 */
export async function verifyResetToken(req, res, next) {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const token = String(req.query.token || "").trim();

    if (!email || !token) {
      return res.status(400).json({ valid: false, message: "Missing email or reset token." });
    }

    const incomingTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const student = await Student.findOne({ email }).select(
      "+resetPasswordTokenHash +resetPasswordExpiresAt +resetPasswordUsed"
    );

    if (
      !student ||
      !student.resetPasswordTokenHash ||
      student.resetPasswordUsed === true ||
      !student.resetPasswordExpiresAt ||
      student.resetPasswordExpiresAt < new Date()
    ) {
      return res.status(400).json({
        valid: false,
        message: "This password reset link is invalid, expired, or has already been used."
      });
    }

    const storedHashBuffer = Buffer.from(student.resetPasswordTokenHash, "hex");
    const incomingHashBuffer = Buffer.from(incomingTokenHash, "hex");

    if (
      storedHashBuffer.length !== incomingHashBuffer.length ||
      !crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer)
    ) {
      return res.status(400).json({ valid: false, message: "Invalid reset token." });
    }

    return res.status(200).json({
      valid: true,
      email: student.email,
      name: student.name
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const isStudent = req.user.role === "student";
    let user;
    if (isStudent) {
      user = await Student.findById(req.user.id);
    } else {
      user = await Admin.findById(req.user.id)
        .populate("directorateId", "name code")
        .populate("departmentId", "name code");
    }
    if (!user) return res.status(404).json({ message: "Account not found." });
    return res.json({ user: publicUser(user, req.user.role) });
  } catch (error) {
    return next(error);
  }
}