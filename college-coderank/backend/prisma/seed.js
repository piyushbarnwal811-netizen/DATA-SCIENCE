import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PostgreSQL database seed...");

  const adminName = process.env.ADMIN_NAME || "College Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com").toLowerCase().trim();
  const rawAdminPassword = process.env.ADMIN_PASSWORD || "rungta@123";
  const hashedPassword = await bcrypt.hash(rawAdminPassword, 10);

  // 1. Super Admin Account
  const superAdmin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      mustChangePassword: false,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      designation: "Chief Administrator / Chancellor Secretariat",
      mustChangePassword: false,
    },
  });
  console.log(`✅ Super Admin configured: ${superAdmin.email}`);

  // 2. Default Directorate
  const directorate = await prisma.directorate.upsert({
    where: { code: "FET" },
    update: {},
    create: {
      name: "Faculty of Engineering & Technology",
      code: "FET",
      description: "Engineering and Technical Computing disciplines",
      building: "Main Academic Complex - Block A",
    },
  });
  console.log(`✅ Directorate configured: ${directorate.name} (${directorate.code})`);

  // 3. Default Department: CSE
  const cseDept = await prisma.department.upsert({
    where: { code: "CSE" },
    update: { directorateId: directorate.id },
    create: {
      name: "Computer Science & Engineering",
      code: "CSE",
      directorateId: directorate.id,
    },
  });

  // Default Department: AI-DS
  const aidsDept = await prisma.department.upsert({
    where: { code: "AI-DS" },
    update: { directorateId: directorate.id },
    create: {
      name: "Artificial Intelligence & Data Science",
      code: "AI-DS",
      directorateId: directorate.id,
    },
  });
  console.log(`✅ Departments configured: ${cseDept.name}, ${aidsDept.name}`);

  // 4. Default Sections for CSE
  const sectionsData = [
    { name: "CSE-A", year: 3, semester: 5, capacity: 60, departmentId: cseDept.id },
    { name: "CSE-B", year: 3, semester: 5, capacity: 60, departmentId: cseDept.id },
    { name: "AIDS-A", year: 3, semester: 5, capacity: 60, departmentId: aidsDept.id },
  ];

  for (const sec of sectionsData) {
    const existing = await prisma.section.findFirst({
      where: { name: sec.name, departmentId: sec.departmentId },
    });
    if (!existing) {
      await prisma.section.create({ data: sec });
    }
  }
  console.log("✅ Academic sections configured.");

  // 5. Default Curriculum Subjects
  const subjectsData = [
    { name: "Data Structures & Algorithms", code: "CS501", credits: 4, semester: 5, type: "Theory", departmentId: cseDept.id },
    { name: "Database Management Systems", code: "CS502", credits: 4, semester: 5, type: "Theory", departmentId: cseDept.id },
    { name: "Machine Learning & Neural Networks", code: "AI501", credits: 4, semester: 5, type: "Theory", departmentId: aidsDept.id },
  ];

  for (const sub of subjectsData) {
    await prisma.subject.upsert({
      where: { code: sub.code },
      update: {},
      create: sub,
    });
  }
  console.log("✅ Curriculum subjects configured.");

  // 6. Default Classrooms / Labs
  const roomsData = [
    { roomNumber: "LAB-101", name: "Advanced Computing Lab", building: "Block A", floor: "1st Floor", type: "Computer Lab", capacity: 60, departmentId: cseDept.id, directorateId: directorate.id },
    { roomNumber: "ROOM-201", name: "Smart Lecture Hall", building: "Block A", floor: "2nd Floor", type: "Lecture Hall", capacity: 70, departmentId: cseDept.id, directorateId: directorate.id },
  ];

  for (const rm of roomsData) {
    await prisma.classroom.upsert({
      where: { roomNumber: rm.roomNumber },
      update: {},
      create: rm,
    });
  }
  console.log("✅ Classrooms configured.");

  console.log("\n🎉 Seed completed successfully! Database is initialized and ready to use.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
