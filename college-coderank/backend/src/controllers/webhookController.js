import Student from "../models/Student.js";
import { syncStudentAllStats } from "../utils/studentSync.js";

/**
 * Handle incoming GitHub Webhooks (e.g. push event, commit).
 * Instantly synchronizes the student's GitHub stats and broadcasts real-time updates.
 */
export async function handleGitHubWebhook(req, res, next) {
  try {
    const payload = req.body || {};

    // Extract potential GitHub username from various fields in GitHub webhook payload
    const candidateUsernames = [
      payload?.sender?.login,
      payload?.pusher?.name,
      payload?.head_commit?.author?.username,
      payload?.head_commit?.committer?.username,
      payload?.repository?.owner?.login
    ].filter(Boolean);

    if (!candidateUsernames.length) {
      return res.status(200).json({ received: true, message: "No GitHub username identified in webhook payload." });
    }

    // Match student in database by any matched GitHub username (case-insensitive)
    const regexes = candidateUsernames.map(
      (username) => new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    );

    const student = await Student.findOne({
      isActive: true,
      githubUsername: { $in: regexes }
    });

    if (!student) {
      return res.status(200).json({
        received: true,
        message: `No active student found matching GitHub handles: ${candidateUsernames.join(", ")}`
      });
    }

    const { errors, hasChanged } = await syncStudentAllStats(student, { source: "github_webhook" });

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${student.name}'s profile via GitHub webhook.`,
      student: {
        id: student._id,
        name: student.name,
        score: student.score,
        repos: student.stats?.github?.publicRepos
      },
      hasChanged,
      errors
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Dedicated instant sync ping endpoint for student platforms.
 * Can be called by students, browser extensions, GitHub actions, or LeetCode proxies.
 */
export async function handleInstantPlatformPing(req, res, next) {
  try {
    const { platform, username, email, studentId } = { ...req.query, ...req.body };

    const query = { isActive: true };
    if (studentId) query.studentId = String(studentId).trim();
    else if (email) query.email = String(email).trim().toLowerCase();
    else if (username) {
      const clean = String(username).trim();
      const escaped = new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      if (platform === "leetcode") query.leetcodeUsername = escaped;
      else if (platform === "github") query.githubUsername = escaped;
      else if (platform === "hackerrank") query.hackerrankUsername = escaped;
      else {
        query.$or = [
          { leetcodeUsername: escaped },
          { githubUsername: escaped },
          { hackerrankUsername: escaped }
        ];
      }
    } else {
      return res.status(400).json({
        message: "Provide username, email, or studentId to trigger instant sync."
      });
    }

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ message: "No matching student found." });
    }

    const { errors, hasChanged } = await syncStudentAllStats(student, { source: "instant_ping" });

    return res.json({
      success: true,
      message: `Profile updated in real-time for ${student.name}.`,
      student: {
        id: student._id,
        name: student.name,
        score: student.score,
        stats: student.stats
      },
      hasChanged,
      errors
    });
  } catch (error) {
    return next(error);
  }
}
