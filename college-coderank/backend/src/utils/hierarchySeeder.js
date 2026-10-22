import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Directorate from "../models/Directorate.js";
import Department from "../models/Department.js";
import Section from "../models/Section.js";
import Classroom from "../models/Classroom.js";
import Subject from "../models/Subject.js";
import TimetableAssignment from "../models/TimetableAssignment.js";
import AuditLog from "../models/AuditLog.js";

export async function seedHierarchy() {
  try {
    const passwordHash = await bcrypt.hash("rungta@123", 10);

    // 1. Super Admin Check / Upgrade
    const superAdminEmail = (process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com").trim().toLowerCase();
    let superAdmin = await Admin.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await Admin.create({
        name: process.env.ADMIN_NAME || "College Super Administrator",
        email: superAdminEmail,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD || "rungta@123", 12),
        role: "super_admin",
        employeeId: "EMP-SUPER-01",
        phone: "+91 98765 43210",
        designation: "Chief Campus Administrator & Chancellor Secretariat",
        status: "active"
      });
      console.log(`[Hierarchy] Created Super Admin account for ${superAdminEmail}`);
    } else if (superAdmin.role !== "super_admin") {
      superAdmin.role = "super_admin";
      superAdmin.employeeId = superAdmin.employeeId || "EMP-SUPER-01";
      superAdmin.designation = superAdmin.designation || "Chief Campus Administrator";
      await superAdmin.save();
    }

    // Check if hierarchy data is already seeded
    const directorateCount = await Directorate.countDocuments();
    if (directorateCount > 0) {
      return;
    }

    console.log("[Hierarchy] Seeding complete college hierarchy (Super Admin → TPO → Directors → HODs → Sections → Teachers → Classrooms)...");

    // 2. TPO (Training & Placement Officer)
    const tpo = await Admin.findOneAndUpdate(
      { email: "tpo@rungta.ac.in" },
      {
        name: "Dr. Alok Verma",
        email: "tpo@rungta.ac.in",
        password: passwordHash,
        role: "tpo",
        employeeId: "EMP-TPO-01",
        phone: "+91 94252 11001",
        designation: "Head - Training & Placement Office (TPO)",
        qualification: "Ph.D. in Management & Industrial Relations",
        status: "active"
      },
      { upsert: true, new: true }
    );

    // 3. Directors (2 institutes / faculties)
    const directorEng = await Admin.findOneAndUpdate(
      { email: "director.eng@rungta.ac.in" },
      {
        name: "Dr. Sunita Rao",
        email: "director.eng@rungta.ac.in",
        password: passwordHash,
        role: "director",
        employeeId: "EMP-DIR-ENG",
        phone: "+91 94252 22002",
        designation: "Director - Faculty of Engineering & Technology",
        qualification: "Ph.D. in Mechanical Systems, M.Tech (IIT Kharagpur)",
        status: "active"
      },
      { upsert: true, new: true }
    );

    const directorCS = await Admin.findOneAndUpdate(
      { email: "director.cs@rungta.ac.in" },
      {
        name: "Dr. Rajesh Sharma",
        email: "director.cs@rungta.ac.in",
        password: passwordHash,
        role: "director",
        employeeId: "EMP-DIR-SCAI",
        phone: "+91 94252 33003",
        designation: "Director - School of Computing & Artificial Intelligence",
        qualification: "Ph.D. in Computer Science, Post-Doc (IISc Bangalore)",
        status: "active"
      },
      { upsert: true, new: true }
    );

    // Create Directorates
    const fet = await Directorate.create({
      name: "Faculty of Engineering & Technology",
      code: "FET",
      description: "Premier engineering division covering Core, Electronics, and Applied Engineering disciplines.",
      directorId: directorEng._id,
      tpoId: tpo._id,
      building: "Rungta Tech Block 1",
      establishedYear: 2008,
      status: "active"
    });

    const scai = await Directorate.create({
      name: "School of Computing & Artificial Intelligence",
      code: "SCAI",
      description: "Center of excellence for Computer Science, Data Science, AI, and Next-Gen Computing.",
      directorId: directorCS._id,
      tpoId: tpo._id,
      building: "CV Raman Advanced Computing Center",
      establishedYear: 2012,
      status: "active"
    });

    directorEng.directorateId = fet._id;
    await directorEng.save();

    directorCS.directorateId = scai._id;
    await directorCS.save();

    // 4. HODs
    const hodCSE = await Admin.findOneAndUpdate(
      { email: "hod.cse@rungta.ac.in" },
      {
        name: "Dr. Anand Mishra",
        email: "hod.cse@rungta.ac.in",
        password: passwordHash,
        role: "hod",
        employeeId: "EMP-HOD-CSE",
        phone: "+91 94252 44004",
        designation: "Professor & Head of Computer Science Department",
        qualification: "Ph.D. in Distributed Systems & Cloud",
        directorateId: scai._id,
        status: "active"
      },
      { upsert: true, new: true }
    );

    const hodDS = await Admin.findOneAndUpdate(
      { email: "hod.ds@rungta.ac.in" },
      {
        name: "Dr. Neha Kapoor",
        email: "hod.ds@rungta.ac.in",
        password: passwordHash,
        role: "hod",
        employeeId: "EMP-HOD-DSAI",
        phone: "+91 94252 55005",
        designation: "Professor & Head of Data Science & AI Department",
        qualification: "Ph.D. in Deep Learning & NLP",
        directorateId: scai._id,
        status: "active"
      },
      { upsert: true, new: true }
    );

    const hodIT = await Admin.findOneAndUpdate(
      { email: "hod.it@rungta.ac.in" },
      {
        name: "Dr. Vikram Patel",
        email: "hod.it@rungta.ac.in",
        password: passwordHash,
        role: "hod",
        employeeId: "EMP-HOD-IT",
        phone: "+91 94252 66006",
        designation: "Head of Information Technology Department",
        qualification: "Ph.D. in Cyber Defense & Network Security",
        directorateId: fet._id,
        status: "active"
      },
      { upsert: true, new: true }
    );

    const hodME = await Admin.findOneAndUpdate(
      { email: "hod.me@rungta.ac.in" },
      {
        name: "Dr. Sanjay Verma",
        email: "hod.me@rungta.ac.in",
        password: passwordHash,
        role: "hod",
        employeeId: "EMP-HOD-ME",
        phone: "+91 94252 77007",
        designation: "Head of Mechanical Engineering Department",
        qualification: "Ph.D. in Robotics & Thermal Dynamics",
        directorateId: fet._id,
        status: "active"
      },
      { upsert: true, new: true }
    );

    // 5. Departments
    const deptCSE = await Department.findOneAndUpdate(
      { name: "Computer Science" },
      {
        name: "Computer Science",
        code: "CSE",
        directorateId: scai._id,
        hodId: hodCSE._id,
        buildingBlock: "Computing Wing A",
        floor: "3rd Floor",
        contactEmail: "cse.dept@rungta.ac.in",
        sections: ["A", "B", "C"],
        status: "active"
      },
      { upsert: true, new: true }
    );

    const deptDS = await Department.findOneAndUpdate(
      { name: "Data Science" },
      {
        name: "Data Science",
        code: "DSAI",
        directorateId: scai._id,
        hodId: hodDS._id,
        buildingBlock: "Computing Wing B",
        floor: "2nd Floor",
        contactEmail: "datascience.dept@rungta.ac.in",
        sections: ["A", "B"],
        status: "active"
      },
      { upsert: true, new: true }
    );

    const deptIT = await Department.findOneAndUpdate(
      { name: "IT" },
      {
        name: "IT",
        code: "IT",
        directorateId: fet._id,
        hodId: hodIT._id,
        buildingBlock: "Tech Block 1",
        floor: "2nd Floor",
        contactEmail: "it.dept@rungta.ac.in",
        sections: ["A", "B"],
        status: "active"
      },
      { upsert: true, new: true }
    );

    const deptME = await Department.findOneAndUpdate(
      { name: "Mechanical" },
      {
        name: "Mechanical",
        code: "ME",
        directorateId: fet._id,
        hodId: hodME._id,
        buildingBlock: "Core Engineering Complex",
        floor: "Ground Floor",
        contactEmail: "mechanical.dept@rungta.ac.in",
        sections: ["A", "B"],
        status: "active"
      },
      { upsert: true, new: true }
    );

    hodCSE.departmentId = deptCSE._id;
    await hodCSE.save();
    hodDS.departmentId = deptDS._id;
    await hodDS.save();
    hodIT.departmentId = deptIT._id;
    await hodIT.save();
    hodME.departmentId = deptME._id;
    await hodME.save();

    // 6. Teachers
    const teacherData = [
      {
        name: "Prof. Amit Sen",
        email: "amit.sen@rungta.ac.in",
        employeeId: "EMP-TCH-101",
        phone: "+91 98271 10001",
        designation: "Associate Professor",
        qualification: "M.Tech in CSE (IIT Roorkee)",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        assignedSubjects: ["Data Structures & Algorithms", "Operating Systems"],
        maxWeeklyHours: 18
      },
      {
        name: "Prof. Priya Nair",
        email: "priya.nair@rungta.ac.in",
        employeeId: "EMP-TCH-102",
        phone: "+91 98271 10002",
        designation: "Assistant Professor",
        qualification: "Ph.D. in Web Architecture & Scalable Systems",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        assignedSubjects: ["Database Systems", "Full Stack Engineering"],
        maxWeeklyHours: 20
      },
      {
        name: "Prof. Rahul Gupta",
        email: "rahul.gupta@rungta.ac.in",
        employeeId: "EMP-TCH-103",
        phone: "+91 98271 10003",
        designation: "Associate Professor",
        qualification: "M.Tech in Data Science & Artificial Intelligence",
        departmentId: deptDS._id,
        directorateId: scai._id,
        assignedSubjects: ["Machine Learning & Neural Networks", "Python for Analytics"],
        maxWeeklyHours: 18
      },
      {
        name: "Prof. Divya Joshi",
        email: "divya.joshi@rungta.ac.in",
        employeeId: "EMP-TCH-104",
        phone: "+91 98271 10004",
        designation: "Assistant Professor",
        qualification: "M.Tech in Artificial Intelligence",
        departmentId: deptDS._id,
        directorateId: scai._id,
        assignedSubjects: ["Big Data Processing & Apache Spark", "Natural Language Processing"],
        maxWeeklyHours: 16
      },
      {
        name: "Prof. Gaurav Mehta",
        email: "gaurav.mehta@rungta.ac.in",
        employeeId: "EMP-TCH-105",
        phone: "+91 98271 10005",
        designation: "Assistant Professor",
        qualification: "M.Tech in Information Technology",
        departmentId: deptIT._id,
        directorateId: fet._id,
        assignedSubjects: ["Cloud Architecture & Kubernetes", "Network Protocols"],
        maxWeeklyHours: 20
      },
      {
        name: "Prof. Sneha Kulkarni",
        email: "sneha.kulkarni@rungta.ac.in",
        employeeId: "EMP-TCH-106",
        phone: "+91 98271 10006",
        designation: "Assistant Professor",
        qualification: "M.Tech in Cyber Security",
        departmentId: deptIT._id,
        directorateId: fet._id,
        assignedSubjects: ["Cryptography & Cyber Defense", "Information Security"],
        maxWeeklyHours: 18
      },
      {
        name: "Prof. Manoj Tiwari",
        email: "manoj.tiwari@rungta.ac.in",
        employeeId: "EMP-TCH-107",
        phone: "+91 98271 10007",
        designation: "Assistant Professor",
        qualification: "M.Tech in CAD/CAM Design",
        departmentId: deptME._id,
        directorateId: fet._id,
        assignedSubjects: ["Computer Aided Design (CAD)", "Applied Robotics"],
        maxWeeklyHours: 20
      },
      {
        name: "Prof. Ritu Saxena",
        email: "ritu.saxena@rungta.ac.in",
        employeeId: "EMP-TCH-108",
        phone: "+91 98271 10008",
        designation: "Lecturer & AI Research Fellow (Floating / Unassigned)",
        qualification: "M.Tech in Computer Engineering",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        assignedSubjects: [],
        maxWeeklyHours: 14,
        status: "active"
      }
    ];

    const teachers = [];
    for (const t of teacherData) {
      const teacher = await Admin.findOneAndUpdate(
        { email: t.email },
        { ...t, password: passwordHash, role: "teacher" },
        { upsert: true, new: true }
      );
      teachers.push(teacher);
    }

    // 7. Classrooms & Labs
    const classroomData = [
      {
        roomNumber: "LAB-301",
        name: "Advanced AI & GPU Computing Lab",
        building: "Rungta Tech Block A",
        floor: "3rd Floor",
        type: "Computer Lab",
        capacity: 60,
        departmentId: deptCSE._id,
        directorateId: scai._id,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true,
        workstationsCount: 60,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "LAB-204",
        name: "Data Science & Big Data Research Lab",
        building: "CV Raman Innovation Wing",
        floor: "2nd Floor",
        type: "Computer Lab",
        capacity: 55,
        departmentId: deptDS._id,
        directorateId: scai._id,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true,
        workstationsCount: 55,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "LAB-102",
        name: "Open Source Systems & Linux Lab",
        building: "Rungta Tech Block A",
        floor: "1st Floor",
        type: "Computer Lab",
        capacity: 50,
        departmentId: deptIT._id,
        directorateId: fet._id,
        hasProjector: true,
        hasSmartBoard: false,
        hasAirConditioning: true,
        workstationsCount: 50,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "LH-101",
        name: "Dr. APJ Abdul Kalam Lecture Hall",
        building: "Central Academic Block",
        floor: "1st Floor",
        type: "Lecture Hall",
        capacity: 120,
        departmentId: deptCSE._id,
        directorateId: scai._id,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true,
        workstationsCount: 0,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "LH-102",
        name: "Sir CV Raman Lecture Hall",
        building: "Central Academic Block",
        floor: "1st Floor",
        type: "Lecture Hall",
        capacity: 120,
        departmentId: deptDS._id,
        directorateId: scai._id,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true,
        workstationsCount: 0,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "CR-201",
        name: "Smart Classroom 201",
        building: "Tech Block 1",
        floor: "2nd Floor",
        type: "Classroom",
        capacity: 65,
        departmentId: deptIT._id,
        directorateId: fet._id,
        hasProjector: true,
        hasSmartBoard: true,
        hasAirConditioning: true,
        workstationsCount: 0,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "CR-202",
        name: "Interactive Classroom 202",
        building: "Tech Block 1",
        floor: "2nd Floor",
        type: "Classroom",
        capacity: 65,
        departmentId: deptME._id,
        directorateId: fet._id,
        hasProjector: true,
        hasSmartBoard: false,
        hasAirConditioning: false,
        workstationsCount: 0,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "AUD-01",
        name: "Swami Vivekananda Grand Auditorium",
        building: "University Cultural Complex",
        floor: "Ground Floor",
        type: "Auditorium",
        capacity: 350,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "SEM-02",
        name: "TPO Corporate Relations Seminar Hall",
        building: "Placement Wing Block B",
        floor: "1st Floor",
        type: "Seminar Hall",
        capacity: 90,
        isAvailable: true,
        maintenanceStatus: "Operational"
      },
      {
        roomNumber: "CR-404",
        name: "Unallocated Expansion Classroom 404",
        building: "Tech Block 1",
        floor: "4th Floor",
        type: "Classroom",
        capacity: 60,
        isAvailable: true,
        maintenanceStatus: "Operational"
      }
    ];

    const classrooms = [];
    for (const c of classroomData) {
      const room = await Classroom.findOneAndUpdate(
        { roomNumber: c.roomNumber },
        c,
        { upsert: true, new: true }
      );
      classrooms.push(room);
    }

    // 8. Sections / Classes
    const sectionData = [
      {
        name: "CSE-A",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        year: 3,
        semester: 5,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 58,
        classTeacherId: teachers[0]._id, // Amit Sen
        primaryClassroomId: classrooms[3]._id, // LH-101
        status: "active"
      },
      {
        name: "CSE-B",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        year: 3,
        semester: 5,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 55,
        classTeacherId: teachers[1]._id, // Priya Nair
        primaryClassroomId: classrooms[0]._id, // LAB-301
        status: "active"
      },
      {
        name: "CSE-C",
        departmentId: deptCSE._id,
        directorateId: scai._id,
        year: 2,
        semester: 3,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 60,
        classTeacherId: teachers[0]._id,
        primaryClassroomId: classrooms[3]._id,
        status: "active"
      },
      {
        name: "DSAI-A",
        departmentId: deptDS._id,
        directorateId: scai._id,
        year: 3,
        semester: 5,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 52,
        classTeacherId: teachers[2]._id, // Rahul Gupta
        primaryClassroomId: classrooms[1]._id, // LAB-204
        status: "active"
      },
      {
        name: "DSAI-B",
        departmentId: deptDS._id,
        directorateId: scai._id,
        year: 2,
        semester: 3,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 48,
        classTeacherId: teachers[3]._id, // Divya Joshi
        primaryClassroomId: classrooms[4]._id, // LH-102
        status: "active"
      },
      {
        name: "IT-A",
        departmentId: deptIT._id,
        directorateId: fet._id,
        year: 3,
        semester: 5,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 51,
        classTeacherId: teachers[4]._id, // Gaurav Mehta
        primaryClassroomId: classrooms[2]._id, // LAB-102
        status: "active"
      },
      {
        name: "IT-B",
        departmentId: deptIT._id,
        directorateId: fet._id,
        year: 2,
        semester: 3,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 46,
        classTeacherId: teachers[5]._id, // Sneha Kulkarni
        primaryClassroomId: classrooms[5]._id, // CR-201
        status: "active"
      },
      {
        name: "ME-A",
        departmentId: deptME._id,
        directorateId: fet._id,
        year: 3,
        semester: 5,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 44,
        classTeacherId: teachers[6]._id, // Manoj Tiwari
        primaryClassroomId: classrooms[6]._id, // CR-202
        status: "active"
      },
      {
        name: "ME-B (Vacant)",
        departmentId: deptME._id,
        directorateId: fet._id,
        year: 2,
        semester: 3,
        academicYear: "2026-2027",
        capacity: 60,
        totalStudents: 0,
        status: "vacant"
      }
    ];

    const sections = [];
    for (const s of sectionData) {
      const section = await Section.findOneAndUpdate(
        { departmentId: s.departmentId, name: s.name, academicYear: s.academicYear },
        s,
        { upsert: true, new: true }
      );
      sections.push(section);
    }

    // Link assignedSections back to teachers
    await Admin.findByIdAndUpdate(teachers[0]._id, { assignedSections: [sections[0]._id, sections[2]._id] });
    await Admin.findByIdAndUpdate(teachers[1]._id, { assignedSections: [sections[1]._id] });
    await Admin.findByIdAndUpdate(teachers[2]._id, { assignedSections: [sections[3]._id] });
    await Admin.findByIdAndUpdate(teachers[3]._id, { assignedSections: [sections[4]._id] });
    await Admin.findByIdAndUpdate(teachers[4]._id, { assignedSections: [sections[5]._id] });
    await Admin.findByIdAndUpdate(teachers[5]._id, { assignedSections: [sections[6]._id] });
    await Admin.findByIdAndUpdate(teachers[6]._id, { assignedSections: [sections[7]._id] });

    // 9. Subjects
    const subjectsData = [
      { name: "Data Structures & Algorithms", code: "CS-301", departmentId: deptCSE._id, credits: 4, type: "Theory", semester: 5 },
      { name: "Operating Systems & Concurrency", code: "CS-302", departmentId: deptCSE._id, credits: 4, type: "Theory", semester: 5 },
      { name: "Full Stack Web Engineering Lab", code: "CS-303L", departmentId: deptCSE._id, credits: 2, type: "Lab / Practical", semester: 5 },
      { name: "Machine Learning & Neural Networks", code: "DS-301", departmentId: deptDS._id, credits: 4, type: "Theory", semester: 5 },
      { name: "Big Data Systems & PySpark", code: "DS-302", departmentId: deptDS._id, credits: 4, type: "Theory", semester: 5 },
      { name: "Cloud Architecture & Kubernetes", code: "IT-301", departmentId: deptIT._id, credits: 4, type: "Theory", semester: 5 },
      { name: "Computer Aided Design (CAD/CAM)", code: "ME-301", departmentId: deptME._id, credits: 4, type: "Theory", semester: 5 }
    ];

    const subjects = [];
    for (const sub of subjectsData) {
      const subject = await Subject.findOneAndUpdate(
        { code: sub.code },
        sub,
        { upsert: true, new: true }
      );
      subjects.push(subject);
    }

    // 10. Timetable Assignments (linking Teacher ↔ Section ↔ Subject ↔ Classroom)
    const assignmentsData = [
      {
        teacherId: teachers[0]._id, // Amit Sen
        sectionId: sections[0]._id, // CSE-A
        departmentId: deptCSE._id,
        directorateId: scai._id,
        subjectId: subjects[0]._id,
        subjectName: "Data Structures & Algorithms",
        classroomId: classrooms[3]._id, // LH-101
        dayOfWeek: "Monday",
        timeSlot: "09:00 - 10:00",
        slotType: "Lecture"
      },
      {
        teacherId: teachers[0]._id,
        sectionId: sections[0]._id,
        departmentId: deptCSE._id,
        directorateId: scai._id,
        subjectId: subjects[0]._id,
        subjectName: "Data Structures & Algorithms",
        classroomId: classrooms[0]._id, // LAB-301
        dayOfWeek: "Wednesday",
        timeSlot: "10:00 - 12:00",
        slotType: "Lab"
      },
      {
        teacherId: teachers[1]._id, // Priya Nair
        sectionId: sections[1]._id, // CSE-B
        departmentId: deptCSE._id,
        directorateId: scai._id,
        subjectId: subjects[2]._id,
        subjectName: "Full Stack Web Engineering Lab",
        classroomId: classrooms[0]._id, // LAB-301
        dayOfWeek: "Tuesday",
        timeSlot: "11:15 - 01:15",
        slotType: "Lab"
      },
      {
        teacherId: teachers[2]._id, // Rahul Gupta
        sectionId: sections[3]._id, // DSAI-A
        departmentId: deptDS._id,
        directorateId: scai._id,
        subjectId: subjects[3]._id,
        subjectName: "Machine Learning & Neural Networks",
        classroomId: classrooms[1]._id, // LAB-204
        dayOfWeek: "Monday",
        timeSlot: "10:00 - 11:00",
        slotType: "Lecture"
      },
      {
        teacherId: teachers[3]._id, // Divya Joshi
        sectionId: sections[4]._id, // DSAI-B
        departmentId: deptDS._id,
        directorateId: scai._id,
        subjectId: subjects[4]._id,
        subjectName: "Big Data Systems & PySpark",
        classroomId: classrooms[4]._id, // LH-102
        dayOfWeek: "Thursday",
        timeSlot: "09:00 - 10:00",
        slotType: "Lecture"
      },
      {
        teacherId: teachers[4]._id, // Gaurav Mehta
        sectionId: sections[5]._id, // IT-A
        departmentId: deptIT._id,
        directorateId: fet._id,
        subjectId: subjects[5]._id,
        subjectName: "Cloud Architecture & Kubernetes",
        classroomId: classrooms[2]._id, // LAB-102
        dayOfWeek: "Friday",
        timeSlot: "11:15 - 12:15",
        slotType: "Lecture"
      },
      {
        teacherId: teachers[6]._id, // Manoj Tiwari
        sectionId: sections[7]._id, // ME-A
        departmentId: deptME._id,
        directorateId: fet._id,
        subjectId: subjects[6]._id,
        subjectName: "Computer Aided Design (CAD/CAM)",
        classroomId: classrooms[6]._id, // CR-202
        dayOfWeek: "Wednesday",
        timeSlot: "02:00 - 04:00",
        slotType: "Lab"
      }
    ];

    for (const a of assignmentsData) {
      await TimetableAssignment.findOneAndUpdate(
        { teacherId: a.teacherId, sectionId: a.sectionId, dayOfWeek: a.dayOfWeek, timeSlot: a.timeSlot },
        a,
        { upsert: true }
      );
    }

    // 11. Initial Audit Logs
    await AuditLog.create([
      {
        userId: superAdmin._id,
        userName: superAdmin.name,
        userEmail: superAdmin.email,
        role: "super_admin",
        action: "INITIALIZE_HIERARCHY",
        entityType: "University",
        entityId: "RISU-ROOT",
        details: "Established organizational hierarchy: Super Admin → TPO → Directors → HODs → Sections → Teachers → Classrooms."
      },
      {
        userId: superAdmin._id,
        userName: superAdmin.name,
        userEmail: superAdmin.email,
        role: "super_admin",
        action: "APPOINT_TPO",
        entityType: "Admin",
        entityId: tpo._id.toString(),
        details: "Appointed Dr. Alok Verma as Chief Training & Placement Officer."
      },
      {
        userId: superAdmin._id,
        userName: superAdmin.name,
        userEmail: superAdmin.email,
        role: "super_admin",
        action: "APPOINT_DIRECTOR",
        entityType: "Directorate",
        entityId: scai._id.toString(),
        details: "Appointed Dr. Rajesh Sharma as Director of School of Computing & AI."
      },
      {
        userId: hodCSE._id,
        userName: hodCSE.name,
        userEmail: hodCSE.email,
        role: "hod",
        action: "ASSIGN_CLASS_TEACHER",
        entityType: "Section",
        entityId: sections[0]._id.toString(),
        details: "Assigned Prof. Amit Sen as Class Teacher for CSE-A and allocated LH-101."
      }
    ]);

    console.log("[Hierarchy] Complete university hierarchy seeded successfully!");
  } catch (err) {
    console.error("[Hierarchy] Seeding error:", err);
  }
}
