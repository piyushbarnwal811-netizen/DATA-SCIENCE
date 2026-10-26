import "dotenv/config";
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

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  const saEmail = (process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com").trim().toLowerCase();

  await Admin.deleteMany({ email: { $ne: saEmail } });
  await Directorate.deleteMany({});
  await Department.deleteMany({});
  await Section.deleteMany({});
  await Subject.deleteMany({});
  await Classroom.deleteMany({});
  await TimetableAssignment.deleteMany({});
  await AuditLog.deleteMany({});

  const superAdmin = await Admin.findOne({ email: saEmail });
  if (superAdmin) {
    await AuditLog.create({
      userId: superAdmin._id,
      userName: superAdmin.name,
      userEmail: superAdmin.email,
      role: "super_admin",
      action: "SYSTEM_INITIALIZED",
      entityType: "System",
      entityId: "SYSTEM",
      details: "Institutional database initialized with clean empty state. Ready for genuine role-based onboarding.",
      ipAddress: "127.0.0.1"
    });
  }

  console.log("Database reset to clean genuine state:");
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
}

reset().catch(console.error);
