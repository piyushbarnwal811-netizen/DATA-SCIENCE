import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Department from "../models/Department.js";
import Student from "../models/Student.js";
import { cleanGitHubUsername } from "../services/githubService.js";
import { cleanLeetCodeUsername } from "../services/leetcodeService.js";
import { cleanHackerRankUsername } from "../services/hackerrankService.js";
import { cleanCodeChefUsername } from "../services/codechefService.js";
import { syncStudentAllStats } from "../utils/studentSync.js";

function createToken(user, role) {
  return jwt.sign({ sub: user.id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user, role) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role,
    ...(role === "student"
      ? {
          studentId: user.studentId,
          branch: user.branch,
          section: user.section,
          year: user.year,
          githubUsername: user.githubUsername,
          leetcodeUsername: user.leetcodeUsername,
          hackerrankUsername: user.hackerrankUsername,
          codechefUsername: user.codechefUsername
        }
      : {})
  };
}

export async function registerStudent(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      studentId,
      branch,
      section,
      year,
      githubUsername,
      leetcodeUsername,
      hackerrankUsername,
      codechefUsername
    } = req.body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedBranch = String(branch ?? "").trim();
    const normalizedSection = String(section ?? "").trim();
    const numericYear = Number(year);
    if (!String(name ?? "").trim() || !normalizedEmail || !password || !normalizedBranch || !normalizedSection || !year) {
      return res.status(400).json({ message: "Complete all required fields to create an account." });
    }
    if (!Number.isInteger(numericYear) || numericYear < 1 || numericYear > 8) {
      return res.status(400).json({ message: "Choose a valid year between 1 and 8." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Choose a password with at least 8 characters." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await Student.findOne({ email: normalizedEmail }).select("+password");

    const cleanGh = cleanGitHubUsername(githubUsername);
    const cleanLc = cleanLeetCodeUsername(leetcodeUsername);
    const cleanHr = cleanHackerRankUsername(hackerrankUsername);
    const cleanCc = cleanCodeChefUsername(codechefUsername);

    let student;

    if (existing) {
      if (existing.password) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      Object.assign(existing, {
        name: String(name).trim(),
        password: passwordHash,
        studentId: studentId || existing.studentId,
        branch: normalizedBranch,
        section: normalizedSection,
        year: numericYear,
        ...(cleanGh ? { githubUsername: cleanGh } : {}),
        ...(cleanLc ? { leetcodeUsername: cleanLc } : {}),
        ...(cleanHr ? { hackerrankUsername: cleanHr } : {}),
        ...(cleanCc ? { codechefUsername: cleanCc } : {})
      });
      student = await existing.save();
    } else {
      student = await Student.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: passwordHash,
        studentId: studentId || undefined,
        branch: normalizedBranch,
        section: normalizedSection,
        year: numericYear,
        githubUsername: cleanGh,
        leetcodeUsername: cleanLc,
        hackerrankUsername: cleanHr,
        codechefUsername: cleanCc
      });
    }
    await Department.updateOne(
      { name: normalizedBranch },
      { $setOnInsert: { name: normalizedBranch }, $addToSet: { sections: normalizedSection } },
      { upsert: true }
    );

    // Auto-sync platform stats immediately in the background so repos appear right away
    if (student.githubUsername || student.leetcodeUsername || student.hackerrankUsername || student.codechefUsername) {
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
    const { email, password, role = "student" } = req.body;
    if (!email || !password || !["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Enter a valid email, password, and account type." });
    }
    const Model = role === "admin" ? Admin : Student;
    const user = await Model.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }
    return res.json({ token: createToken(user, role), user: publicUser(user, role) });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const Model = req.user.role === "admin" ? Admin : Student;
    const user = await Model.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Account not found." });
    return res.json({ user: publicUser(user, req.user.role) });
  } catch (error) {
    return next(error);
  }
}