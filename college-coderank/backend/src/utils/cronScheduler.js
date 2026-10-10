import cron from "node-cron";
import Student from "../models/Student.js";
import { syncStudentAllStats } from "./studentSync.js";

export function startStatsScheduler() {
  const syncSchedule = process.env.AUTO_SYNC_CRON || process.env.LEETCODE_SYNC_CRON || "*/2 * * * *";
  if (!cron.validate(syncSchedule)) {
    throw new Error(`Invalid sync schedule cron expression: ${syncSchedule}`);
  }

  let syncRunning = false;

  async function executeSyncCycle() {
    if (syncRunning) return;
    syncRunning = true;
    try {
      const students = await Student.find({
        isActive: true,
        $or: [
          { leetcodeUsername: { $nin: ["", null] } },
          { githubUsername: { $nin: ["", null] } },
          { hackerrankUsername: { $nin: ["", null] } },
          { codechefUsername: { $nin: ["", null] } }
        ]
      });

      let updatedCount = 0;
      for (const student of students) {
        try {
          const { hasChanged } = await syncStudentAllStats(student, { source: "scheduler" });
          if (hasChanged) updatedCount++;
        } catch (error) {
          console.error(`[Auto-Sync] Error for student ${student.email}: ${error.message}`);
        }
        // Small 150ms gentle pause between student fetches
        await new Promise((res) => setTimeout(res, 150));
      }

      console.log(`[Auto-Sync] Completed cycle: ${students.length} students checked, ${updatedCount} updated.`);
    } catch (error) {
      console.error(`[Auto-Sync] Scheduled sync cycle failed: ${error.message}`);
    } finally {
      syncRunning = false;
    }
  }

  // 1. Run cron on scheduled interval
  cron.schedule(syncSchedule, executeSyncCycle);
  console.log(`[Auto-Sync] Background platform synchronization scheduled: ${syncSchedule}`);

  // 2. Also run an initial sync 4 seconds after boot so newly added students are updated immediately
  setTimeout(() => {
    executeSyncCycle().catch((err) => console.error("[Auto-Sync] Startup sync error:", err.message));
  }, 4000);
}