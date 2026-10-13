import Student from "../models/Student.js";
import { fetchGitHubStats } from "../services/githubService.js";
import { fetchHackerRankStats } from "../services/hackerrankService.js";
import { fetchLeetCodeProfile } from "../services/leetcodeService.js";
import { fetchCodeChefStats } from "../services/codechefService.js";
import { fetchGeeksforGeeksStats } from "../services/geeksforgeeksService.js";
import { calculateScore } from "./scoreCalculator.js";
import { broadcastStudentUpdate } from "./realtime.js";

/**
 * Synchronize stats across LeetCode, HackerRank, GitHub, CodeChef, and GeeksforGeeks for a single student.
 * Recalculates their score, persists changes, and broadcasts real-time updates.
 */
export async function syncStudentAllStats(studentOrId, options = {}) {
  const student = typeof studentOrId === "string"
    ? await Student.findById(studentOrId)
    : studentOrId;

  if (!student) throw new Error("Student not found.");

  const prevScore = student.score;
  const prevLeetCodeCount = student.stats?.leetcode?.total ?? 0;
  const prevRepos = student.stats?.github?.publicRepos ?? 0;
  const prevHkPoints = student.stats?.hackerrank?.points ?? 0;
  const prevCcSolved = student.stats?.codechef?.problemsSolved ?? 0;
  const prevCcRating = student.stats?.codechef?.rating ?? 0;
  const prevGfgSolved = student.stats?.geeksforgeeks?.problemsSolved ?? 0;
  const prevGfgScore = student.stats?.geeksforgeeks?.score ?? 0;

  const tasks = [];
  const taskKeys = [];

  // 0: LeetCode
  if (student.leetcodeUsername) {
    tasks.push(fetchLeetCodeProfile(student.leetcodeUsername));
    taskKeys.push("leetcode");
  } else {
    tasks.push(Promise.resolve(null));
    taskKeys.push("leetcode");
  }

  // 1: GitHub
  if (student.githubUsername) {
    tasks.push(fetchGitHubStats(student.githubUsername));
    taskKeys.push("github");
  } else {
    tasks.push(Promise.resolve(null));
    taskKeys.push("github");
  }

  // 2: HackerRank
  if (student.hackerrankUsername) {
    tasks.push(fetchHackerRankStats(student.hackerrankUsername));
    taskKeys.push("hackerrank");
  } else {
    tasks.push(Promise.resolve(null));
    taskKeys.push("hackerrank");
  }

  // 3: CodeChef
  if (student.codechefUsername) {
    tasks.push(fetchCodeChefStats(student.codechefUsername));
    taskKeys.push("codechef");
  } else {
    tasks.push(Promise.resolve(null));
    taskKeys.push("codechef");
  }

  // 4: GeeksforGeeks
  if (student.geeksforgeeksUsername) {
    tasks.push(fetchGeeksforGeeksStats(student.geeksforgeeksUsername));
    taskKeys.push("geeksforgeeks");
  } else {
    tasks.push(Promise.resolve(null));
    taskKeys.push("geeksforgeeks");
  }

  const results = await Promise.allSettled(tasks);
  const errors = [];

  // LeetCode
  if (results[0].status === "fulfilled" && results[0].value) {
    student.stats.leetcode = {
      ...(student.stats.leetcode?.toObject?.() ?? {}),
      ...results[0].value.leetcode
    };
    student.stats.recentAccepted = results[0].value.recentAccepted;
  } else if (results[0].status === "rejected") {
    errors.push(`LeetCode: ${results[0].reason.message}`);
  }

  // GitHub
  if (results[1].status === "fulfilled" && results[1].value) {
    student.stats.github = results[1].value;
  } else if (results[1].status === "rejected") {
    errors.push(`GitHub: ${results[1].reason.message}`);
  }

  // HackerRank
  if (results[2].status === "fulfilled" && results[2].value) {
    student.stats.hackerrank = results[2].value;
  } else if (results[2].status === "rejected") {
    errors.push(`HackerRank: ${results[2].reason.message}`);
  }

  // CodeChef
  if (results[3].status === "fulfilled" && results[3].value) {
    student.stats.codechef = results[3].value;
  } else if (results[3].status === "rejected") {
    errors.push(`CodeChef: ${results[3].reason.message}`);
  }

  // GeeksforGeeks
  if (results[4].status === "fulfilled" && results[4].value) {
    student.stats.geeksforgeeks = results[4].value;
  } else if (results[4].status === "rejected") {
    errors.push(`GeeksforGeeks: ${results[4].reason.message}`);
  }

  student.stats.lastSyncedAt = new Date();
  student.score = calculateScore(student.stats);
  await student.save();

  const hasChanged =
    student.score !== prevScore ||
    (student.stats?.leetcode?.total ?? 0) !== prevLeetCodeCount ||
    (student.stats?.github?.publicRepos ?? 0) !== prevRepos ||
    (student.stats?.hackerrank?.points ?? 0) !== prevHkPoints ||
    (student.stats?.codechef?.problemsSolved ?? 0) !== prevCcSolved ||
    (student.stats?.codechef?.rating ?? 0) !== prevCcRating ||
    (student.stats?.geeksforgeeks?.problemsSolved ?? 0) !== prevGfgSolved ||
    (student.stats?.geeksforgeeks?.score ?? 0) !== prevGfgScore;

  // Broadcast real-time update to Admin and Student dashboards
  broadcastStudentUpdate(student, { source: options.source || "manual" });

  return { student, errors, hasChanged };
}
