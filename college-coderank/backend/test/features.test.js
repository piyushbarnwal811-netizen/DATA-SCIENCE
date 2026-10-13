import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { generateLeaderboardWorkbook, generateStudentWorkbook } from "../src/utils/excelExporter.js";
import { fetchHackerRankStats } from "../src/services/hackerrankService.js";

test("generateLeaderboardWorkbook generates a valid Excel workbook with data and summary", async () => {
  const sampleStudents = [
    {
      rank: 1,
      name: "Alice Sharma",
      studentId: "CS-001",
      email: "alice@college.edu",
      branch: "Computer Science",
      section: "A",
      year: 3,
      score: 185,
      leetcodeUsername: "alice_codes",
      githubUsername: "alice-git",
      hackerrankUsername: "alice_hr",
      stats: {
        leetcode: { easy: 10, medium: 15, hard: 5, total: 30 },
        github: { publicRepos: 8, followers: 12 },
        hackerrank: { points: 150 },
        lastSyncedAt: new Date()
      }
    },
    {
      rank: 2,
      name: "Bob Kumar",
      studentId: "CS-002",
      email: "bob@college.edu",
      branch: "Computer Science",
      section: "B",
      year: 2,
      score: 120,
      leetcodeUsername: "bob_codes",
      githubUsername: "bob-git",
      hackerrankUsername: "",
      stats: {
        leetcode: { easy: 8, medium: 8, hard: 2, total: 18 },
        github: { publicRepos: 5, followers: 3 },
        hackerrank: { points: 0 },
        lastSyncedAt: new Date()
      }
    }
  ];

  const buffer = await generateLeaderboardWorkbook(sampleStudents, {
    title: "Leaderboard — Top 20 Students",
    filters: { branch: "Computer Science" }
  });

  assert.ok(buffer);
  assert.ok(buffer.byteLength > 0);

  // Read back with ExcelJS to verify structure
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const leaderboardSheet = workbook.getWorksheet("Leaderboard");
  assert.ok(leaderboardSheet, "Leaderboard sheet should exist");
  assert.equal(leaderboardSheet.rowCount, 4); // Banner (1) + Headers (2) + 2 students (3, 4)

  // Verify columns and values
  const student1Row = leaderboardSheet.getRow(3);
  assert.equal(student1Row.getCell(1).value, 1); // Rank 1
  assert.equal(student1Row.getCell(3).value, "Alice Sharma");
  assert.equal(student1Row.getCell(8).value, 185); // Score

  const summarySheet = workbook.getWorksheet("Summary Statistics");
  assert.ok(summarySheet, "Summary Statistics sheet should exist");
});

test("generateStudentWorkbook creates student dossier and recent submissions sheets", async () => {
  const sampleStudent = {
    name: "Dev Patel",
    email: "dev@college.edu",
    studentId: "IT-101",
    branch: "Information Technology",
    section: "A",
    year: 4,
    score: 210,
    leetcodeUsername: "dev_p",
    githubUsername: "dev-gh",
    hackerrankUsername: "dev_hr",
    isActive: true,
    stats: {
      leetcode: { easy: 20, medium: 25, hard: 10, total: 55 },
      github: { publicRepos: 12, followers: 20 },
      hackerrank: { points: 200 },
      recentAccepted: [
        { title: "Binary Search", titleSlug: "binary-search", difficulty: "Easy", solvedAt: new Date() },
        { title: "LRU Cache", titleSlug: "lru-cache", difficulty: "Medium", solvedAt: new Date() }
      ],
      lastSyncedAt: new Date()
    }
  };

  const buffer = await generateStudentWorkbook(sampleStudent);
  assert.ok(buffer && buffer.byteLength > 0);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const profileSheet = workbook.getWorksheet("Student Profile");
  assert.ok(profileSheet);

  const recentSheet = workbook.getWorksheet("Recent Solved Problems");
  assert.ok(recentSheet);
  assert.equal(recentSheet.rowCount, 3); // Header + 2 problems
});

test("fetchHackerRankStats safely handles null or missing username", async () => {
  const result = await fetchHackerRankStats("");
  assert.equal(result, null);
});

test("cleanGeeksforGeeksUsername sanitizes various URL formats", async () => {
  const { cleanGeeksforGeeksUsername } = await import("../src/services/geeksforgeeksService.js");
  assert.equal(cleanGeeksforGeeksUsername("https://www.geeksforgeeks.org/user/john_doe/"), "john_doe");
  assert.equal(cleanGeeksforGeeksUsername("https://geeksforgeeks.org/profile/jane_doe"), "jane_doe");
  assert.equal(cleanGeeksforGeeksUsername("@geeks_123"), "geeks_123");
  assert.equal(cleanGeeksforGeeksUsername(""), "");
});

