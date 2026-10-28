import Student from "../models/Student.js";
import { getHackerRankProfile, cleanHackerRankUsername } from "../services/hackerrankService.js";
import { cleanGitHubUsername } from "../services/githubService.js";
import { cleanLeetCodeUsername } from "../services/leetcodeService.js";
import { getCodeChefProfile, cleanCodeChefUsername } from "../services/codechefService.js";
import { getGeeksforGeeksProfile, cleanGeeksforGeeksUsername } from "../services/geeksforgeeksService.js";
import { syncStudentAllStats } from "../utils/studentSync.js";
import { generateStudentWorkbook } from "../utils/excelExporter.js";

const profileFields =
  "name email studentId branch section year leetcodeUsername githubUsername hackerrankUsername codechefUsername geeksforgeeksUsername stats score";

export async function computePlatformPositions(student) {
  if (!student) return null;
  const allStudents = await Student.find({ isActive: true })
    .select("_id branch score stats name studentId")
    .lean();

  const total = allStudents.length || 1;
  const branchStudents = allStudents.filter((s) => s.branch === student.branch);
  const branchTotal = branchStudents.length || 1;
  const isTarget = (s) => String(s._id) === String(student._id);

  // 1. Overall campus score rank
  const overallSorted = [...allStudents].sort((a, b) => (b.score || 0) - (a.score || 0));
  const overallRank = overallSorted.findIndex(isTarget) + 1;

  // 2. Branch rank
  const branchSorted = [...branchStudents].sort((a, b) => (b.score || 0) - (a.score || 0));
  const branchRank = branchSorted.findIndex(isTarget) + 1;

  // 3. LeetCode rank (total, then hard, medium, easy)
  const getLc = (s) => s.stats?.leetcode?.total ?? ((s.stats?.leetcode?.easy || 0) + (s.stats?.leetcode?.medium || 0) + (s.stats?.leetcode?.hard || 0));
  const lcSorted = [...allStudents].sort((a, b) => {
    const diff = getLc(b) - getLc(a);
    if (diff !== 0) return diff;
    return (b.stats?.leetcode?.hard || 0) - (a.stats?.leetcode?.hard || 0);
  });
  const leetcodeRank = lcSorted.findIndex(isTarget) + 1;

  // 4. CodeChef rank (rating, then problemsSolved)
  const ccSorted = [...allStudents].sort((a, b) => {
    const rDiff = (b.stats?.codechef?.rating || 0) - (a.stats?.codechef?.rating || 0);
    if (rDiff !== 0) return rDiff;
    return (b.stats?.codechef?.problemsSolved || 0) - (a.stats?.codechef?.problemsSolved || 0);
  });
  const codechefRank = ccSorted.findIndex(isTarget) + 1;

  // 5. HackerRank rank (solved, then points)
  const hrSorted = [...allStudents].sort((a, b) => {
    const sDiff = (b.stats?.hackerrank?.solved || 0) - (a.stats?.hackerrank?.solved || 0);
    if (sDiff !== 0) return sDiff;
    return (b.stats?.hackerrank?.points || 0) - (a.stats?.hackerrank?.points || 0);
  });
  const hackerrankRank = hrSorted.findIndex(isTarget) + 1;

  // 6. GeeksforGeeks rank (problemsSolved, then score)
  const gfgSorted = [...allStudents].sort((a, b) => {
    const sDiff = (b.stats?.geeksforgeeks?.problemsSolved || 0) - (a.stats?.geeksforgeeks?.problemsSolved || 0);
    if (sDiff !== 0) return sDiff;
    return (b.stats?.geeksforgeeks?.score || 0) - (a.stats?.geeksforgeeks?.score || 0);
  });
  const geeksforgeeksRank = gfgSorted.findIndex(isTarget) + 1;

  // 7. GitHub rank (publicRepos, then followers)
  const ghSorted = [...allStudents].sort((a, b) => {
    const rDiff = (b.stats?.github?.publicRepos || 0) - (a.stats?.github?.publicRepos || 0);
    if (rDiff !== 0) return rDiff;
    return (b.stats?.github?.followers || 0) - (a.stats?.github?.followers || 0);
  });
  const githubRank = ghSorted.findIndex(isTarget) + 1;

  return {
    totalStudents: total,
    branchTotal,
    overall: overallRank > 0 ? overallRank : 1,
    branch: branchRank > 0 ? branchRank : 1,
    leetcode: leetcodeRank > 0 ? leetcodeRank : 1,
    codechef: codechefRank > 0 ? codechefRank : 1,
    hackerrank: hackerrankRank > 0 ? hackerrankRank : 1,
    geeksforgeeks: geeksforgeeksRank > 0 ? geeksforgeeksRank : 1,
    github: githubRank > 0 ? githubRank : 1
  };
}

export async function getMyProfile(req, res, next) {
  try {
    const student = await Student.findById(req.user.id).select(profileFields);
    if (!student) return res.status(404).json({ message: "Student profile not found." });
    const positions = await computePlatformPositions(student);
    return res.json({
      student,
      positions,
      links: {
        hackerrank: getHackerRankProfile(student.hackerrankUsername),
        codechef: getCodeChefProfile(student.codechefUsername),
        geeksforgeeks: getGeeksforGeeksProfile(student.geeksforgeeksUsername)
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
    const positions = await computePlatformPositions(student);
    return res.json({
      student,
      positions,
      links: {
        hackerrank: getHackerRankProfile(student.hackerrankUsername),
        codechef: getCodeChefProfile(student.codechefUsername),
        geeksforgeeks: getGeeksforGeeksProfile(student.geeksforgeeksUsername)
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
    if (!student.leetcodeUsername && !student.githubUsername && !student.hackerrankUsername && !student.codechefUsername && !student.geeksforgeeksUsername) {
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
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
      if (req.body.name.trim().length > 120) {
        return res.status(400).json({ message: "Name must be 120 characters or fewer." });
      }
      changes.name = req.body.name.trim();
    }
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
    if (typeof req.body.geeksforgeeksUsername === "string") {
      changes.geeksforgeeksUsername = cleanGeeksforGeeksUsername(req.body.geeksforgeeksUsername);
    }

    const student = await Student.findByIdAndUpdate(req.user.id, { $set: changes }, {
      new: true,
      runValidators: true
    });
    if (!student) return res.status(404).json({ message: "Student profile not found." });

    // Automatically trigger fresh platform synchronization immediately upon saving handles
    let syncErrors = [];
    if (student.leetcodeUsername || student.githubUsername || student.hackerrankUsername || student.codechefUsername || student.geeksforgeeksUsername) {
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
        codechef: getCodeChefProfile(updated.codechefUsername),
        geeksforgeeks: getGeeksforGeeksProfile(updated.geeksforgeeksUsername)
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
    if (!student.leetcodeUsername && !student.githubUsername && !student.hackerrankUsername && !student.codechefUsername && !student.geeksforgeeksUsername) {
      return res.status(400).json({ message: "Add a LeetCode, CodeChef, GeeksforGeeks, GitHub, or HackerRank username before syncing." });
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