import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import Directorate from "../models/Directorate.js";
import Department from "../models/Department.js";
import Section from "../models/Section.js";
import Classroom from "../models/Classroom.js";
import Subject from "../models/Subject.js";
import TimetableAssignment from "../models/TimetableAssignment.js";
import AuditLog from "../models/AuditLog.js";

async function logAudit(user, action, entityType, entityId, details, req) {
  try {
    await AuditLog.create({
      userId: user.id ? new mongoose.Types.ObjectId(user.id) : null,
      userName: user.name || "System Admin",
      userEmail: user.email || "admin@rungta.ac.in",
      role: user.role || "super_admin",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      details,
      ipAddress: req?.ip || "127.0.0.1"
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to record:", err.message);
  }
}

/**
 * 1. GET /api/hierarchy/tree
 * Constructs the interactive hierarchical organizational tree scoped by user's role:
 * Super Admin → TPO → Directors → HODs → Sections/Classes → Teachers → Classrooms
 */
export async function getHierarchyTree(req, res, next) {
  try {
    const userRole = req.user.role === "admin" ? "super_admin" : req.user.role;
    const userId = req.user.id;

    // Fetch master collections with populated references
    const [
      allDirectorates,
      allDepartments,
      allSections,
      allTeachers,
      allClassrooms,
      allAssignments,
      allTPOs,
      superAdmins
    ] = await Promise.all([
      Directorate.find({ status: "active" }).populate("directorId", "name email phone designation employeeId"),
      Department.find({ status: "active" }).populate("hodId", "name email phone designation employeeId"),
      Section.find().populate("classTeacherId", "name email phone employeeId").populate("primaryClassroomId", "roomNumber name type capacity"),
      Admin.find({ role: "teacher", status: "active" }).select("-password"),
      Classroom.find(),
      TimetableAssignment.find().populate("subjectId", "name code credits"),
      Admin.find({ role: "tpo", status: "active" }).select("-password"),
      Admin.find({ role: { $in: ["super_admin", "admin"] }, status: "active" }).select("-password")
    ]);

    // Role-based scoping filters
    let visibleDirectorates = allDirectorates;
    let visibleDepartments = allDepartments;
    let visibleSections = allSections;
    let visibleTeachers = allTeachers;
    let visibleClassrooms = allClassrooms;

    if (userRole === "director") {
      visibleDirectorates = allDirectorates.filter(
        (d) => String(d.directorId?._id) === userId || String(d._id) === String(req.user.directorateId)
      );
      const dirIds = visibleDirectorates.map((d) => String(d._id));
      visibleDepartments = allDepartments.filter((dept) => dirIds.includes(String(dept.directorateId)));
      const deptIds = visibleDepartments.map((dept) => String(dept._id));
      visibleSections = allSections.filter((s) => deptIds.includes(String(s.departmentId)));
      visibleTeachers = allTeachers.filter(
        (t) => deptIds.includes(String(t.departmentId)) || dirIds.includes(String(t.directorateId))
      );
      visibleClassrooms = allClassrooms.filter(
        (c) => !c.directorateId || dirIds.includes(String(c.directorateId))
      );
    } else if (userRole === "hod") {
      visibleDepartments = allDepartments.filter(
        (dept) => String(dept.hodId?._id) === userId || String(dept._id) === String(req.user.departmentId)
      );
      const deptIds = visibleDepartments.map((dept) => String(dept._id));
      const parentDirIds = visibleDepartments.map((dept) => String(dept.directorateId)).filter(Boolean);
      visibleDirectorates = allDirectorates.filter((d) => parentDirIds.includes(String(d._id)));
      visibleSections = allSections.filter((s) => deptIds.includes(String(s.departmentId)));
      visibleTeachers = allTeachers.filter((t) => deptIds.includes(String(t.departmentId)));
      visibleClassrooms = allClassrooms.filter(
        (c) => !c.departmentId || deptIds.includes(String(c.departmentId))
      );
    } else if (userRole === "teacher") {
      const myTeacher = allTeachers.find((t) => String(t._id) === userId) || req.user;
      visibleTeachers = [myTeacher];
      const mySectionIds = (myTeacher.assignedSections || []).map((s) => String(s));
      visibleSections = allSections.filter(
        (s) => mySectionIds.includes(String(s._id)) || String(s.classTeacherId?._id) === userId
      );
      const deptId = String(myTeacher.departmentId);
      visibleDepartments = allDepartments.filter((dept) => String(dept._id) === deptId);
      const dirId = visibleDepartments[0]?.directorateId;
      visibleDirectorates = allDirectorates.filter((d) => String(d._id) === String(dirId));
      visibleClassrooms = allClassrooms;
    }

    // Build the Tree Structure:
    // Root: Super Admin Node
    const rootAdmin = superAdmins[0] || {
      _id: "root-admin",
      name: "Rungta Chancellor Secretariat",
      email: "chancellor@rungta.ac.in",
      designation: "Super Administrator"
    };

    // Level 2: TPO Node
    const tpoNodes = allTPOs.map((tpoUser) => ({
      id: `tpo-${tpoUser._id}`,
      name: tpoUser.name,
      level: "tpo",
      role: "TPO",
      badge: "Training & Placement Officer",
      details: {
        email: tpoUser.email,
        phone: tpoUser.phone,
        employeeId: tpoUser.employeeId,
        designation: tpoUser.designation,
        status: tpoUser.status,
        responsibilities: "Institution-wide campus placement drive, industry linkage & corporate relations"
      },
      stats: {
        totalInstitutes: visibleDirectorates.length,
        totalDepartments: visibleDepartments.length,
        totalStudents: visibleSections.reduce((sum, s) => sum + (s.totalStudents || 0), 0)
      }
    }));

    // Level 3: Directors
    const directorNodes = visibleDirectorates.map((dir) => {
      const dirHODs = visibleDepartments.filter(
        (dept) => String(dept.directorateId) === String(dir._id)
      );

      // Level 4: HODs under each Director
      const hodNodes = dirHODs.map((dept) => {
        const hodUser = dept.hodId || {
          _id: `vacant-hod-${dept._id}`,
          name: "Unassigned HOD (Position Vacant)",
          email: dept.contactEmail || "department@rungta.ac.in",
          designation: "Head of Department"
        };

        const deptSections = visibleSections.filter(
          (s) => String(s.departmentId) === String(dept._id)
        );

        // Level 5: Sections / Classes under each Department
        const sectionNodes = deptSections.map((sec) => {
          // Level 6: Teachers teaching in this section (Class teacher and assigned subject teachers)
          const teacherIdsInSec = [
            ...new Set([
              sec.classTeacherId ? String(sec.classTeacherId._id || sec.classTeacherId) : null,
              ...visibleTeachers
                .filter((t) => (t.assignedSections || []).map((s) => String(s)).includes(String(sec._id)))
                .map((t) => String(t._id))
            ].filter(Boolean))
          ];

          const secTeachers = visibleTeachers.filter((t) => teacherIdsInSec.includes(String(t._id)));

          // Level 7: Direct Classroom & Lab allocated to this section
          const primaryRoom = sec.primaryClassroomId
            ? visibleClassrooms.find((c) => String(c._id) === String(sec.primaryClassroomId?._id || sec.primaryClassroomId))
            : null;

          // Department labs available for this section
          const deptLabs = visibleClassrooms.filter(
            (c) => String(c.departmentId) === String(sec.departmentId) && c.type.toLowerCase().includes("lab")
          );

          const allocatedRooms = [
            ...(primaryRoom ? [primaryRoom] : []),
            ...deptLabs.filter((lab) => !primaryRoom || String(lab._id) !== String(primaryRoom._id))
          ];

          const classroomNodes = allocatedRooms.map((room) => {
            const isPrimary = primaryRoom && String(room._id) === String(primaryRoom._id);
            return {
              id: `room-${sec._id}-${room._id}`,
              name: `${room.roomNumber} (${room.type})`,
              level: "classroom",
              role: "Classroom / Lab",
              badge: isPrimary ? "Primary Classroom" : "Department Lab",
              details: {
                roomNumber: room.roomNumber,
                building: room.building,
                floor: room.floor,
                type: room.type,
                capacity: room.capacity,
                workstations: room.workstationsCount,
                hasProjector: room.hasProjector,
                hasSmartBoard: room.hasSmartBoard,
                hasAirConditioning: room.hasAirConditioning,
                allocatedSection: sec.name,
                status: isPrimary ? `Allocated to ${sec.name} (${sec.totalStudents} Students)` : `Available Lab Facility`
              },
              stats: {
                capacity: room.capacity,
                workstations: room.workstationsCount
              }
            };
          });

          const teacherNodes = secTeachers.map((tch) => {
            const isClassTeacher = String(sec.classTeacherId?._id || sec.classTeacherId) === String(tch._id);
            return {
              id: `tch-${sec._id}-${tch._id}`,
              name: tch.name,
              level: "teacher",
              role: "Teacher",
              badge: isClassTeacher ? "Class Teacher ⭐" : "Subject Faculty",
              details: {
                email: tch.email,
                phone: tch.phone,
                employeeId: tch.employeeId,
                designation: tch.designation,
                qualification: tch.qualification,
                assignedSubjects: tch.assignedSubjects || [],
                assignedSection: sec.name
              },
              stats: {
                subjectsCount: (tch.assignedSubjects || []).length,
                allocatedRooms: classroomNodes.length
              },
              children: classroomNodes
            };
          });

          return {
            id: `sec-${sec._id}`,
            name: `${sec.name} (Year ${sec.year} · Sem ${sec.semester})`,
            level: "section",
            role: "Section / Class",
            badge: sec.status === "vacant" ? "Vacant Cohort" : `${sec.totalStudents} Students`,
            details: {
              sectionName: sec.name,
              year: sec.year,
              semester: sec.semester,
              academicYear: sec.academicYear,
              capacity: sec.capacity,
              totalStudents: sec.totalStudents,
              status: sec.status,
              classTeacher: sec.classTeacherId?.name || "Not Appointed",
              primaryRoom: sec.primaryClassroomId?.roomNumber || "Shared"
            },
            stats: {
              students: sec.totalStudents,
              capacity: sec.capacity,
              assignedTeachers: teacherNodes.length
            },
            children: teacherNodes
          };
        });

        const deptTeachers = visibleTeachers.filter(
          (t) => String(t.departmentId) === String(dept._id)
        );

        return {
          id: `hod-${dept._id}`,
          name: `${dept.name} (${dept.code || "DEPT"})`,
          subTitle: `HOD: ${hodUser.name}`,
          level: "hod",
          role: "HOD",
          badge: dept.code || "HOD",
          details: {
            departmentName: dept.name,
            code: dept.code,
            hodName: hodUser.name,
            hodEmail: hodUser.email,
            hodPhone: hodUser.phone,
            employeeId: hodUser.employeeId,
            buildingBlock: dept.buildingBlock,
            floor: dept.floor,
            contactEmail: dept.contactEmail
          },
          stats: {
            sectionsCount: sectionNodes.length,
            facultyCount: deptTeachers.length,
            totalStudents: sectionNodes.reduce((sum, s) => sum + (s.stats?.students || 0), 0)
          },
          children: sectionNodes
        };
      });

      const directorUser = dir.directorId || {
        _id: `vacant-dir-${dir._id}`,
        name: "Unassigned Director",
        email: "director@rungta.ac.in",
        designation: "Director of Institute"
      };

      return {
        id: `dir-${dir._id}`,
        name: dir.name,
        subTitle: `Director: ${directorUser.name}`,
        level: "director",
        role: "Director",
        badge: dir.code || "DIRECTOR",
        details: {
          directorateName: dir.name,
          code: dir.code,
          directorName: directorUser.name,
          directorEmail: directorUser.email,
          directorPhone: directorUser.phone,
          employeeId: directorUser.employeeId,
          building: dir.building,
          establishedYear: dir.establishedYear,
          description: dir.description
        },
        stats: {
          departmentsCount: hodNodes.length,
          totalStudents: hodNodes.reduce((sum, h) => sum + (h.stats?.totalStudents || 0), 0)
        },
        children: hodNodes
      };
    });

    // Assemble root tree node
    const tree = {
      id: "root-super-admin",
      name: rootAdmin.name || "Chancellor & Super Admin",
      level: "super_admin",
      role: "Super Admin",
      badge: "University Head Authority",
      details: {
        email: rootAdmin.email,
        phone: rootAdmin.phone || "+91 98765 43210",
        designation: rootAdmin.designation || "Chief Campus Administrator",
        institution: "Rungta International Skills University",
        authority: "Full Institutional Control across Super Admin → TPO → Directors → HODs → Sections → Teachers → Classrooms"
      },
      stats: {
        totalInstitutes: visibleDirectorates.length,
        totalDepartments: visibleDepartments.length,
        totalTeachers: visibleTeachers.length,
        totalSections: visibleSections.length,
        totalClassrooms: visibleClassrooms.length,
        totalStudents: visibleSections.reduce((sum, s) => sum + (s.totalStudents || 0), 0)
      },
      tpoNodes,
      children: directorNodes
    };

    return res.json({
      tree,
      scope: {
        userRole,
        readOnly: userRole === "tpo",
        accessibleInstitutes: visibleDirectorates.length,
        accessibleDepartments: visibleDepartments.length
      }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * 2. GET /api/hierarchy/overview
 * High-level summary metrics, unassigned teachers, vacant sections, classroom allocation rate
 */
export async function getHierarchyOverview(req, res, next) {
  try {
    const userRole = req.user.role === "admin" ? "super_admin" : req.user.role;
    const userId = req.user.id;

    let dirQuery = { status: "active" };
    let deptQuery = { status: "active" };
    let secQuery = {};
    let tchQuery = { role: "teacher", status: "active" };
    let roomQuery = {};

    if (userRole === "director") {
      dirQuery = { directorId: userId };
      const myDirs = await Directorate.find(dirQuery).select("_id");
      const dirIds = myDirs.map((d) => d._id);
      deptQuery = { directorateId: { $in: dirIds } };
      secQuery = { directorateId: { $in: dirIds } };
      tchQuery = { role: "teacher", directorateId: { $in: dirIds } };
    } else if (userRole === "hod") {
      deptQuery = { hodId: userId };
      const myDepts = await Department.find(deptQuery).select("_id");
      const deptIds = myDepts.map((d) => d._id);
      secQuery = { departmentId: { $in: deptIds } };
      tchQuery = { role: "teacher", departmentId: { $in: deptIds } };
      roomQuery = { $or: [{ departmentId: { $in: deptIds } }, { departmentId: null }] };
    } else if (userRole === "teacher") {
      const myTeacher = await Admin.findById(userId);
      secQuery = { _id: { $in: myTeacher?.assignedSections || [] } };
      tchQuery = { _id: userId };
      deptQuery = { _id: myTeacher?.departmentId };
    }

    const [
      directorsCount,
      hodsCount,
      teachersCount,
      sectionsCount,
      classroomsCount,
      allTeachers,
      allSections,
      allClassrooms,
      allAssignments,
      recentLogs
    ] = await Promise.all([
      Admin.countDocuments({ role: "director", status: "active" }),
      Admin.countDocuments({ role: "hod", status: "active" }),
      Admin.countDocuments(tchQuery),
      Section.countDocuments(secQuery),
      Classroom.countDocuments(roomQuery),
      Admin.find(tchQuery).populate("departmentId", "name code"),
      Section.find(secQuery).populate("departmentId", "name code").populate("classTeacherId", "name"),
      Classroom.find(roomQuery).populate("departmentId", "name code"),
      TimetableAssignment.find(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8)
    ]);

    // Compute Unassigned Teachers (no section cohort assigned)
    const unassignedTeachers = allTeachers.filter((t) => {
      return !t.assignedSections || t.assignedSections.length === 0;
    });

    // Compute Vacant Sections (0 students or no class teacher appointed)
    const vacantSections = allSections.filter((s) => s.totalStudents === 0 || s.status === "vacant" || !s.classTeacherId);

    // Compute Classroom Allocation Status (rooms assigned as primary classroom or assigned to a department)
    const allocatedRoomIds = new Set(allSections.map((s) => String(s.primaryClassroomId?._id || s.primaryClassroomId)).filter(Boolean));
    const allocatedClassroomsCount = allClassrooms.filter((c) => allocatedRoomIds.has(String(c._id)) || c.departmentId).length;
    const allocationRate = classroomsCount > 0 ? Math.round((allocatedClassroomsCount / classroomsCount) * 100) : 0;

    const totalStudents = allSections.reduce((sum, s) => sum + (s.totalStudents || 0), 0);

    return res.json({
      metrics: {
        totalDirectors: directorsCount,
        totalHODs: hodsCount,
        totalTeachers: teachersCount,
        totalSections: sectionsCount,
        totalClassrooms: classroomsCount,
        totalStudents,
        allocatedClassroomsCount,
        allocationRate,
        unassignedTeachersCount: unassignedTeachers.length,
        vacantSectionsCount: vacantSections.length
      },
      unassignedTeachers: unassignedTeachers.map((t) => ({
        id: t._id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        department: t.departmentId?.name || "Unassigned",
        designation: t.designation || "Assistant Professor"
      })),
      vacantSections: vacantSections.map((s) => ({
        id: s._id,
        name: s.name,
        department: s.departmentId?.name,
        year: s.year,
        semester: s.semester,
        reason: s.totalStudents === 0 ? "Zero Enrolled Students" : "No Class Teacher Appointed"
      })),
      recentLogs
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * 3. GET /api/hierarchy/users
 * Returns users filtered by role/department (Super Admin, TPO, Director, HOD, Teacher)
 */
export async function getUsers(req, res, next) {
  try {
    const { role, departmentId, directorateId, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (departmentId) filter.departmentId = departmentId;
    if (directorateId) filter.directorateId = directorateId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } }
      ];
    }

    const users = await Admin.find(filter)
      .populate("directorateId", "name code")
      .populate("departmentId", "name code")
      .populate("assignedSections", "name year")
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

/**
 * 4. POST /api/hierarchy/users
 * Super Admin creates a new user with specific role & assignments
 */
export async function createUser(req, res, next) {
  try {
    const {
      name,
      email,
      password = "rungta@123",
      role,
      employeeId,
      phone,
      designation,
      qualification,
      directorateId,
      departmentId,
      assignedSections,
      assignedSubjects
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, email, and role are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Admin.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      role,
      employeeId: employeeId?.trim() || undefined,
      phone: phone?.trim(),
      designation: designation?.trim(),
      qualification: qualification?.trim(),
      directorateId: directorateId || undefined,
      departmentId: departmentId || undefined,
      assignedSections: assignedSections || [],
      assignedSubjects: assignedSubjects || []
    });

    // If appointing Director, link back to Directorate
    if (role === "director" && directorateId) {
      await Directorate.findByIdAndUpdate(directorateId, { directorId: newUser._id });
    }

    // If appointing HOD, link back to Department
    if (role === "hod" && departmentId) {
      await Department.findByIdAndUpdate(departmentId, { hodId: newUser._id });
    }

    await logAudit(
      req.user,
      "CREATE_USER",
      "Admin",
      newUser._id,
      `Created ${role.toUpperCase()} account for ${name} (${cleanEmail})`,
      req
    );

    return res.status(201).json({
      message: `User created successfully as ${role}.`,
      user: newUser
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * 5. PUT /api/hierarchy/users/:id
 * Super Admin updates user details, role, or assignments
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      employeeId,
      phone,
      designation,
      qualification,
      status,
      directorateId,
      departmentId,
      assignedSections,
      assignedSubjects
    } = req.body;

    const user = await Admin.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (employeeId !== undefined) user.employeeId = employeeId?.trim() || undefined;
    if (phone !== undefined) user.phone = phone?.trim();
    if (designation !== undefined) user.designation = designation?.trim();
    if (qualification !== undefined) user.qualification = qualification?.trim();
    if (status) user.status = status;
    if (directorateId !== undefined) user.directorateId = directorateId || null;
    if (departmentId !== undefined) user.departmentId = departmentId || null;
    if (assignedSections !== undefined) user.assignedSections = assignedSections;
    if (assignedSubjects !== undefined) user.assignedSubjects = assignedSubjects;

    await user.save();

    await logAudit(
      req.user,
      "UPDATE_USER",
      "Admin",
      user._id,
      `Updated profile and assignments for ${user.name} (${user.email})`,
      req
    );

    return res.json({ message: "User updated successfully.", user });
  } catch (error) {
    return next(error);
  }
}

/**
 * 6. DELETE /api/hierarchy/users/:id
 * Super Admin deletes user
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own administrative account." });
    }

    const user = await Admin.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Clean up references
    await Directorate.updateMany({ directorId: id }, { $unset: { directorId: "" } });
    await Department.updateMany({ hodId: id }, { $unset: { hodId: "" } });
    await Section.updateMany({ classTeacherId: id }, { $unset: { classTeacherId: "" } });
    await TimetableAssignment.deleteMany({ teacherId: id });

    await logAudit(
      req.user,
      "DELETE_USER",
      "Admin",
      id,
      `Deleted ${user.role} user ${user.name} (${user.email}) and cleared associated references`,
      req
    );

    return res.json({ message: "User and related assignments removed successfully." });
  } catch (error) {
    return next(error);
  }
}

/**
 * 7. Directorates CRUD
 */
export async function getDirectorates(req, res, next) {
  try {
    const directorates = await Directorate.find()
      .populate("directorId", "name email phone designation employeeId")
      .populate("tpoId", "name email phone designation")
      .sort({ name: 1 });
    return res.json({ directorates });
  } catch (error) {
    return next(error);
  }
}

export async function createDirectorate(req, res, next) {
  try {
    const { name, code, description, directorId, building } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: "Name and code are required." });
    }
    const created = await Directorate.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
      directorId: directorId || null,
      building
    });
    if (directorId) {
      await Admin.findByIdAndUpdate(directorId, { directorateId: created._id, role: "director" });
    }
    await logAudit(req.user, "CREATE_DIRECTORATE", "Directorate", created._id, `Created Directorate ${created.name}`, req);
    return res.status(201).json({ directorate: created });
  } catch (error) {
    return next(error);
  }
}

/**
 * 8. Departments CRUD
 */
export async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find()
      .populate("directorateId", "name code")
      .populate("hodId", "name email phone designation employeeId")
      .sort({ name: 1 });
    return res.json({ departments });
  } catch (error) {
    return next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { name, code, directorateId, hodId, buildingBlock, floor, contactEmail } = req.body;
    if (!name) return res.status(400).json({ message: "Department name is required." });

    const created = await Department.create({
      name: name.trim(),
      code: code?.trim().toUpperCase(),
      directorateId: directorateId || null,
      hodId: hodId || null,
      buildingBlock,
      floor,
      contactEmail
    });

    if (hodId) {
      await Admin.findByIdAndUpdate(hodId, { departmentId: created._id, role: "hod" });
    }

    await logAudit(req.user, "CREATE_DEPARTMENT", "Department", created._id, `Created Department ${created.name}`, req);
    return res.status(201).json({ department: created });
  } catch (error) {
    return next(error);
  }
}

/**
 * 9. Sections / Classes CRUD
 */
export async function getSections(req, res, next) {
  try {
    const { departmentId, year } = req.query;
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;
    if (year) filter.year = Number(year);

    const sections = await Section.find(filter)
      .populate("departmentId", "name code")
      .populate("directorateId", "name code")
      .populate("classTeacherId", "name email phone employeeId")
      .populate("primaryClassroomId", "roomNumber name type capacity")
      .sort({ name: 1 });

    return res.json({ sections });
  } catch (error) {
    return next(error);
  }
}

export async function createSection(req, res, next) {
  try {
    const { name, departmentId, directorateId, year, semester, academicYear, capacity, classTeacherId, primaryClassroomId } = req.body;
    if (!name || !departmentId || !year || !semester) {
      return res.status(400).json({ message: "Name, department, year, and semester are required." });
    }

    const created = await Section.create({
      name: name.trim(),
      departmentId,
      directorateId: directorateId || null,
      year: Number(year),
      semester: Number(semester),
      academicYear: academicYear || "2026-2027",
      capacity: capacity ? Number(capacity) : 60,
      classTeacherId: classTeacherId || null,
      primaryClassroomId: primaryClassroomId || null
    });

    if (classTeacherId) {
      await Admin.findByIdAndUpdate(classTeacherId, { $addToSet: { assignedSections: created._id } });
    }

    await logAudit(req.user, "CREATE_SECTION", "Section", created._id, `Created section/class ${created.name}`, req);
    return res.status(201).json({ section: created });
  } catch (error) {
    return next(error);
  }
}

export async function updateSection(req, res, next) {
  try {
    const { id } = req.params;
    const { name, year, semester, capacity, totalStudents, status, classTeacherId, primaryClassroomId } = req.body;
    const sec = await Section.findById(id);
    if (!sec) return res.status(404).json({ message: "Section not found." });

    if (name) sec.name = name.trim();
    if (year !== undefined) sec.year = Number(year);
    if (semester !== undefined) sec.semester = Number(semester);
    if (capacity !== undefined) sec.capacity = Number(capacity);
    if (totalStudents !== undefined) sec.totalStudents = Number(totalStudents);
    if (status) sec.status = status;
    if (primaryClassroomId !== undefined) sec.primaryClassroomId = primaryClassroomId || null;
    if (classTeacherId !== undefined) {
      sec.classTeacherId = classTeacherId || null;
      if (classTeacherId) {
        await Admin.findByIdAndUpdate(classTeacherId, { $addToSet: { assignedSections: sec._id } });
      }
    }

    await sec.save();
    await logAudit(req.user, "UPDATE_SECTION", "Section", sec._id, `Updated section ${sec.name}`, req);
    return res.json({ message: "Section updated successfully.", section: sec });
  } catch (error) {
    return next(error);
  }
}

export async function assignClassroom(req, res, next) {
  try {
    const { classroomId, sectionId } = req.body;
    if (!classroomId || !sectionId) {
      return res.status(400).json({ message: "Classroom and Section are required." });
    }
    const section = await Section.findById(sectionId);
    if (!section) return res.status(404).json({ message: "Section not found." });

    const room = await Classroom.findById(classroomId);
    if (!room) return res.status(404).json({ message: "Classroom not found." });

    section.primaryClassroomId = classroomId;
    await section.save();

    await logAudit(
      req.user,
      "ALLOCATE_CLASSROOM",
      "Classroom",
      classroomId,
      `Allocated ${room.roomNumber} (${room.type}) as primary room for Section ${section.name}`,
      req
    );

    return res.json({ message: `Classroom ${room.roomNumber} allocated to ${section.name} successfully.` });
  } catch (error) {
    return next(error);
  }
}

/**
 * 10. Classrooms CRUD
 */
export async function getClassrooms(req, res, next) {
  try {
    const { type, building, isAvailable } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (building) filter.building = building;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === "true";

    const classrooms = await Classroom.find(filter)
      .populate("departmentId", "name code")
      .sort({ roomNumber: 1 });

    return res.json({ classrooms });
  } catch (error) {
    return next(error);
  }
}

export async function createClassroom(req, res, next) {
  try {
    const { roomNumber, name, building, floor, type, capacity, departmentId, workstationsCount, hasProjector, hasSmartBoard, hasAirConditioning } = req.body;
    if (!roomNumber || !building || !capacity) {
      return res.status(400).json({ message: "Room number, building, and capacity are required." });
    }

    const cleanRoom = roomNumber.trim().toUpperCase();
    const existing = await Classroom.findOne({ roomNumber: cleanRoom });
    if (existing) {
      return res.status(409).json({ message: `Classroom ${cleanRoom} already exists.` });
    }

    const created = await Classroom.create({
      roomNumber: cleanRoom,
      name,
      building,
      floor: floor || "1st Floor",
      type: type || "Classroom",
      capacity: Number(capacity),
      departmentId: departmentId || null,
      workstationsCount: workstationsCount ? Number(workstationsCount) : 0,
      hasProjector: hasProjector !== false,
      hasSmartBoard: Boolean(hasSmartBoard),
      hasAirConditioning: Boolean(hasAirConditioning)
    });

    await logAudit(req.user, "CREATE_CLASSROOM", "Classroom", created._id, `Added classroom/lab ${created.roomNumber} (${created.type})`, req);
    return res.status(201).json({ classroom: created });
  } catch (error) {
    return next(error);
  }
}

/**
 * 11. Timetable Assignments CRUD with conflict detection
 */
export async function getAssignments(req, res, next) {
  try {
    const { teacherId, sectionId, departmentId, classroomId, dayOfWeek } = req.query;
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;
    if (sectionId) filter.sectionId = sectionId;
    if (departmentId) filter.departmentId = departmentId;
    if (classroomId) filter.classroomId = classroomId;
    if (dayOfWeek) filter.dayOfWeek = dayOfWeek;

    const assignments = await TimetableAssignment.find(filter)
      .populate("teacherId", "name email employeeId designation")
      .populate("sectionId", "name year semester")
      .populate("classroomId", "roomNumber name type capacity building")
      .populate("departmentId", "name code")
      .sort({ dayOfWeek: 1, timeSlot: 1 });

    return res.json({ assignments });
  } catch (error) {
    return next(error);
  }
}

export async function createAssignment(req, res, next) {
  try {
    const { teacherId, sectionId, departmentId, subjectName, classroomId, dayOfWeek, timeSlot, slotType } = req.body;

    if (!teacherId || !sectionId || !classroomId || !dayOfWeek || !timeSlot || !subjectName) {
      return res.status(400).json({ message: "Teacher, Section, Classroom, Subject, Day, and Time Slot are required." });
    }

    // 1. Conflict Check: Classroom double booking
    const roomConflict = await TimetableAssignment.findOne({
      classroomId,
      dayOfWeek,
      timeSlot
    }).populate("teacherId", "name").populate("sectionId", "name");

    if (roomConflict) {
      return res.status(409).json({
        message: `Classroom conflict: Room is already booked on ${dayOfWeek} at ${timeSlot} for ${roomConflict.sectionId?.name} by ${roomConflict.teacherId?.name}.`
      });
    }

    // 2. Conflict Check: Teacher double booking
    const teacherConflict = await TimetableAssignment.findOne({
      teacherId,
      dayOfWeek,
      timeSlot
    }).populate("sectionId", "name").populate("classroomId", "roomNumber");

    if (teacherConflict) {
      return res.status(409).json({
        message: `Teacher schedule conflict: Teacher is already taking class with ${teacherConflict.sectionId?.name} in room ${teacherConflict.classroomId?.roomNumber} at this time.`
      });
    }

    const created = await TimetableAssignment.create({
      teacherId,
      sectionId,
      departmentId: departmentId || (await Section.findById(sectionId))?.departmentId,
      classroomId,
      subjectName,
      dayOfWeek,
      timeSlot,
      slotType: slotType || "Lecture"
    });

    // Ensure teacher has section in assignedSections
    await Admin.findByIdAndUpdate(teacherId, { $addToSet: { assignedSections: sectionId } });

    await logAudit(
      req.user,
      "ALLOCATE_TIMETABLE",
      "TimetableAssignment",
      created._id,
      `Allocated ${subjectName} to section in room ${classroomId} on ${dayOfWeek} (${timeSlot})`,
      req
    );

    return res.status(201).json({ assignment: created, message: "Timetable slot allocated successfully." });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await TimetableAssignment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found." });

    await logAudit(req.user, "DELETE_TIMETABLE", "TimetableAssignment", id, `De-allocated slot for ${deleted.subjectName}`, req);
    return res.json({ message: "Timetable slot removed successfully." });
  } catch (error) {
    return next(error);
  }
}

/**
 * 12. GET /api/hierarchy/audit-logs
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { action, role, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (role) filter.role = role;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ logs });
  } catch (error) {
    return next(error);
  }
}

/**
 * 13. GET /api/hierarchy/reports
 * Comprehensive department-wise breakdown & vacancy reports
 */
export async function getReports(req, res, next) {
  try {
    const [departments, sections, teachers, classrooms, assignments] = await Promise.all([
      Department.find().populate("directorateId", "name code").populate("hodId", "name email"),
      Section.find().populate("departmentId", "name code"),
      Admin.find({ role: "teacher" }).populate("departmentId", "name code"),
      Classroom.find().populate("departmentId", "name code"),
      TimetableAssignment.find()
    ]);

    const departmentReports = departments.map((dept) => {
      const deptSecs = sections.filter((s) => String(s.departmentId?._id) === String(dept._id));
      const deptTchs = teachers.filter((t) => String(t.departmentId?._id) === String(dept._id));
      const deptRooms = classrooms.filter((c) => String(c.departmentId?._id) === String(dept._id));
      const totalStudents = deptSecs.reduce((sum, s) => sum + (s.totalStudents || 0), 0);
      const studentTeacherRatio = deptTchs.length > 0 ? (totalStudents / deptTchs.length).toFixed(1) : "N/A";

      return {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        directorate: dept.directorateId?.name || "General",
        hod: dept.hodId?.name || "Vacant",
        totalSections: deptSecs.length,
        totalTeachers: deptTchs.length,
        totalClassrooms: deptRooms.length,
        totalStudents,
        studentTeacherRatio: `${studentTeacherRatio} : 1`
      };
    });

    return res.json({ departmentReports });
  } catch (error) {
    return next(error);
  }
}
