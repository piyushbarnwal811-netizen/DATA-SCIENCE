import assert from "node:assert/strict";
import test, { mock } from "node:test";
import ExcelJS from "exceljs";
import { parseStudentWorkbook } from "../src/utils/excelParser.js";
import { fetchLeetCodeProfile } from "../src/services/leetcodeService.js";
import { calculateScore } from "../src/utils/scoreCalculator.js";

async function createWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Students");
  rows.forEach((row) => worksheet.addRow(row));
  return workbook.xlsx.writeBuffer();
}

test("score calculation applies the documented platform weights", () => {
  assert.equal(calculateScore({
    leetcode: { easy: 2, medium: 3, hard: 1 },
    github: { publicRepos: 4 },
    hackerrank: { points: 59 }
  }), 29);
});

test("score calculation handles missing platform stats", () => {
  assert.equal(calculateScore(), 0);
});

test("Excel roster import normalizes headers and emails", async () => {
  const buffer = await createWorkbook([
    ["Full Name", "Email Address", "Roll No", "Department", "Section", "Year"],
    ["Example Student", "STUDENT@COLLEGE.EDU", "COL-001", "Computer Science", "A", 2]
  ]);

  const students = await parseStudentWorkbook(buffer, "students.xlsx");
  assert.deepEqual(students, [{
    name: "Example Student",
    email: "student@college.edu",
    studentId: "COL-001",
    branch: "Computer Science",
    section: "A",
    year: 2,
    leetcodeUsername: "",
    githubUsername: "",
    hackerrankUsername: ""
  }]);
});

test("CSV roster import reports duplicate email addresses", async () => {
  const csv = Buffer.from(
    "name,email,branch,section,year\nFirst,student@college.edu,CS,A,1\nSecond,student@college.edu,CS,B,2\n"
  );

  await assert.rejects(
    parseStudentWorkbook(csv, "students.csv"),
    /duplicate email "student@college\.edu"/
  );
});

test("roster import reports duplicate student IDs", async () => {
  const buffer = await createWorkbook([
    ["name", "email", "studentId", "branch", "section", "year"],
    ["First Student", "first@college.edu", "COL-001", "CS", "A", 1],
    ["Second Student", "second@college.edu", "COL-001", "CS", "B", 2]
  ]);

  await assert.rejects(
    parseStudentWorkbook(buffer, "students.xlsx"),
    /duplicate student ID "COL-001"/
  );
});

test("roster import rejects invalid year values with a row number", async () => {
  const buffer = await createWorkbook([
    ["name", "email", "branch", "section", "year"],
    ["Example Student", "student@college.edu", "CS", "A", 0]
  ]);

  await assert.rejects(parseStudentWorkbook(buffer, "students.xlsx"), /Row 2/);
});

test("LeetCode profile includes difficulty and only one row per recently solved question", async (context) => {
  const requests = [];
  context.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    const data = requests.length === 1
      ? {
          data: {
            matchedUser: {
              submitStats: {
                acSubmissionNum: [
                  { difficulty: "Easy", count: 12 },
                  { difficulty: "Medium", count: 4 },
                  { difficulty: "Hard", count: 2 },
                  { difficulty: "All", count: 18 }
                ]
              }
            },
            recentAcSubmissionList: [
              { title: "Two Sum", titleSlug: "two-sum", timestamp: "1700000000" },
              { title: "Two Sum", titleSlug: "two-sum", timestamp: "1700000100" },
              { title: "Add Two Numbers", titleSlug: "add-two-numbers", timestamp: "1700000200" }
            ]
          }
        }
      : {
          data: {
            problem0: { difficulty: "Easy" },
            problem1: { difficulty: "Medium" }
          }
        };
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  const profile = await fetchLeetCodeProfile("coder");
  assert.deepEqual(profile.leetcode, { easy: 12, medium: 4, hard: 2, total: 18 });
  assert.deepEqual(
    profile.recentAccepted.map(({ title, difficulty }) => ({ title, difficulty })),
    [
      { title: "Two Sum", difficulty: "Easy" },
      { title: "Add Two Numbers", difficulty: "Medium" }
    ]
  );
  assert.equal(requests.length, 2);
});
