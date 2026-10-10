import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";

const normalizeKey = (key) =>
  String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

const aliases = {
  name: ["name", "studentname", "fullname"],
  email: ["email", "emailaddress"],
  studentId: ["studentid", "rollnumber", "rollno", "registrationnumber"],
  branch: ["branch", "department", "program"],
  section: ["section", "classsection"],
  year: ["year", "academicyear", "studyyear"],
  leetcodeUsername: ["leetcodeusername", "leetcode"],
  githubUsername: ["githubusername", "github"],
  hackerrankUsername: ["hackerrankusername", "hackerrank"],
  codechefUsername: ["codechefusername", "codechef"]
};

function readCell(row, keys) {
  for (const [key, value] of Object.entries(row)) {
    if (keys.includes(normalizeKey(key))) return value;
  }
  return "";
}

export async function parseStudentWorkbook(buffer, fileName = "") {
  let rows;
  if (fileName.toLowerCase().endsWith(".csv")) {
    rows = parseCsv(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const firstSheet = workbook.worksheets[0];
    if (!firstSheet) throw new Error("The workbook does not contain a worksheet.");
    const headers = firstSheet.getRow(1).values.slice(1).map((value) => String(value ?? "").trim());
    rows = [];
    firstSheet.eachRow((row, rowNumber) => {
      if (rowNumber < 2) return;
      const record = {};
      headers.forEach((header, index) => {
        if (header) record[header] = row.getCell(index + 1).text;
      });
      if (Object.values(record).some((value) => String(value).trim())) rows.push(record);
    });
  }
  if (!rows.length) throw new Error("The worksheet has no student rows.");

  const students = rows.map((row, index) => {
    const student = Object.fromEntries(
      Object.entries(aliases).map(([field, fieldAliases]) => [
        field,
        readCell(row, fieldAliases)
      ])
    );
    student.name = String(student.name).trim();
    student.email = String(student.email).trim().toLowerCase();
    student.studentId = String(student.studentId).trim();
    student.branch = String(student.branch).trim();
    student.section = String(student.section).trim();
    student.year = Number(student.year);
    for (const field of ["leetcodeUsername", "githubUsername", "hackerrankUsername", "codechefUsername"]) {
      student[field] = String(student[field] ?? "").trim();
    }

    const missing = ["name", "email", "branch", "section"].filter((field) => !student[field]);
    if (missing.length || !Number.isInteger(student.year) || student.year < 1 || student.year > 8) {
      throw new Error(
        `Row ${index + 2}: provide name, email, branch, section, and a year from 1 to 8.`
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      throw new Error(`Row ${index + 2}: "${student.email}" is not a valid email address.`);
    }
    return student;
  });

  const emails = new Set();
  const studentIds = new Set();
  for (const [index, student] of students.entries()) {
    if (emails.has(student.email)) {
      throw new Error(`Row ${index + 2}: duplicate email "${student.email}".`);
    }
    emails.add(student.email);
    if (student.studentId) {
      if (studentIds.has(student.studentId)) {
        throw new Error(`Row ${index + 2}: duplicate student ID "${student.studentId}".`);
      }
      studentIds.add(student.studentId);
    }
  }
  return students;
}