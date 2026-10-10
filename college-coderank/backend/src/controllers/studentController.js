import Student from "../models/Student.js";
import { getHackerRankProfile, cleanHackerRankUsername } from "../services/hackerrankService.js";
import { cleanGitHubUsername } from "../services/githubService.js";
import { cleanLeetCodeUsername } from "../services/leetcodeService.js";
import { getCodeChefProfile, cleanCodeChefUsername } from "../services/codechefService.js";
import { syncStudentAllStats } from "../utils/studentSync.js";
import { generateStudentWorkbook } from "../utils/excelExporter.js";

const profileFields =
  "name email studentId branch section year leetcodeUsername githubUsername hackerrankUsername codechefUsername stats score";

export async function getMyProfile(req, res, next) {
  try {
    const student = await Student.findById(req.user.id).select(profileFields);
    if (!student) return res.status(404).json({ message: "Student profile not found." });
    return res.json({
      student,
      links: {
        hackerrank: getHackerRankProfile(student.hackerrankUsername),
        codechef: getCodeChefProfile(student.codechefUsername)
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function getStudentDetails(req, res, next) {
  try {
    const student = await Student.findById(req.params.id).select(profileFields);
    if (!student) return res.status(404).json({ message: "Student profile not found." });
    return res.json({
      student,
      links: {
        hackerrank: getHackerRankProfile(student.hackerrankUsername),
        codechef: getCodeChefProfile(student.codechefUsername)
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function syncStudentLeetCode(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student profile not found." });
    if (!student.leetcodeUsername && !student.githubUsername && !student.hackerrankUsername && !student.codechefUsername) {
      return res.status(400).json({ message: "This student has not added any platform usernames." });
    }
    const { errors } = await syncStudentAllStats(student, { source: "admin_sync" });
    return res.json({
      student: await Student.findById(student.id).select(profileFields),
      errors
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const changes = {};
    if (typeof req.body.leetcodeUsername === "string") {
      changes.leetcodeUsername = cleanLeetCodeUsername(req.body.leetcodeUsername);
    }
    if (typeof req.body.githubUsername === "string") {
      changes.githubUsername = cleanGitHubUsername(req.body.githubUsername);
    }
    if (typeof req.body.hackerrankUsername === "string") {
      changes.hackerrankUsername = cleanHackerRankUsername(req.body.hackerrankUsername);
    }
    if (typeof req.body.codechefUsername === "string") {
      changes.codechefUsername = cleanCodeChefUsername(req.body.codechefUsername);
    }

    const student = await Student.findByIdAndUpdate(req.user.id, { $set: changes }, {
      new: true,
      runValidators: true
    });
    if (!student) return res.status(404).json({ message: "Student profile not found." });

    // Automatically trigger fresh platform synchronization immediately upon saving handles
    let syncErrors = [];
    if (student.leetcodeUsername || student.githubUsername || student.hackerrankUsername || student.codechefUsername) {
      try {
        const { errors } = await syncStudentAllStats(student, { source: "profile_save" });
        syncErrors = errors || [];
      } catch (syncErr) {
        syncErrors.push(`Sync warning: ${syncErr.message}`);
      }
    }

    const updated = await Student.findById(student._id).select(profileFields);
    return res.json({
      student: updated,
      errors: syncErrors,
      links: {
        hackerrank: getHackerRankProfile(updated.hackerrankUsername),
        codechef: getCodeChefProfile(updated.codechefUsername)
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function syncMyStats(req, res, next) {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student profile not found." });
    if (!student.leetcodeUsername && !student.githubUsername && !student.hackerrankUsername) {
      return res.status(400).json({ message: "Add a LeetCode, GitHub, or HackerRank username before syncing." });
    }

    const { errors } = await syncStudentAllStats(student, { source: "student_manual" });

    return res.json({
      student: await Student.findById(student.id).select(profileFields),
      errors
    });
  } catch (error) {
    return next(error);
  }
}

export async function exportStudentExcel(req, res, next) {
  try {
    const studentId = req.params.id === "me" ? req.user.id : req.params.id;
    // Non-admin can only export their own profile
    if (req.user.role !== "admin" && String(req.user.id) !== String(studentId)) {
      return res.status(403).json({ message: "You are not authorized to export this student profile." });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student profile not found." });

    const buffer = await generateStudentWorkbook(student);
    const safeName = student.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeName}_CodeRank_Report.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.byteLength || buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    return next(error);
  }
}