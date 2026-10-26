import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Admin from "../src/models/Admin.js";
import Student from "../src/models/Student.js";
import Directorate from "../src/models/Directorate.js";
import Department from "../src/models/Department.js";
import Section from "../src/models/Section.js";
import Subject from "../src/models/Subject.js";
import Classroom from "../src/models/Classroom.js";
import TimetableAssignment from "../src/models/TimetableAssignment.js";
import AuditLog from "../src/models/AuditLog.js";

async function backupAndClean() {
  console.log("[Backup & Clean] Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Create backup directory
  const backupDir = path.resolve("./backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 2. Fetch all collections for complete safety backup
  console.log("[Backup & Clean] Creating complete snapshot backup...");
  const [
    allAdmins,
    allStudents,
    allDirectorates,
    allDepartments,
    allSections,
    allSubjects,
    allClassrooms,
    allAssignments,
    allAuditLogs
  ] = await Promise.all([
    Admin.find().lean(),
    Student.find().lean(),
    Directorate.find().lean(),
    Department.find().lean(),
    Section.find().lean(),
    Subject.find().lean(),
    Classroom.find().lean(),
    TimetableAssignment.find().lean(),
    AuditLog.find().lean()
  ]);

  const backupData = {
    timestamp: new Date().toISOString(),
    counts: {
      admins: allAdmins.length,
      students: allStudents.length,
      directorates: allDirectorates.length,
      departments: allDepartments.length,
      sections: allSections.length,
      subjects: allSubjects.length,
      classrooms: allClassrooms.length,
      assignments: allAssignments.length,
      auditLogs: allAuditLogs.length
    },
    data: {
      admins: allAdmins,
      students: allStudents,
      directorates: allDirectorates,
      departments: allDepartments,
      sections: allSections,
      subjects: allSubjects,
      classrooms: allClassrooms,
      assignments: allAssignments,
      auditLogs: allAuditLogs
    }
  };

  const backupFilePath = path.join(backupDir, `db_backup_pre_cleanup_${Date.now()}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf-8");
  console.log(`[Backup & Clean] Backup saved safely to: ${backupFilePath}`);

  // 3. Identify genuine records vs test data
  const superAdminEmail = (process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com").trim().toLowerCase();

  // A. Admin accounts: Keep ONLY genuine Super Admin (superAdminEmail)
  const genuineAdmins = allAdmins.filter(
    (a) => a.email.toLowerCase() === superAdminEmail
  );
  console.log(`[Backup & Clean] Genuine Admin preserved:`, genuineAdmins.map((a) => `${a.name} (${a.email})`));

  // Delete all dummy/fake staff accounts (@rungta.ac.in seeder accounts)
  const deletedAdminsResult = await Admin.deleteMany({
    email: { $ne: superAdminEmail }
  });
  console.log(`[Backup & Clean] Deleted ${deletedAdminsResult.deletedCount} dummy admin/staff accounts.`);

  // Ensure the genuine Super Admin has role: "super_admin", status: "active"
  await Admin.updateOne(
    { email: superAdminEmail },
    {
      $set: {
        role: "super_admin",
        status: "active",
        designation: "Chief Campus Administrator & Chancellor Secretariat",
        mustChangePassword: false
      }
    }
  );

  // B. Students:
  // Genuine students have official university emails like @rungta.org or Piyush's email, and real RU roll numbers.
  // Dummy students created from SAMPLE_STUDENTS have studentId like "STU1057", "STU1192", etc.
  const dummyStudentFilter = {
    $or: [
      { studentId: { $regex: /^STU\d+$/i } },
      { email: { $regex: /@rungta\.ac\.in$/i } }
    ],
    email: { $ne: superAdminEmail }
  };

  const dummyStudents = await Student.find(dummyStudentFilter).select("name email studentId");
  console.log(`[Backup & Clean] Identified ${dummyStudents.length} dummy students:`, dummyStudents.map((s) => `${s.name} (${s.studentId})`));

  const deletedStudentsResult = await Student.deleteMany(dummyStudentFilter);
  console.log(`[Backup & Clean] Deleted ${deletedStudentsResult.deletedCount} dummy student records.`);

  // C. Clear dummy hierarchy records created by hierarchySeeder
  const [
    delDirectorates,
    delDepartments,
    delSections,
    delSubjects,
    delClassrooms,
    delAssignments,
    delAuditLogs
  ] = await Promise.all([
    Directorate.deleteMany({}),
    Department.deleteMany({}),
    Section.deleteMany({}),
    Subject.deleteMany({}),
    Classroom.deleteMany({}),
    TimetableAssignment.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log("[Backup & Clean] Cleared dummy hierarchy records:", {
    directorates: delDirectorates.deletedCount,
    departments: delDepartments.deletedCount,
    sections: delSections.deletedCount,
    subjects: delSubjects.deletedCount,
    classrooms: delClassrooms.deletedCount,
    assignments: delAssignments.deletedCount,
    auditLogs: delAuditLogs.deletedCount
  });

  // Log clean initial audit record
  const currentSuperAdmin = await Admin.findOne({ email: superAdminEmail });
  if (currentSuperAdmin) {
    await AuditLog.create({
      userId: currentSuperAdmin._id,
      userName: currentSuperAdmin.name,
      userEmail: currentSuperAdmin.email,
      role: "super_admin",
      action: "SYSTEM_INITIALIZED",
      entityType: "System",
      entityId: "SYSTEM",
      details: "Database purged of mock/test data. Live role-based college hierarchy management active.",
      ipAddress: "127.0.0.1"
    });
  }

  // Summary
  console.log("\n[Backup & Clean] Current Clean Database State:");
  console.log({
    admins: await Admin.countDocuments(),
    students: await Student.countDocuments(),
    directorates: await Directorate.countDocuments(),
    departments: await Department.countDocuments(),
    sections: await Section.countDocuments(),
    subjects: await Subject.countDocuments(),
    classrooms: await Classroom.countDocuments(),
    assignments: await TimetableAssignment.countDocuments(),
    auditLogs: await AuditLog.countDocuments()
  });

  await mongoose.disconnect();
  console.log("[Backup & Clean] Complete!");
}

backupAndClean().catch((err) => {
  console.error("[Backup & Clean] Fatal Error:", err);
  process.exit(1);
});
