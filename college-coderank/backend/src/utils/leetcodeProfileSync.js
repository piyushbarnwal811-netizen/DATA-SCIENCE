import { fetchLeetCodeProfile } from "../services/leetcodeService.js";
import { calculateScore } from "./scoreCalculator.js";
import { broadcastStudentUpdate } from "./realtime.js";

export async function refreshLeetCodeProfile(student) {
  if (!student.leetcodeUsername) return false;
  const profile = await fetchLeetCodeProfile(student.leetcodeUsername);
  student.stats.leetcode = { ...(student.stats.leetcode?.toObject?.() ?? {}), ...profile.leetcode };
  student.stats.recentAccepted = profile.recentAccepted;
  student.stats.lastSyncedAt = new Date();
  student.score = calculateScore(student.stats);
  await student.save();
  broadcastStudentUpdate(student, { source: "leetcode" });
  return true;
}
