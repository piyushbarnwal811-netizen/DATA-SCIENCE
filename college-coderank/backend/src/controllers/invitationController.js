import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Invitation from "../models/Invitation.js";
import Admin from "../models/Admin.js";
import Directorate from "../models/Directorate.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
import { sendInvitationEmail } from "../services/emailService.js";

/**
 * Institutional Audit Log helper
 */
async function logAudit(user, action, entityType, entityId, details, req) {
  try {
    await AuditLog.create({
      userId: user?._id || user?.id ? new mongoose.Types.ObjectId(user._id || user.id) : null,
      userName: user?.name || "System Admin",
      userEmail: user?.email || "admin@rungta.ac.in",
      role: user?.role || "system",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      details,
      ipAddress: req?.ip || "127.0.0.1"
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to record in invitationController:", err.message);
  }
}

/**
 * Helper to get the client base URL for links
 */
function getClientBaseUrl() {
  return process.env.CLIENT_URL || "http://localhost:3000";
}

/**
 * POST /api/invitations
 * Create a new account invitation and send the secure setup link via email.
 */
export async function createInvitation(req, res, next) {
  try {
    const {
      name,
      email,
      role,
      directorateId,
      departmentId,
      employeeId,
      designation,
      phone
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Full name and official email address are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const creatorRole = req.user.role;
    let targetRole = "";
    let targetDirectorateId = null;
    let targetDepartmentId = null;
    let directorateObj = null;
    let departmentObj = null;

    // 1. Strict Server-Side Hierarchy Role & Scope Verification
    if (creatorRole === "super_admin") {
      if (!role || !["tpo", "director"].includes(role)) {
        return res.status(400).json({
          message: "Super Admin can only invite TPO or Director accounts."
        });
      }
      targetRole = role;

      if (targetRole === "director") {
        if (directorateId) {
          directorateObj = await Directorate.findById(directorateId);
          if (!directorateObj) {
            return res.status(404).json({ message: "Selected Directorate does not exist." });
          }
          targetDirectorateId = directorateObj._id;
        }
      }
    } else if (creatorRole === "director") {
      if (role && role !== "hod") {
        return res.status(403).json({
          message: "Directors can only invite Head of Department (HOD) accounts."
        });
      }
      targetRole = "hod";

      if (!departmentId) {
        return res.status(400).json({
          message: "Department selection is required when inviting an HOD."
        });
      }

      departmentObj = await Department.findById(departmentId);
      if (!departmentObj) {
        return res.status(404).json({ message: "Selected Department does not exist." });
      }

      // Ensure department belongs to the director's assigned directorate
      const directorAdmin = await Admin.findById(req.user.id);
      if (
        !directorAdmin.directorateId ||
        departmentObj.directorateId.toString() !== directorAdmin.directorateId.toString()
      ) {
        return res.status(403).json({
          message: "Unauthorized: You can only invite HODs for departments within your assigned Directorate."
        });
      }

      targetDirectorateId = departmentObj.directorateId;
      targetDepartmentId = departmentObj._id;
    } else if (creatorRole === "hod") {
      if (role && role !== "teacher") {
        return res.status(403).json({
          message: "HODs can only invite Teacher accounts."
        });
      }
      targetRole = "teacher";

      const hodAdmin = await Admin.findById(req.user.id);
      if (!hodAdmin.departmentId) {
        return res.status(400).json({
          message: "Your HOD account is not linked to any department. Contact your Director."
        });
      }

      departmentObj = await Department.findById(hodAdmin.departmentId);
      targetDepartmentId = hodAdmin.departmentId;
      targetDirectorateId = departmentObj?.directorateId || null;
    } else {
      return res.status(403).json({
        message: "You are not authorized to issue institutional account invitations."
      });
    }

    // 2. Prevent duplicate active accounts
    const existingAdmin = await Admin.findOne({ email: cleanEmail });
    if (existingAdmin) {
      return res.status(409).json({
        message: "An active or registered user account with this email address already exists."
      });
    }

    // 3. Prevent duplicate active pending invitations
    const existingPending = await Invitation.findOne({
      email: cleanEmail,
      status: "pending",
      expiresAt: { $gt: new Date() }
    });

    if (existingPending) {
      return res.status(409).json({
        message: "A pending invitation already exists for this email address. You can resend or revoke it from the invitations list."
      });
    }

    // Clean up any old expired or revoked invitations for this email to maintain clean state
    await Invitation.updateMany(
      { email: cleanEmail, status: "pending", expiresAt: { $lte: new Date() } },
      { $set: { status: "expired" } }
    );

    // 4. Cryptographically secure token generation
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiryHours = Number(process.env.INVITATION_EXPIRY_HOURS) || 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      name: name.trim(),
      email: cleanEmail,
      role: targetRole,
      directorateId: targetDirectorateId,
      departmentId: targetDepartmentId,
      tokenHash,
      status: "pending",
      expiresAt,
      invitedBy: req.user.id,
      lastSentAt: new Date()
    });

    // 5. Send Real Email
    const clientBaseUrl = getClientBaseUrl();
    const setupLink = `${clientBaseUrl}/setup-account?token=${rawToken}`;

    await sendInvitationEmail({
      to: cleanEmail,
      recipientName: name.trim(),
      role: targetRole,
      setupLink,
      expiresInHours: expiryHours,
      invitedByName: req.user.name || "University Administration",
      departmentName: departmentObj?.name || "",
      directorateName: directorateObj?.name || ""
    });

    // 6. Record Audit Log
    await logAudit(
      req.user,
      "SEND_INVITATION",
      "Invitation",
      invitation._id,
      `Sent ${targetRole.toUpperCase()} account invitation to ${name} (${cleanEmail})`,
      req
    );

    return res.status(201).json({
      message: `Invitation successfully sent to ${cleanEmail}.`,
      invitation: {
        id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        directorateId: invitation.directorateId,
        departmentId: invitation.departmentId
      },
      // In development mode, also provide the setupLink for convenience
      ...(process.env.NODE_ENV !== "production" ? { setupLink } : {})
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/invitations
 * List all invitations scoped by caller's role and authority.
 */
export async function getInvitations(req, res, next) {
  try {
    const creatorRole = req.user.role;
    let query = {};

    if (creatorRole === "super_admin") {
      // Super admin can see all invitations, or optionally filter by role
      if (req.query.role) {
        query.role = req.query.role;
      }
    } else if (creatorRole === "director") {
      const directorAdmin = await Admin.findById(req.user.id);
      query = {
        role: "hod",
        $or: [
          { invitedBy: req.user.id },
          { directorateId: directorAdmin?.directorateId }
        ]
      };
    } else if (creatorRole === "hod") {
      const hodAdmin = await Admin.findById(req.user.id);
      query = {
        role: "teacher",
        $or: [
          { invitedBy: req.user.id },
          { departmentId: hodAdmin?.departmentId }
        ]
      };
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    const invitations = await Invitation.find(query)
      .populate("invitedBy", "name email role")
      .populate("directorateId", "name code")
      .populate("departmentId", "name code")
      .sort({ createdAt: -1 });

    // Dynamically mark expired status
    const now = new Date();
    const sanitized = invitations.map((inv) => {
      let currentStatus = inv.status;
      if (currentStatus === "pending" && inv.expiresAt < now) {
        currentStatus = "expired";
      }
      return {
        _id: inv._id,
        id: inv._id,
        name: inv.name,
        email: inv.email,
        role: inv.role,
        status: currentStatus,
        expiresAt: inv.expiresAt,
        invitedBy: inv.invitedBy,
        directorate: inv.directorateId,
        department: inv.departmentId,
        lastSentAt: inv.lastSentAt,
        resendCount: inv.resendCount,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt
      };
    });

    return res.json({ invitations: sanitized });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/invitations/:id/resend
 * Regenerate token and resend invitation email to recipient.
 */
export async function resendInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id)
      .populate("directorateId", "name")
      .populate("departmentId", "name");

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    if (invitation.status === "accepted") {
      return res.status(400).json({ message: "Cannot resend an invitation that has already been accepted." });
    }

    // Verify creator authority
    const creatorRole = req.user.role;
    if (creatorRole !== "super_admin") {
      if (creatorRole === "director" && invitation.role !== "hod") {
        return res.status(403).json({ message: "Unauthorized: You can only resend HOD invitations." });
      }
      if (creatorRole === "hod" && invitation.role !== "teacher") {
        return res.status(403).json({ message: "Unauthorized: You can only resend Teacher invitations." });
      }
    }

    // Generate new secure token and refresh expiry
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiryHours = Number(process.env.INVITATION_EXPIRY_HOURS) || 24;

    invitation.tokenHash = tokenHash;
    invitation.status = "pending";
    invitation.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    invitation.lastSentAt = new Date();
    invitation.resendCount = (invitation.resendCount || 0) + 1;
    await invitation.save();

    // Send email
    const clientBaseUrl = getClientBaseUrl();
    const setupLink = `${clientBaseUrl}/setup-account?token=${rawToken}`;

    await sendInvitationEmail({
      to: invitation.email,
      recipientName: invitation.name,
      role: invitation.role,
      setupLink,
      expiresInHours: expiryHours,
      invitedByName: req.user.name || "University Administration",
      departmentName: invitation.departmentId?.name || "",
      directorateName: invitation.directorateId?.name || ""
    });

    // Audit log
    await logAudit(
      req.user,
      "RESEND_INVITATION",
      "Invitation",
      invitation._id,
      `Resent invitation to ${invitation.name} (${invitation.email}) for role ${invitation.role.toUpperCase()}`,
      req
    );

    return res.json({
      message: `Invitation successfully resent to ${invitation.email}.`,
      invitation: {
        id: invitation._id,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        resendCount: invitation.resendCount,
        lastSentAt: invitation.lastSentAt
      },
      ...(process.env.NODE_ENV !== "production" ? { setupLink } : {})
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/invitations/:id or POST /api/invitations/:id/revoke
 * Revoke/cancel an active or pending invitation.
 */
export async function revokeInvitation(req, res, next) {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    if (invitation.status === "accepted") {
      return res.status(400).json({ message: "Cannot revoke an invitation that has already been accepted." });
    }

    // Verify creator authority
    const creatorRole = req.user.role;
    if (creatorRole !== "super_admin") {
      if (creatorRole === "director" && invitation.role !== "hod") {
        return res.status(403).json({ message: "Unauthorized: You can only revoke HOD invitations." });
      }
      if (creatorRole === "hod" && invitation.role !== "teacher") {
        return res.status(403).json({ message: "Unauthorized: You can only revoke Teacher invitations." });
      }
    }

    invitation.status = "revoked";
    invitation.revokedAt = new Date();
    invitation.revokedBy = req.user.id;
    await invitation.save();

    await logAudit(
      req.user,
      "REVOKE_INVITATION",
      "Invitation",
      invitation._id,
      `Revoked invitation for ${invitation.name} (${invitation.email})`,
      req
    );

    return res.json({ message: "Invitation has been revoked successfully." });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/invitations/verify
 * Public endpoint to verify that a token in an invitation link is valid, active, and unexpired.
 */
export async function verifyInvitationToken(req, res, next) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invitation security token is missing." });
    }

    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const invitation = await Invitation.findOne({ tokenHash: hashedToken })
      .populate("directorateId", "name code")
      .populate("departmentId", "name code");

    if (!invitation) {
      return res.status(404).json({
        message: "This invitation link is invalid or could not be found."
      });
    }

    if (invitation.status === "revoked") {
      return res.status(400).json({
        message: "This invitation has been revoked by the institution administrator."
      });
    }

    if (invitation.status === "accepted") {
      return res.status(400).json({
        message: "This invitation has already been used to set up an account. Please sign in."
      });
    }

    if (invitation.expiresAt < new Date() || invitation.status === "expired") {
      if (invitation.status !== "expired") {
        invitation.status = "expired";
        await invitation.save();
      }
      return res.status(400).json({
        message: "This invitation link has expired. Please contact your administrator to request a new invitation."
      });
    }

    return res.json({
      valid: true,
      invitation: {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        directorateName: invitation.directorateId?.name || null,
        departmentName: invitation.departmentId?.name || null
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/invitations/accept
 * Public endpoint for invitee to set their password and activate their real account.
 */
export async function acceptInvitation(req, res, next) {
  try {
    const {
      token,
      password,
      confirmPassword,
      phone,
      employeeId,
      designation,
      qualification
    } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Security invitation token is required." });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Password and password confirmation are required." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Password strength enforcement
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters in length." });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter." });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one lowercase letter." });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one numerical digit." });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      return res.status(400).json({ message: "Password must contain at least one special symbol." });
    }

    // Verify token atomically
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const invitation = await Invitation.findOne({ tokenHash: hashedToken });

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or unrecognized invitation token." });
    }

    if (invitation.status === "revoked") {
      return res.status(400).json({ message: "This invitation was revoked by the institution administrator." });
    }

    if (invitation.status === "accepted") {
      return res.status(400).json({ message: "This invitation has already been accepted." });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ message: "This invitation has expired. Please contact your administrator." });
    }

    // Ensure no account already exists with this email
    const existingAdmin = await Admin.findOne({ email: invitation.email });
    if (existingAdmin) {
      return res.status(409).json({ message: "An account with this email address is already active. Please sign in." });
    }

    // Hash user-chosen password securely with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Create real Admin account in MongoDB
    const newAdmin = await Admin.create({
      name: invitation.name,
      email: invitation.email,
      password: passwordHash,
      role: invitation.role,
      status: "active",
      directorateId: invitation.directorateId || undefined,
      departmentId: invitation.departmentId || undefined,
      phone: phone?.trim(),
      employeeId: employeeId?.trim() || undefined,
      designation: designation?.trim() || undefined,
      qualification: qualification?.trim() || undefined,
      createdBy: invitation.invitedBy,
      reportsTo: invitation.invitedBy,
      mustChangePassword: false, // The user chose their own password during setup!
      tokenVersion: 0
    });

    // Update organizational references
    if (invitation.role === "director" && invitation.directorateId) {
      await Directorate.findByIdAndUpdate(invitation.directorateId, { directorId: newAdmin._id });
    } else if (invitation.role === "hod" && invitation.departmentId) {
      await Department.findByIdAndUpdate(invitation.departmentId, { hodId: newAdmin._id });
    }

    // Mark invitation as single-use accepted
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.createdUserId = newAdmin._id;
    await invitation.save();

    // Institutional Audit Log
    await logAudit(
      newAdmin,
      "ACCEPT_INVITATION",
      "Admin",
      newAdmin._id,
      `User ${newAdmin.name} (${newAdmin.email}) accepted invitation and activated ${newAdmin.role.toUpperCase()} account.`,
      req
    );

    return res.status(200).json({
      message: "Account setup complete! Your official account is now active. You can now sign in.",
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    return next(error);
  }
}
