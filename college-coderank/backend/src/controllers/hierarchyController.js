import crypto from "crypto";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Directorate from "../models/Directorate.js";
import Department from "../models/Department.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import Classroom from "../models/Classroom.js";
import TimetableAssignment from "../models/TimetableAssignment.js";
import AuditLog from "../models/AuditLog.js";
import Student from "../models/Student.js";
import Invitation from "../models/Invitation.js";

/**
 * Helper to record actions in the institutional audit log
 */
async function logAudit(user, action, entityType, entityId, details, req) {
  try {
    await AuditLog.create({
      userId: user?.id ? String(user.id) : null,
      userName: user?.name || "System Admin",
      userEmail: user?.email || "admin@rungta.ac.in",
      role: user?.role || "super_admin",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      details,
      ipAddress: req?.ip || "127.0.0.1"
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to record:", err.message);
  }
}

// =========================================================================
// 1. SUPER ADMIN MODULES
// =========================================================================

/**
 * GET /api/hierarchy/super-admin/overview
 * Real high-level institutional statistics for Super Admin dashboard.
 * Focused on top-level metrics, not an expanded tree of the entire college.
 */
export async function getSuperAdminOverview(req, res, next) {
  try {
    const [
      tposCount,
      directorsCount,
      hodsCount,
      teachersCount,
      studentsCount,
      directoratesCount,
      departmentsCount,
      sectionsCount,
      auditLogsCount,
      recentLogs,
      directorates
    ] = await Promise.all([
      Admin.countDocuments({ role: "tpo", status: "active" }),
      Admin.countDocuments({ role: "director", status: "active" }),
      Admin.countDocuments({ role: "hod", status: "active" }),
      Admin.countDocuments({ role: "teacher", status: "active" }),
      Student.countDocuments({ isActive: { $ne: false } }),
      Directorate.countDocuments({ status: "active" }),
      Department.countDocuments({ status: "active" }),
      Section.countDocuments({ status: "active" }),
      AuditLog.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      Directorate.find().populate("directorId", "name email employeeId designation status").sort({ name: 1 })
    ]);

    return res.json({
      metrics: {
        tpos: tposCount,
        directors: directorsCount,
        hods: hodsCount,
        teachers: teachersCount,
        students: studentsCount,
        directorates: directoratesCount,
        departments: departmentsCount,
        sections: sectionsCount,
        auditLogs: auditLogsCount
      },
      recentLogs,
      directorates
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/hierarchy/tpos
 * List all TPOs (Super Admin and TPO authorized)
 */
export async function getTpos(req, res, next) {
  try {
    const tpos = await Admin.find({ role: "tpo" })
      .select("-password")
      .sort({ createdAt: -1 });
    return res.json({ tpos });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/tpos
 * Super Admin creates a new official TPO account
 */
export async function createTpo(req, res, next) {
  try {
    const { name, email, employeeId, phone, designation, temporaryPassword, password, mustChangePassword } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Official name and email address are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email address already exists." });
    }

    const resolvedPass = (password || temporaryPassword || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(resolvedPass, 10);
    const resolvedMustChange = mustChangePassword !== undefined ? Boolean(mustChangePassword) : false;

    const newTpo = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: "tpo",
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim() || "Head - Training & Placement Office (TPO)",
      status: "active",
      createdBy: req.user.id,
      mustChangePassword: resolvedMustChange,
      tokenVersion: 0
    });

    await logAudit(
      req.user,
      "CREATE_TPO",
      "Admin",
      newTpo._id,
      `Created TPO account for ${name} (${cleanEmail}) with direct password setup`,
      req
    );

    return res.status(201).json({
      message: "TPO account created successfully.",
      tpo: {
        id: newTpo._id,
        name: newTpo.name,
        email: newTpo.email,
        employeeId: newTpo.employeeId,
        phone: newTpo.phone,
        designation: newTpo.designation,
        status: newTpo.status,
        createdAt: newTpo.createdAt
      },
      credentials: {
        email: cleanEmail,
        password: resolvedPass,
        mustChangePassword: resolvedMustChange
      },
      temporaryCredentials: {
        email: cleanEmail,
        temporaryPassword: resolvedPass,
        mustChangePassword: resolvedMustChange
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/hierarchy/directors
 * List all Directors with their assigned directorates
 */
export async function getDirectors(req, res, next) {
  try {
    const directors = await Admin.find({ role: "director" })
      .populate("directorateId", "name code building")
      .select("-password")
      .sort({ createdAt: -1 });
    return res.json({ directors });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/directors
 * Super Admin creates a new Director account
 */
export async function createDirector(req, res, next) {
  try {
    const { name, email, employeeId, phone, designation, qualification, directorateId, temporaryPassword, password, mustChangePassword } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Director name and official email address are required." });
    }

    if (!directorateId) {
      return res.status(400).json({
        message: "School / Directorate selection is required. Please specify which School (e.g. SOCSE, SOIT) this Director is assigned to."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email address already exists." });
    }

    const resolvedPass = (password || temporaryPassword || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(resolvedPass, 10);
    const resolvedMustChange = mustChangePassword !== undefined ? Boolean(mustChangePassword) : false;

    const newDirector = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: "director",
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim() || "Director of Faculty / Institute",
      qualification: qualification?.trim(),
      directorateId: directorateId || undefined,
      status: "active",
      createdBy: req.user.id,
      mustChangePassword: resolvedMustChange,
      tokenVersion: 0
    });

    if (directorateId) {
      await Directorate.findByIdAndUpdate(directorateId, { directorId: newDirector._id });
    }

    await logAudit(
      req.user,
      "CREATE_DIRECTOR",
      "Admin",
      newDirector._id,
      `Created Director account for ${name} (${cleanEmail}) with direct password setup`,
      req
    );

    return res.status(201).json({
      message: "Director account created successfully.",
      director: {
        id: newDirector._id,
        name: newDirector.name,
        email: newDirector.email,
        employeeId: newDirector.employeeId,
        phone: newDirector.phone,
        designation: newDirector.designation,
        directorateId: newDirector.directorateId,
        status: newDirector.status,
        createdAt: newDirector.createdAt
      },
      credentials: {
        email: cleanEmail,
        password: resolvedPass,
        mustChangePassword: resolvedMustChange
      },
      temporaryCredentials: {
        email: cleanEmail,
        temporaryPassword: resolvedPass,
        mustChangePassword: resolvedMustChange
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/hierarchy/directors/:id
 * Super Admin or TPO removes a Director account and vacates their school leadership position.
 */
export async function deleteDirector(req, res, next) {
  try {
    const { id } = req.params;
    const director = await Admin.findOne({ _id: id, role: "director" });
    if (!director) {
      return res.status(404).json({ message: "Director record not found." });
    }

    // Vacate Director leadership on their assigned School(s)
    await Directorate.updateMany({ directorId: id }, { $unset: { directorId: "" } });

    // Revoke any pending invitations for this director's email
    await Invitation.updateMany(
      { role: "director", email: director.email, status: "pending" },
      { $set: { status: "revoked", revokedAt: new Date(), revokedBy: req.user.id } }
    );

    await Admin.findByIdAndDelete(id);

    await logAudit(
      req.user,
      "DELETE_DIRECTOR",
      "Admin",
      id,
      `Removed Director ${director.name} (${director.email}) and vacated School leadership`,
      req
    );

    return res.json({
      message: `Director ${director.name} was successfully removed. Their School leadership is now vacant.`
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/hierarchy/accounts
 * Unified account management: list all authorized staff accounts with filters
 */
export async function getAccounts(req, res, next) {
  try {
    const { role, status, search, directorateId, departmentId } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (directorateId) filter.directorateId = directorateId;
    if (departmentId) filter.departmentId = departmentId;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } }
      ];
    }

    const accounts = await Admin.find(filter)
      .populate("directorateId", "name code")
      .populate("departmentId", "name code")
      .populate("createdBy", "name email role")
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ accounts });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/hierarchy/accounts/:id/status
 * Activate, deactivate, or suspend any authorized account.
 * Safety: protects the last active Super Admin.
 */
export async function updateAccountStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active', 'inactive', or 'suspended'." });
    }

    const targetAccount = await Admin.findById(id);
    if (!targetAccount) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Safety rule 1: Super Admin cannot deactivate themselves
    if (String(req.user.id) === String(id) && status !== "active") {
      return res.status(400).json({ message: "You cannot deactivate or suspend your own administrative session." });
    }

    // Safety rule 2: Protect the last active Super Admin
    if (targetAccount.role === "super_admin" && status !== "active") {
      const activeSuperAdmins = await Admin.countDocuments({ role: "super_admin", status: "active" });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({
          message: "Action prohibited: Cannot deactivate or suspend the final active Super Administrator."
        });
      }
    }

    const oldStatus = targetAccount.status;
    targetAccount.status = status;
    if (status !== "active") {
      // Invalidate current sessions if deactivated or suspended
      targetAccount.tokenVersion = (targetAccount.tokenVersion || 0) + 1;
    }
    await targetAccount.save();

    await logAudit(
      req.user,
      "UPDATE_ACCOUNT_STATUS",
      "Admin",
      targetAccount._id,
      `Changed account status of ${targetAccount.name} (${targetAccount.email}, ${targetAccount.role}) from '${oldStatus}' to '${status}'`,
      req
    );

    return res.json({
      message: `Account status updated to ${status}.`,
      account: {
        id: targetAccount._id,
        name: targetAccount.name,
        email: targetAccount.email,
        role: targetAccount.role,
        status: targetAccount.status
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/accounts/:id/reset-password
 * Super Admin resets an account's password with a secure temporary password
 */
export async function resetAccountPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    const target = await Admin.findById(id);
    if (!target) return res.status(404).json({ message: "Account not found." });

    const newTempPassword = (temporaryPassword || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(newTempPassword, 10);

    target.password = passwordHash;
    target.mustChangePassword = true;
    target.tokenVersion = (target.tokenVersion || 0) + 1; // Invalidate all existing tokens
    await target.save();

    await logAudit(
      req.user,
      "RESET_PASSWORD",
      "Admin",
      target._id,
      `Super Admin initiated password reset for ${target.name} (${target.email}). Account flagged for mandatory change at next login.`,
      req
    );

    return res.json({
      message: `Password reset successfully for ${target.name}.`,
      temporaryCredentials: {
        email: target.email,
        temporaryPassword: newTempPassword,
        mustChangePassword: true
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PUT /api/hierarchy/accounts/:id
 * Super Admin updates account profile, role, and organizational links
 */
export async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      employeeId,
      phone,
      designation,
      qualification,
      status,
      directorateId,
      departmentId,
      assignedSections,
      assignedSubjects
    } = req.body;

    const user = await Admin.findById(id);
    if (!user) return res.status(404).json({ message: "Account not found." });

    if (name) user.name = name.trim();
    if (role) {
      // Safety: Cannot demote the last Super Admin
      if (user.role === "super_admin" && role !== "super_admin") {
        const activeSuperAdmins = await Admin.countDocuments({ role: "super_admin", status: "active" });
        if (activeSuperAdmins <= 1) {
          return res.status(400).json({ message: "Cannot change role of the last active Super Administrator." });
        }
      }
      user.role = role;
    }
    if (employeeId !== undefined) user.employeeId = employeeId?.trim() || undefined;
    if (phone !== undefined) user.phone = phone?.trim();
    if (designation !== undefined) user.designation = designation?.trim();
    if (qualification !== undefined) user.qualification = qualification?.trim();
    if (status) user.status = status;
    if (directorateId !== undefined) user.directorateId = directorateId || null;
    if (departmentId !== undefined) user.departmentId = departmentId || null;
    if (assignedSections !== undefined) user.assignedSections = assignedSections;
    if (assignedSubjects !== undefined) user.assignedSubjects = assignedSubjects;

    await user.save();

    // Re-link references if needed
    if (user.role === "director" && directorateId) {
      await Directorate.findByIdAndUpdate(directorateId, { directorId: user._id });
    }
    if (user.role === "hod" && departmentId) {
      await Department.findByIdAndUpdate(departmentId, { hodId: user._id });
    }

    await logAudit(
      req.user,
      "UPDATE_ACCOUNT",
      "Admin",
      user._id,
      `Updated profile and assignments for ${user.name} (${user.email})`,
      req
    );

    return res.json({ message: "Account updated successfully.", account: user });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/hierarchy/accounts/:id
 * Delete account with safety guards and dependent cleanup
 */
export async function deleteAccount(req, res, next) {
  try {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own administrative account." });
    }

    const user = await Admin.findById(id);
    if (!user) return res.status(404).json({ message: "Account not found." });

    // Safety: Protect the last active Super Admin
    if (user.role === "super_admin") {
      const activeSuperAdmins = await Admin.countDocuments({ role: "super_admin", status: "active" });
      if (activeSuperAdmins <= 1) {
        return res.status(400).json({ message: "Action prohibited: Cannot delete the last active Super Administrator." });
      }
    }

    await Admin.findByIdAndDelete(id);

    // Safely clear references in organizational models
    await Directorate.updateMany({ directorId: id }, { $unset: { directorId: "" } });
    await Directorate.updateMany({ tpoId: id }, { $unset: { tpoId: "" } });
    await Department.updateMany({ hodId: id }, { $unset: { hodId: "" } });
    await Section.updateMany({ classTeacherId: id }, { $unset: { classTeacherId: "" } });
    await TimetableAssignment.deleteMany({ teacherId: id });

    await logAudit(
      req.user,
      "DELETE_ACCOUNT",
      "Admin",
      id,
      `Permanently deleted ${user.role} account ${user.name} (${user.email}) and cleared associated references`,
      req
    );

    return res.json({ message: `Account for ${user.name} deleted successfully.` });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 2. DIRECTORATE CRUD (Super Admin / TPO)
// =========================================================================

export async function getDirectorates(req, res, next) {
  try {
    const directorates = await Directorate.find()
      .populate("directorId", "name email phone designation employeeId status")
      .populate("tpoId", "name email phone designation")
      .sort({ name: 1 });
    return res.json({ directorates });
  } catch (error) {
    return next(error);
  }
}

export async function createDirectorate(req, res, next) {
  try {
    const { name, code, description, directorId, tpoId, building } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: "Directorate name and code are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Directorate.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `Directorate with code ${cleanCode} already exists.` });
    }

    const created = await Directorate.create({
      name: name.trim(),
      code: cleanCode,
      description: description?.trim(),
      directorId: directorId || null,
      tpoId: tpoId || null,
      building: building?.trim(),
      createdBy: req.user.id
    });

    if (directorId) {
      await Admin.findByIdAndUpdate(directorId, { directorateId: created._id, role: "director" });
    }

    await logAudit(req.user, "CREATE_DIRECTORATE", "Directorate", created._id, `Created Directorate ${created.name} (${cleanCode})`, req);
    return res.status(201).json({ directorate: created });
  } catch (error) {
    return next(error);
  }
}

export async function updateDirectorate(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, description, directorId, tpoId, building, status } = req.body;

    const dir = await Directorate.findById(id);
    if (!dir) return res.status(404).json({ message: "Directorate not found." });

    if (name) dir.name = name.trim();
    if (code) dir.code = code.trim().toUpperCase();
    if (description !== undefined) dir.description = description?.trim();
    if (building !== undefined) dir.building = building?.trim();
    if (status) dir.status = status;
    if (directorId !== undefined) {
      dir.directorId = directorId || null;
      if (directorId) {
        await Admin.findByIdAndUpdate(directorId, { directorateId: dir._id, role: "director" });
      }
    }
    if (tpoId !== undefined) dir.tpoId = tpoId || null;

    await dir.save();
    await logAudit(req.user, "UPDATE_DIRECTORATE", "Directorate", dir._id, `Updated Directorate ${dir.name}`, req);
    return res.json({ message: "Directorate updated successfully.", directorate: dir });
  } catch (error) {
    return next(error);
  }
}

export async function deleteDirectorate(req, res, next) {
  try {
    const { id } = req.params;
    // Check if departments exist under this directorate
    const deptCount = await Department.countDocuments({ directorateId: id });
    if (deptCount > 0) {
      return res.status(400).json({
        message: `Cannot delete directorate: ${deptCount} departments are linked to it. Please reassign or delete them first.`
      });
    }

    const dir = await Directorate.findByIdAndDelete(id);
    if (!dir) return res.status(404).json({ message: "Directorate not found." });

    // Unset directorateId on director
    await Admin.updateMany({ directorateId: id }, { $unset: { directorateId: "" } });

    await logAudit(req.user, "DELETE_DIRECTORATE", "Directorate", id, `Deleted Directorate ${dir.name}`, req);
    return res.json({ message: "Directorate deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 3. TPO SCOPED MODULES
// =========================================================================

/**
 * GET /api/hierarchy/tpo/overview
 * Real TPO overview: Directorate oversight, placement eligibility, director assignments
 */
export async function getTpoOverview(req, res, next) {
  try {
    // 1. Ensure primary university schools (SOCSE, SOIT) exist so TPO sees them immediately
    try {
      const existingDirs = await Directorate.find({});
      const existingCodes = new Set(existingDirs.map((d) => (d.code || "").toUpperCase()));

      if (!existingCodes.has("SOCSE")) {
        await Directorate.create({
          code: "SOCSE",
          name: "School of Computer Science & Engineering",
          description: "Core Computing, Software Systems, Artificial Intelligence & Data Science",
          building: "Academic Block A - Tech Complex"
        });
      }
      if (!existingCodes.has("SOIT")) {
        await Directorate.create({
          code: "SOIT",
          name: "School of Information Technology",
          description: "Information Technology, Cloud Systems & Cyber Security",
          building: "Academic Block B - Computing Hub"
        });
      }
    } catch (seedErr) {
      console.warn("[TPO] Note on verifying default schools:", seedErr.message);
    }

    const [directorates, departments, totalStudents, unassignedDirectorates, directors, directorInvitations] = await Promise.all([
      Directorate.find().populate("directorId", "name email phone designation employeeId status").sort({ name: 1 }),
      Department.find().populate("directorateId", "name code").populate("hodId", "name email").sort({ name: 1 }),
      Student.countDocuments({ isActive: { $ne: false } }),
      Directorate.find({ directorId: { $exists: false } }),
      Admin.find({ role: "director" }).populate("directorateId", "name code building").select("-password").sort({ name: 1 }),
      Invitation.find({ role: "director" }).populate("directorateId", "name code").sort({ createdAt: -1 })
    ]);

    return res.json({
      metrics: {
        totalSchools: directorates.length,
        totalDirectorates: directorates.length,
        totalDirectors: directors.length,
        totalDepartments: departments.length,
        totalStudents,
        vacantDirectorates: unassignedDirectorates.length
      },
      directorates,
      directors,
      departments,
      directorInvitations
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 4. DIRECTOR SCOPED MODULES
// =========================================================================

/**
 * GET /api/hierarchy/director/overview
 * Director views stats strictly for their assigned Directorate
 */
export async function getDirectorOverview(req, res, next) {
  try {
    const directorId = req.user.id;
    // Find directorate assigned to this Director
    let directorate = await Directorate.findOne({ directorId }).populate("directorId", "name email");
    if (!directorate && req.user.directorateId) {
      directorate = await Directorate.findById(req.user.directorateId).populate("directorId", "name email");
    }

    if (!directorate) {
      return res.json({
        directorate: null,
        message: "No Directorate has been assigned to your Director account yet. Contact Super Admin.",
        departments: [],
        hods: [],
        metrics: { departmentsCount: 0, hodsCount: 0, teachersCount: 0, studentsCount: 0 }
      });
    }

    const departments = await Department.find({ directorateId: directorate._id })
      .populate("hodId", "name email phone employeeId status")
      .sort({ name: 1 });

    const deptIds = departments.map((d) => d._id);
    const [teachersCount, sections, hods] = await Promise.all([
      Admin.countDocuments({ departmentId: { $in: deptIds }, role: "teacher", status: "active" }),
      Section.find({ departmentId: { $in: deptIds } }),
      Admin.find({ departmentId: { $in: deptIds }, role: "hod" }).select("-password")
    ]);

    const totalStudents = sections.reduce((sum, s) => sum + (s.totalStudents || 0), 0);

    return res.json({
      directorate,
      departments,
      hods,
      metrics: {
        departmentsCount: departments.length,
        hodsCount: hods.length,
        teachersCount,
        sectionsCount: sections.length,
        studentsCount: totalStudents
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/director/hods
 * Director creates an HOD account strictly for a department within their assigned Directorate
 */
export async function createDirectorHod(req, res, next) {
  try {
    const { name, email, departmentId, employeeId, phone, designation, qualification, temporaryPassword, password, mustChangePassword } = req.body;

    if (!name || !email || !departmentId) {
      return res.status(400).json({ message: "Name, email, and department are required." });
    }

    // Verify department belongs to this director's directorate
    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ message: "Department not found." });
    }

    const directorId = req.user.id;
    const isSuperAdmin = req.user.role === "super_admin" || req.user.role === "admin";

    if (!isSuperAdmin) {
      const myDirectorate = await Directorate.findOne({ directorId });
      const myDirectorateId = myDirectorate?._id || req.user.directorateId;

      if (!myDirectorateId || String(dept.directorateId) !== String(myDirectorateId)) {
        return res.status(403).json({
          message: "Forbidden: You can only appoint HODs for departments within your assigned Directorate."
        });
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const resolvedPass = (password || temporaryPassword || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(resolvedPass, 10);
    const resolvedMustChange = mustChangePassword !== undefined ? Boolean(mustChangePassword) : false;

    const newHod = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: "hod",
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim() || "Head of Department (HOD)",
      qualification: qualification?.trim(),
      directorateId: dept.directorateId,
      departmentId: dept._id,
      reportsTo: req.user.id,
      createdBy: req.user.id,
      status: "active",
      mustChangePassword: resolvedMustChange,
      tokenVersion: 0
    });

    // Link HOD to Department
    dept.hodId = newHod._id;
    await dept.save();

    await logAudit(
      req.user,
      "CREATE_HOD",
      "Admin",
      newHod._id,
      `Appointed ${name} (${cleanEmail}) as HOD of ${dept.name} with direct password setup`,
      req
    );

    return res.status(201).json({
      message: `HOD account created successfully for ${dept.name}.`,
      hod: newHod,
      credentials: {
        email: cleanEmail,
        password: resolvedPass,
        mustChangePassword: resolvedMustChange
      },
      temporaryCredentials: {
        email: cleanEmail,
        temporaryPassword: resolvedPass,
        mustChangePassword: resolvedMustChange
      }
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 5. HOD SCOPED MODULES
// =========================================================================

/**
 * GET /api/hierarchy/hod/overview
 * HOD views stats and entities strictly for their department
 */
export async function getHodOverview(req, res, next) {
  try {
    const hodId = req.user.id;
    let dept = await Department.findOne({ hodId }).populate("directorateId", "name code");
    if (!dept && req.user.departmentId) {
      dept = await Department.findById(req.user.departmentId).populate("directorateId", "name code");
    }

    if (!dept) {
      return res.json({
        department: null,
        message: "No Department assigned to your HOD account yet. Contact Director or Super Admin.",
        teachers: [],
        sections: [],
        subjects: [],
        metrics: { teachersCount: 0, sectionsCount: 0, subjectsCount: 0, studentsCount: 0 }
      });
    }

    const [teachers, sections, subjects] = await Promise.all([
      Admin.find({ departmentId: dept._id, role: "teacher" })
        .populate("assignedSections", "name year semester")
        .select("-password")
        .sort({ name: 1 }),
      Section.find({ departmentId: dept._id })
        .populate("classTeacherId", "name email phone")
        .populate("primaryClassroomId", "roomNumber name")
        .sort({ name: 1 }),
      Subject.find({ departmentId: dept._id }).sort({ code: 1 })
    ]);

    const totalStudents = sections.reduce((sum, s) => sum + (s.totalStudents || 0), 0);

    return res.json({
      department: dept,
      teachers,
      sections,
      subjects,
      metrics: {
        teachersCount: teachers.length,
        sectionsCount: sections.length,
        subjectsCount: subjects.length,
        studentsCount: totalStudents
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/hod/teachers
 * HOD creates a Teacher account strictly in their own department
 */
export async function createHodTeacher(req, res, next) {
  try {
    const { name, email, employeeId, phone, designation, qualification, assignedSections, assignedSubjects, temporaryPassword, password, mustChangePassword } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Teacher name and official email address are required." });
    }

    const isSuperAdmin = req.user.role === "super_admin" || req.user.role === "admin";
    let departmentId = req.body.departmentId || req.user.departmentId;

    if (!isSuperAdmin) {
      const myDept = await Department.findOne({ hodId: req.user.id });
      departmentId = myDept?._id || req.user.departmentId;
      if (!departmentId) {
        return res.status(403).json({ message: "You are not assigned as HOD of any department." });
      }
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ message: "Department not found." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email address already exists." });
    }

    const resolvedPass = (password || temporaryPassword || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(resolvedPass, 10);
    const resolvedMustChange = mustChangePassword !== undefined ? Boolean(mustChangePassword) : false;

    const newTeacher = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: "teacher",
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim() || "Assistant Professor",
      qualification: qualification?.trim(),
      departmentId: dept._id,
      directorateId: dept.directorateId,
      assignedSections: assignedSections || [],
      assignedSubjects: assignedSubjects || [],
      reportsTo: req.user.id,
      createdBy: req.user.id,
      status: "active",
      mustChangePassword: resolvedMustChange,
      tokenVersion: 0
    });

    await logAudit(
      req.user,
      "CREATE_TEACHER",
      "Admin",
      newTeacher._id,
      `Appointed teacher ${name} (${cleanEmail}) to Department ${dept.name} with direct password setup`,
      req
    );

    return res.status(201).json({
      message: `Teacher ${name} created successfully.`,
      teacher: newTeacher,
      credentials: {
        email: cleanEmail,
        password: resolvedPass,
        mustChangePassword: resolvedMustChange
      },
      temporaryCredentials: {
        email: cleanEmail,
        temporaryPassword: resolvedPass,
        mustChangePassword: resolvedMustChange
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/hierarchy/hod/assign-teacher
 * HOD assigns teacher to section and subject, or designates Class Teacher
 */
export async function assignHodTeacher(req, res, next) {
  try {
    const { teacherId, sectionId, subject, isClassTeacher } = req.body;

    if (!teacherId || !sectionId) {
      return res.status(400).json({ message: "Teacher and Section are required." });
    }

    const isSuperAdmin = req.user.role === "super_admin" || req.user.role === "admin";
    const [teacher, section] = await Promise.all([
      Admin.findById(teacherId),
      Section.findById(sectionId)
    ]);

    if (!teacher) return res.status(404).json({ message: "Teacher not found." });
    if (!section) return res.status(404).json({ message: "Section not found." });

    // Validate departmental scope for HOD
    if (!isSuperAdmin) {
      const myDept = await Department.findOne({ hodId: req.user.id });
      const myDeptId = String(myDept?._id || req.user.departmentId);

      if (String(section.departmentId) !== myDeptId || String(teacher.departmentId) !== myDeptId) {
        return res.status(403).json({
          message: "Forbidden: You can only assign teachers and sections belonging to your department."
        });
      }
    }

    // Add section to teacher's assignedSections
    await Admin.findByIdAndUpdate(teacherId, {
      $addToSet: {
        assignedSections: section._id,
        ...(subject ? { assignedSubjects: subject.trim() } : {})
      }
    });

    // If designated as Class Teacher
    if (isClassTeacher) {
      section.classTeacherId = teacher._id;
      await section.save();
    }

    await logAudit(
      req.user,
      "ASSIGN_TEACHER",
      "Section",
      section._id,
      `Assigned teacher ${teacher.name} to section ${section.name}${isClassTeacher ? " as Class Teacher" : ""}${subject ? ` for ${subject}` : ""}`,
      req
    );

    return res.json({
      message: `Teacher ${teacher.name} assigned to section ${section.name} successfully.`
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 6. TEACHER SCOPED MODULES
// =========================================================================

/**
 * GET /api/hierarchy/teacher/my-schedule
 * Teacher views strictly their own assigned sections, subjects, and department
 */
export async function getTeacherSchedule(req, res, next) {
  try {
    const teacherId = req.user.id;
    const teacher = await Admin.findById(teacherId)
      .populate("departmentId", "name code buildingBlock floor contactEmail")
      .populate("directorateId", "name code building")
      .populate("assignedSections", "name year semester academicYear totalStudents capacity primaryClassroomId");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher record not found." });
    }

    // Fetch HOD of this department
    const hod = teacher.departmentId
      ? await Admin.findOne({ departmentId: teacher.departmentId._id, role: "hod" }).select("name email phone designation")
      : null;

    // Fetch class teacher responsibilities
    const classTeacherSections = await Section.find({ classTeacherId: teacherId });

    // Fetch timetable slots if any
    const timetable = await TimetableAssignment.find({ teacherId })
      .populate("sectionId", "name year semester")
      .populate("classroomId", "roomNumber building type")
      .sort({ dayOfWeek: 1, timeSlot: 1 });

    return res.json({
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        phone: teacher.phone,
        designation: teacher.designation,
        qualification: teacher.qualification,
        assignedSubjects: teacher.assignedSubjects || [],
        assignedSections: teacher.assignedSections || []
      },
      department: teacher.departmentId,
      directorate: teacher.directorateId,
      hod,
      classTeacherOf: classTeacherSections,
      timetable
    });
  } catch (error) {
    return next(error);
  }
}

// =========================================================================
// 7. GENERIC HIERARCHY TREE & MASTER ENTITY ENDPOINTS
// =========================================================================

/**
 * GET /api/hierarchy/tree
 * Dynamic tree construction using ONLY real database records.
 * Returns clean empty states when collections are empty.
 */
export async function getHierarchyTree(req, res, next) {
  try {
    const [superAdmins, tpos, directorates, departments, sections, teachers] = await Promise.all([
      Admin.find({ role: "super_admin", status: "active" }).select("name email designation employeeId"),
      Admin.find({ role: "tpo", status: "active" }).select("name email designation employeeId"),
      Directorate.find({ status: "active" }).populate("directorId", "name email designation employeeId"),
      Department.find({ status: "active" }).populate("hodId", "name email designation employeeId"),
      Section.find({ status: "active" }).populate("classTeacherId", "name email designation"),
      Admin.find({ role: "teacher", status: "active" }).select("name email designation assignedSections assignedSubjects departmentId")
    ]);

    const rootAdmin = superAdmins[0] || {
      _id: "super-admin",
      name: "Super Administrator",
      email: process.env.ADMIN_EMAIL || "admin@rungta.ac.in",
      designation: "Chief Campus Administrator"
    };

    const tree = {
      id: "root-admin",
      name: rootAdmin.name,
      role: "Super Admin",
      level: "super_admin",
      badge: "Institutional Authority",
      details: {
        email: rootAdmin.email,
        designation: rootAdmin.designation
      },
      children: tpos.map((tpo) => ({
        id: `tpo-${tpo._id}`,
        name: tpo.name,
        role: "TPO",
        level: "tpo",
        badge: "Placement & Training",
        details: {
          email: tpo.email,
          designation: tpo.designation
        },
        children: directorates.map((dir) => {
          const dirDepartments = departments.filter((dept) => String(dept.directorateId) === String(dir._id));
          return {
            id: `dir-${dir._id}`,
            name: dir.name,
            role: "School / Directorate",
            level: "director",
            badge: dir.code,
            details: {
              directorName: dir.directorId?.name || "Unassigned",
              directorEmail: dir.directorId?.email || "N/A",
              building: dir.building
            },
            children: dirDepartments.map((dept) => {
              const deptSections = sections.filter((sec) => String(sec.departmentId) === String(dept._id));
              const deptTeachers = teachers.filter((tch) => String(tch.departmentId) === String(dept._id));
              return {
                id: `dept-${dept._id}`,
                name: dept.name,
                role: "Department",
                level: "hod",
                badge: dept.code || "DEPT",
                details: {
                  hodName: dept.hodId?.name || "Unassigned",
                  hodEmail: dept.hodId?.email || "N/A"
                },
                children: deptSections.map((sec) => {
                  const secTeachers = deptTeachers.filter((t) =>
                    (t.assignedSections || []).some((sId) => String(sId) === String(sec._id))
                  );
                  return {
                    id: `sec-${sec._id}`,
                    name: `${sec.name} (Year ${sec.year})`,
                    role: "Section",
                    level: "section",
                    badge: `${sec.totalStudents} Students`,
                    details: {
                      year: sec.year,
                      semester: sec.semester,
                      classTeacher: sec.classTeacherId?.name || "Unassigned"
                    },
                    children: secTeachers.map((tch) => ({
                      id: `tch-${sec._id}-${tch._id}`,
                      name: tch.name,
                      role: "Teacher",
                      level: "teacher",
                      badge: "Faculty",
                      details: {
                        email: tch.email,
                        subjects: tch.assignedSubjects || []
                      }
                    }))
                  };
                })
              };
            })
          };
        })
      }))
    };

    return res.json({ tree });
  } catch (error) {
    return next(error);
  }
}

// 8. General Department CRUD
export async function getDepartments(req, res, next) {
  try {
    const { directorateId } = req.query;
    const filter = {};
    if (directorateId) filter.directorateId = directorateId;

    const departments = await Department.find(filter)
      .populate("directorateId", "name code")
      .populate("hodId", "name email phone designation employeeId status")
      .sort({ name: 1 });
    return res.json({ departments });
  } catch (error) {
    return next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { name, code, directorateId, hodId, buildingBlock, floor, contactEmail } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Department name is required." });
    }

    const cleanName = name.trim();
    let targetDirectorateId = directorateId || null;

    if (req.user.role === "director") {
      const directorAdmin = await Admin.findById(req.user.id);
      if (!directorAdmin?.directorateId) {
        return res.status(403).json({ message: "No Directorate is currently assigned to your Director account." });
      }
      targetDirectorateId = directorAdmin.directorateId;
    } else if (req.user.role === "super_admin" || req.user.role === "admin") {
      if (directorateId) {
        const dir = await Directorate.findById(directorateId);
        if (!dir) return res.status(404).json({ message: "Selected Directorate not found." });
        targetDirectorateId = dir._id;
      }
    } else {
      return res.status(403).json({ message: "Access denied. Only Directors and Super Admins can add departments." });
    }

    const cleanCode = code && code.trim() ? code.trim().toUpperCase() : undefined;

    // Check duplicate code
    if (cleanCode) {
      const existingCode = await Department.findOne({ code: cleanCode });
      if (existingCode) {
        return res.status(409).json({ message: `A department with code "${cleanCode}" already exists.` });
      }
    }

    // Check duplicate name within the same directorate
    if (targetDirectorateId) {
      const existingName = await Department.findOne({
        directorateId: targetDirectorateId,
        name: { $regex: new RegExp(`^${cleanName}$`, "i") }
      });
      if (existingName) {
        return res.status(409).json({ message: `A department with name "${cleanName}" already exists in this Directorate.` });
      }
    }

    const created = await Department.create({
      name: cleanName,
      code: cleanCode || `DEPT-${Date.now().toString().slice(-4)}`,
      directorateId: targetDirectorateId,
      hodId: hodId || null,
      buildingBlock: buildingBlock?.trim() || null,
      floor: floor?.trim() || null,
      contactEmail: contactEmail?.trim().toLowerCase() || null,
      createdBy: req.user.id
    });

    if (hodId) {
      await Admin.findByIdAndUpdate(hodId, { departmentId: created._id, role: "hod" });
    }

    await logAudit(
      req.user,
      "CREATE_DEPARTMENT",
      "Department",
      created._id,
      `Created Department "${created.name}" (${created.code}) under Directorate ${targetDirectorateId || "N/A"}`,
      req
    );

    return res.status(201).json({
      message: `Department "${created.name}" created successfully.`,
      department: created
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Department ID is required." });
    }

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ message: "Department not found." });
    }

    // Role and Scope Authorization
    const userRole = req.user.role;
    if (userRole === "director") {
      const directorAdmin = await Admin.findById(req.user.id);
      if (!directorAdmin?.directorateId || String(dept.directorateId) !== String(directorAdmin.directorateId)) {
        return res.status(403).json({
          message: "Unauthorized: You can only delete departments within your assigned Directorate."
        });
      }
    } else if (userRole !== "super_admin" && userRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }

    // Safety Dependency Checks:
    // 1. Check active sections
    const sectionCount = await Section.countDocuments({ departmentId: dept._id });
    if (sectionCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department: ${sectionCount} active class section(s) exist under it. Please delete or reassign them first.`
      });
    }

    // 2. Check active faculty or appointed HOD
    const staffCount = await Admin.countDocuments({
      departmentId: dept._id,
      status: "active"
    });
    if (staffCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department: ${staffCount} faculty/HOD member(s) are currently assigned to it. Please reassign them first.`
      });
    }

    // 3. Check active students registered with this department
    const studentCount = await Student.countDocuments({
      $or: [
        { branch: dept.name },
        { branch: dept.code }
      ]
    });
    if (studentCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department: ${studentCount} student(s) are registered with this department branch.`
      });
    }

    // 4. Revoke pending invitations for this department
    await Invitation.updateMany(
      { departmentId: dept._id, status: "pending" },
      { $set: { status: "revoked" } }
    );

    // 5. Clean up subjects
    await Subject.deleteMany({ departmentId: dept._id });

    // 6. Delete department
    await Department.findByIdAndDelete(dept._id);

    // 7. Audit log
    await logAudit(
      req.user,
      "DELETE_DEPARTMENT",
      "Department",
      dept._id,
      `Deleted department "${dept.name}" (${dept.code || "NO_CODE"})`,
      req
    );

    return res.json({
      message: `Department "${dept.name}" was successfully deleted.`
    });
  } catch (error) {
    return next(error);
  }
}

// 9. Sections CRUD
export async function getSections(req, res, next) {
  try {
    const { departmentId, year } = req.query;
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (year) filter.year = Number(year);

    const sections = await Section.find(filter)
      .populate("departmentId", "name code")
      .populate("classTeacherId", "name email phone employeeId")
      .sort({ name: 1 });

    return res.json({ sections });
  } catch (error) {
    return next(error);
  }
}

export async function createSection(req, res, next) {
  try {
    const { name, departmentId, year, semester, academicYear, capacity, classTeacherId } = req.body;
    if (!name || !departmentId || !year || !semester) {
      return res.status(400).json({ message: "Name, department, year, and semester are required." });
    }

    const created = await Section.create({
      name: name.trim(),
      departmentId,
      year: Number(year),
      semester: Number(semester),
      academicYear: academicYear || "2026-2027",
      capacity: capacity ? Number(capacity) : 60,
      classTeacherId: classTeacherId || null,
      createdBy: req.user.id
    });

    if (classTeacherId) {
      await Admin.findByIdAndUpdate(classTeacherId, { $addToSet: { assignedSections: created._id } });
    }

    await logAudit(req.user, "CREATE_SECTION", "Section", created._id, `Created section ${created.name}`, req);
    return res.status(201).json({ section: created });
  } catch (error) {
    return next(error);
  }
}

export async function updateSection(req, res, next) {
  try {
    const { id } = req.params;
    const { name, year, semester, capacity, totalStudents, status, classTeacherId } = req.body;
    const sec = await Section.findById(id);
    if (!sec) return res.status(404).json({ message: "Section not found." });

    if (name) sec.name = name.trim();
    if (year !== undefined) sec.year = Number(year);
    if (semester !== undefined) sec.semester = Number(semester);
    if (capacity !== undefined) sec.capacity = Number(capacity);
    if (totalStudents !== undefined) sec.totalStudents = Number(totalStudents);
    if (status) sec.status = status;
    if (classTeacherId !== undefined) {
      sec.classTeacherId = classTeacherId || null;
      if (classTeacherId) {
        await Admin.findByIdAndUpdate(classTeacherId, { $addToSet: { assignedSections: sec._id } });
      }
    }

    await sec.save();
    await logAudit(req.user, "UPDATE_SECTION", "Section", sec._id, `Updated section ${sec.name}`, req);
    return res.json({ message: "Section updated successfully.", section: sec });
  } catch (error) {
    return next(error);
  }
}

// 10. Subjects CRUD
export async function getSubjects(req, res, next) {
  try {
    const { departmentId, semester } = req.query;
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = Number(semester);

    const subjects = await Subject.find(filter)
      .populate("departmentId", "name code")
      .sort({ code: 1 });

    return res.json({ subjects });
  } catch (error) {
    return next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { name, code, departmentId, credits, type, semester } = req.body;
    if (!name || !code || !departmentId) {
      return res.status(400).json({ message: "Subject name, code, and department are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Subject.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `Subject code ${cleanCode} already exists.` });
    }

    const created = await Subject.create({
      name: name.trim(),
      code: cleanCode,
      departmentId,
      credits: credits ? Number(credits) : 4,
      type: type || "Theory",
      semester: semester ? Number(semester) : 5,
      createdBy: req.user.id
    });

    await logAudit(req.user, "CREATE_SUBJECT", "Subject", created._id, `Created subject ${created.name} (${cleanCode})`, req);
    return res.status(201).json({ subject: created });
  } catch (error) {
    return next(error);
  }
}

// 11. Audit Logs
export async function getAuditLogs(req, res, next) {
  try {
    const { action, role, search, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ logs });
  } catch (error) {
    return next(error);
  }
}

// 12. Universal User Management Endpoints (for UserManagementTable)
export async function getUsers(req, res, next) {
  try {
    const users = await Admin.find()
      .populate("directorateId", "name code")
      .populate("departmentId", "name code")
      .populate("assignedSections", "name year")
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      role = "teacher",
      employeeId,
      phone,
      designation,
      qualification,
      directorateId,
      departmentId,
      assignedSections
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: `An account with email "${cleanEmail}" already exists.` });
    }

    const resolvedPass = (password || crypto.randomBytes(4).toString("hex") + "Rungta!1").trim();
    const passwordHash = await bcrypt.hash(resolvedPass, 10);

    const newUser = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role,
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim() || undefined,
      qualification: qualification?.trim() || undefined,
      directorateId: directorateId || undefined,
      departmentId: departmentId || undefined,
      assignedSections: assignedSections || [],
      status: "active",
      mustChangePassword: false,
      createdBy: req.user.id,
      tokenVersion: 0
    });

    await logAudit(
      req.user,
      "CREATE_USER",
      "Admin",
      newUser._id,
      `Super Admin created ${role.toUpperCase()} account for ${name} (${cleanEmail})`,
      req
    );

    return res.status(201).json({
      message: `${role.toUpperCase()} user created successfully.`,
      user: newUser,
      credentials: {
        email: cleanEmail,
        password: resolvedPass
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req, res, next) {
  return updateAccount(req, res, next);
}

export async function deleteUser(req, res, next) {
  return deleteAccount(req, res, next);
}

