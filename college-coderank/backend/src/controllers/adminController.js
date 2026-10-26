import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Department from "../models/Department.js";
import Student from "../models/Student.js";
import { parseStudentWorkbook } from "../utils/excelParser.js";
import { broadcastRealtimeEvent } from "../utils/realtime.js";
import { cleanGitHubUsername } from "../services/githubService.js";
import { cleanLeetCodeUsername } from "../services/leetcodeService.js";
import { cleanHackerRankUsername } from "../services/hackerrankService.js";
import { cleanCodeChefUsername } from "../services/codechefService.js";
import { cleanGeeksforGeeksUsername } from "../services/geeksforgeeksService.js";
import { syncStudentAllStats } from "../utils/studentSync.js";

export async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "College Admin" } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("Admin account not seeded: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.");
    return;
  }
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await Admin.findOne({ email });
  if (existing) {
    if (existing.role !== "super_admin" || existing.status !== "active") {
      existing.role = "super_admin";
      existing.status = "active";
      await existing.save();
    }
    return;
  }
  const password = await bcrypt.hash(ADMIN_PASSWORD.trim(), 12);
  await Admin.create({
    name: ADMIN_NAME.trim(),
    email,
    password,
    role: "super_admin",
    status: "active",
    designation: "Chief Campus Administrator"
  });
  console.log(`Initial Super Admin account verified for ${email}.`);
}

export async function getAdminOverview(req, res, next) {
  try {
    const [students, departments, recent] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Department.countDocuments(),
      Student.find().sort({ createdAt: -1 }).limit(5).select("name email branch section year createdAt")
    ]);
    return res.json({ students, departments, recent });
  } catch (error) {
    return next(error);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    broadcastRealtimeEvent("leaderboard:refresh", {
      reason: "student_deleted",
      studentId: student._id.toString(),
      timestamp: new Date().toISOString()
    });

    return res.json({ message: "Student and all saved coding history deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

export async function createStudent(req, res, next) {
  try {
    const {
      name,
      fullName,
      email,
      studentId,
      rollNumber,
      rollNo,
      branch,
      department,
      section,
      year,
      password,
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
      gfgUsername
    } = req.body;

    const resolvedName = String(name || fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedBranch = String(branch || department || "").trim();
    const normalizedSection = String(section || "").trim();
    const numericYear = Number(year);
    const rawStudentId = studentId || rollNumber || rollNo;
    const resolvedStudentId = rawStudentId && String(rawStudentId).trim() ? String(rawStudentId).trim() : undefined;

    if (!resolvedName || !normalizedEmail || !normalizedBranch || !normalizedSection || !year) {
      return res.status(400).json({ message: "Name, email, branch, section, and year are required." });
    }

    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 8) {
      return res.status(400).json({ message: "Choose a valid year between 1 and 8." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const existing = await Student.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: `A student with email "${normalizedEmail}" already exists.` });
    }

    if (resolvedStudentId) {
      const existingId = await Student.findOne({ studentId: resolvedStudentId });
      if (existingId) {
        return res.status(409).json({ message: `A student with Student ID/Roll No "${resolvedStudentId}" already exists.` });
      }
    }

    const cleanGh = cleanGitHubUsername(githubUsername || github || githubHandle);
    const cleanLc = cleanLeetCodeUsername(leetcodeUsername || leetcode || leetcodeHandle);
    const cleanHr = cleanHackerRankUsername(hackerrankUsername || hackerrank || hackerrankHandle);
    const cleanCc = cleanCodeChefUsername(codechefUsername || codechef || codechefHandle);
    const cleanGfg = cleanGeeksforGeeksUsername(geeksforgeeksUsername || geeksforgeeks || geeksforgeeksHandle || gfg || gfgUsername);

    let passwordHash = undefined;
    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters if provided." });
      }
      passwordHash = await bcrypt.hash(String(password).trim(), 12);
    }

    const student = await Student.create({
      name: resolvedName,
      email: normalizedEmail,
      studentId: resolvedStudentId,
      ...(passwordHash ? { password: passwordHash, mustChangePassword: true } : {}),
      branch: normalizedBranch,
      section: normalizedSection,
      year: numericYear,
      githubUsername: cleanGh || "",
      leetcodeUsername: cleanLc || "",
      hackerrankUsername: cleanHr || "",
      codechefUsername: cleanCc || "",
      geeksforgeeksUsername: cleanGfg || "",
      stats: {},
      score: 0,
      isActive: true
    });

    await Department.updateOne(
      { name: normalizedBranch },
      { $setOnInsert: { name: normalizedBranch }, $addToSet: { sections: normalizedSection } },
      { upsert: true }
    );

    broadcastRealtimeEvent("leaderboard:refresh", {
      reason: "student_created",
      studentId: student._id.toString(),
      name: student.name,
      timestamp: new Date().toISOString()
    });

    if (cleanGh || cleanLc || cleanHr || cleanCc || cleanGfg) {
      syncStudentAllStats(student._id, { source: "admin_manual_create" }).catch((syncErr) => {
        console.warn(`[Admin Manual Create] Sync for ${student.email} warning:`, syncErr.message);
      });
    }

    return res.status(201).json({
      message: `Student "${student.name}" added successfully to the campus roster!`,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        branch: student.branch,
        section: student.section,
        year: student.year
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function importStudents(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose a student sheet to upload." });
    let students;
    try {
      students = await parseStudentWorkbook(req.file.buffer, req.file.originalname);
    } catch (error) {
      error.statusCode = 400;
      return next(error);
    }
    const operations = students.map((student) => {
      const { email, ...profile } = student;
      if (!profile.studentId) delete profile.studentId;
      for (const field of ["leetcodeUsername", "githubUsername", "hackerrankUsername", "codechefUsername", "geeksforgeeksUsername"]) {
        if (!profile[field]) delete profile[field];
      }
      return {
        updateOne: {
          filter: { email },
          update: {
            $set: profile,
            $setOnInsert: {
              email,
              stats: {},
              score: 0,
              isActive: true
            }
          },
          upsert: true
        }
      };
    });
    const result = await Student.bulkWrite(operations, { ordered: false });

    const sectionsByBranch = new Map();
    for (const student of students) {
      const sections = sectionsByBranch.get(student.branch) ?? new Set();
      sections.add(student.section);
      sectionsByBranch.set(student.branch, sections);
    }
    await Promise.all(
      [...sectionsByBranch].map(([name, sections]) =>
        Department.updateOne(
          { name },
          { $addToSet: { sections: { $each: [...sections] } } },
          { upsert: true }
        )
      )
    );
    return res.json({
      message: "Student sheet imported successfully.",
      imported: students.length,
      created: result.upsertedCount,
      updated: result.modifiedCount,
      totalRows: students.length
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDepartments(req, res, next) {
  try {
    return res.json({ departments: await Department.find().sort({ name: 1 }) });
  } catch (error) {
    return next(error);
  }
}

export async function addDepartmentSection(req, res, next) {
  try {
    const name = String(req.body.branch ?? "").trim();
    const section = String(req.body.section ?? "").trim();
    if (!name || !section) {
      return res.status(400).json({ message: "Enter both a branch and a section." });
    }
    const department = await Department.findOneAndUpdate(
      { name },
      { $setOnInsert: { name }, $addToSet: { sections: section } },
      { new: true, upsert: true, runValidators: true }
    );
    return res.status(201).json({ department });
  } catch (error) {
    return next(error);
  }
}

export async function removeDepartmentSection(req, res, next) {
  try {
    const name = String(req.params.branch ?? "").trim();
    const section = String(req.params.section ?? "").trim();
    const department = await Department.findOneAndUpdate(
      { name },
      { $pull: { sections: section } },
      { new: true }
    );
    if (!department) return res.status(404).json({ message: "Branch not found." });
    return res.json({ department });
  } catch (error) {
    return next(error);
  }
}

export async function exportAllStudents(req, res, next) {
  try {
    const students = await Student.find({ isActive: true })
      .select("name email studentId branch section year stats score githubUsername leetcodeUsername hackerrankUsername codechefUsername geeksforgeeksUsername")
      .sort({ score: -1, name: 1 })
      .lean();

    const ranked = students.map((student, index) => ({ ...student, rank: index + 1 }));
    const { generateLeaderboardWorkbook } = await import("../utils/excelExporter.js");
    const buffer = await generateLeaderboardWorkbook(ranked, {
      title: "College CodeRank — Comprehensive Student Roster & Coding Performance"
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CodeRank_Full_Roster_${timestamp}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.byteLength || buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    return next(error);
  }
}

export async function syncAllStudents(req, res, next) {
  try {
    const students = await Student.find({
      isActive: true,
      $or: [
        { leetcodeUsername: { $nin: ["", null] } },
        { githubUsername: { $nin: ["", null] } },
        { hackerrankUsername: { $nin: ["", null] } },
        { codechefUsername: { $nin: ["", null] } },
        { geeksforgeeksUsername: { $nin: ["", null] } }
      ]
    });

    const { syncStudentAllStats } = await import("../utils/studentSync.js");
    let updated = 0;
    for (const student of students) {
      try {
        const { hasChanged } = await syncStudentAllStats(student, { source: "admin_bulk" });
        if (hasChanged) updated++;
      } catch (err) {
        console.warn(`Sync error for ${student.email}:`, err.message);
      }
    }

    return res.json({
      message: `Checked and synced ${students.length} students.`,
      total: students.length,
      updated
    });
  } catch (error) {
    return next(error);
  }
}