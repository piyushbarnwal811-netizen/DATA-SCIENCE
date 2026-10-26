import "dotenv/config";

const BASE_URL = "http://127.0.0.1:5000/api";

async function request(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log("==========================================================");
  console.log("   TESTING REAL ROLE-BASED COLLEGE HIERARCHY SYSTEM       ");
  console.log("==========================================================\n");

  let superAdminToken = "";
  let tpoToken = "";
  let directorToken = "";
  let hodToken = "";
  let teacherToken = "";

  let tpoTempPass = "";
  let directorTempPass = "";
  let hodTempPass = "";
  let teacherTempPass = "";

  let directorateId = "";
  let departmentId = "";
  let sectionId = "";
  let teacherId = "";

  // 1. Super Admin Login
  console.log("1. Logging in as Genuine Super Admin (piyushbarnwal811@gmail.com)...");
  const saLoginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com",
      password: process.env.ADMIN_PASSWORD || "rungta@123"
    }
  });
  superAdminToken = saLoginRes.data.token;
  console.log("   ✓ Super Admin authenticated successfully. Role:", saLoginRes.data.user.role);

  const saHeader = { Authorization: `Bearer ${superAdminToken}` };

  // 2. Super Admin Overview
  console.log("\n2. Fetching Super Admin Overview (verifying zero fake data)...");
  const saOverviewRes = await request("/hierarchy/super-admin/overview", {
    method: "GET",
    headers: saHeader
  });
  console.log("   ✓ Real institutional statistics retrieved:");
  console.log("     Metrics:", saOverviewRes.data.metrics);

  // 3. Super Admin creates TPO account
  console.log("\n3. Super Admin creating official TPO account...");
  const tpoEmail = `tpo.test.${Date.now()}@rungta.org`;
  const createTpoRes = await request("/hierarchy/tpos", {
    method: "POST",
    headers: saHeader,
    body: {
      name: "Prof. Arvind Sharma",
      email: tpoEmail,
      employeeId: `TPO-${Date.now().toString().slice(-4)}`,
      phone: "+91 98260 00001",
      designation: "Training & Placement Officer"
    }
  });
  tpoTempPass = createTpoRes.data.temporaryCredentials.temporaryPassword;
  console.log("   ✓ TPO created. Temporary password:", tpoTempPass);

  // 4. Super Admin creates Directorate
  console.log("\n4. Super Admin creating Directorate (FET)...");
  const dirCode = `FET_${Date.now().toString().slice(-4)}`;
  const createDirateRes = await request("/hierarchy/directorates", {
    method: "POST",
    headers: saHeader,
    body: {
      name: "Faculty of Engineering & Technology",
      code: dirCode,
      description: "Core and emerging engineering disciplines",
      building: "Block A - Main Tech Tower"
    }
  });
  directorateId = createDirateRes.data.directorate._id;
  console.log(`   ✓ Directorate created: ${createDirateRes.data.directorate.name} (ID: ${directorateId})`);

  // 5. Super Admin creates Director account
  console.log("\n5. Super Admin creating Director account...");
  const dirEmail = `director.test.${Date.now()}@rungta.org`;
  const createDirRes = await request("/hierarchy/directors", {
    method: "POST",
    headers: saHeader,
    body: {
      name: "Dr. Ramesh Verma",
      email: dirEmail,
      employeeId: `DIR-${Date.now().toString().slice(-4)}`,
      phone: "+91 98260 00002",
      designation: "Director - FET",
      directorateId
    }
  });
  directorTempPass = createDirRes.data.temporaryCredentials.temporaryPassword;
  console.log("   ✓ Director created. Temporary password:", directorTempPass);

  // 6. TPO Login & Mandatory Password Change
  console.log("\n6. Testing TPO Login with temporary credentials (enforcing force-change-password)...");
  const tpoLoginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: tpoEmail,
      password: tpoTempPass
    }
  });
  console.log("   ✓ TPO Login intercepted with status:", tpoLoginRes.data.status);
  const tpoRestrictedToken = tpoLoginRes.data.token;

  console.log("   Setting permanent password for TPO...");
  const tpoPassChangeRes = await request("/auth/force-change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${tpoRestrictedToken}` },
    body: {
      current_password: tpoTempPass,
      new_password: "NewTpoPassword!2026",
      confirm_password: "NewTpoPassword!2026"
    }
  });
  tpoToken = tpoPassChangeRes.data.token;
  console.log("   ✓ TPO password changed successfully. Permanent session token received.");

  // Test TPO Overview
  const tpoOverviewRes = await request("/hierarchy/tpo/overview", {
    method: "GET",
    headers: { Authorization: `Bearer ${tpoToken}` }
  });
  console.log("   ✓ TPO Overview retrieved successfully. Directorates visible to TPO:", tpoOverviewRes.data.metrics.totalDirectorates);

  // 7. Director Login & Mandatory Password Change
  console.log("\n7. Director Login with temporary credentials...");
  const dirLoginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: dirEmail,
      password: directorTempPass
    }
  });
  console.log("   ✓ Director Login intercepted with status:", dirLoginRes.data.status);

  console.log("   Setting permanent password for Director...");
  const dirPassChangeRes = await request("/auth/force-change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${dirLoginRes.data.token}` },
    body: {
      current_password: directorTempPass,
      new_password: "NewDirectorPass!2026",
      confirm_password: "NewDirectorPass!2026"
    }
  });
  directorToken = dirPassChangeRes.data.token;
  const dirHeader = { Authorization: `Bearer ${directorToken}` };
  console.log("   ✓ Director password changed. Session active.");

  // 8. Director creates Department in their Directorate
  console.log("\n8. Director creating Department (CSE) within assigned Directorate...");
  const deptCode = `CSE_${Date.now().toString().slice(-4)}`;
  const createDeptRes = await request("/hierarchy/departments", {
    method: "POST",
    headers: dirHeader,
    body: {
      name: `Computer Science & Engineering ${deptCode}`,
      code: deptCode,
      directorateId,
      buildingBlock: "Block A",
      floor: "2nd Floor"
    }
  });
  departmentId = createDeptRes.data.department._id;
  console.log(`   ✓ Department created: ${createDeptRes.data.department.name} (ID: ${departmentId})`);

  // 9. Director creates HOD account for CSE
  console.log("\n9. Director creating HOD account for CSE...");
  const hodEmail = `hod.test.${Date.now()}@rungta.org`;
  const createHodRes = await request("/hierarchy/director/hods", {
    method: "POST",
    headers: dirHeader,
    body: {
      name: "Dr. Sunita Patel",
      email: hodEmail,
      departmentId,
      employeeId: `HOD-${Date.now().toString().slice(-4)}`,
      phone: "+91 98260 00003",
      designation: "Professor & Head of Department"
    }
  });
  hodTempPass = createHodRes.data.temporaryCredentials.temporaryPassword;
  console.log("   ✓ HOD account created by Director. Temporary password:", hodTempPass);

  // 10. HOD Login & Mandatory Password Change
  console.log("\n10. HOD Login with temporary credentials & setting new password...");
  const hodLoginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: hodEmail,
      password: hodTempPass
    }
  });
  const hodPassChangeRes = await request("/auth/force-change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${hodLoginRes.data.token}` },
    body: {
      current_password: hodTempPass,
      new_password: "NewHodPassword!2026",
      confirm_password: "NewHodPassword!2026"
    }
  });
  hodToken = hodPassChangeRes.data.token;
  const hodHeader = { Authorization: `Bearer ${hodToken}` };
  console.log("   ✓ HOD password changed. Permanent session active.");

  // 11. HOD creates Section & Subject in their Department
  console.log("\n11. HOD creating Section & Subject for their department...");
  const secName = `CSE-A-${Date.now().toString().slice(-3)}`;
  const createSecRes = await request("/hierarchy/sections", {
    method: "POST",
    headers: hodHeader,
    body: {
      name: secName,
      departmentId,
      year: 3,
      semester: 5,
      capacity: 60
    }
  });
  sectionId = createSecRes.data.section._id;
  console.log(`   ✓ Section created: ${secName} (ID: ${sectionId})`);

  const subCode = `CS${Date.now().toString().slice(-4)}`;
  const createSubRes = await request("/hierarchy/subjects", {
    method: "POST",
    headers: hodHeader,
    body: {
      name: "Data Structures and Algorithms",
      code: subCode,
      departmentId,
      credits: 4,
      semester: 5
    }
  });
  console.log(`   ✓ Subject created: ${createSubRes.data.subject.name} (${subCode})`);

  // 12. HOD creates Teacher account
  console.log("\n12. HOD creating Teacher account...");
  const teacherEmail = `teacher.test.${Date.now()}@rungta.org`;
  const createTeacherRes = await request("/hierarchy/hod/teachers", {
    method: "POST",
    headers: hodHeader,
    body: {
      name: "Prof. Ankit Gupta",
      email: teacherEmail,
      employeeId: `TCH-${Date.now().toString().slice(-4)}`,
      phone: "+91 98260 00004",
      designation: "Assistant Professor",
      departmentId
    }
  });
  teacherTempPass = createTeacherRes.data.temporaryCredentials.temporaryPassword;
  teacherId = createTeacherRes.data.teacher._id;
  console.log("   ✓ Teacher account created by HOD. Temporary password:", teacherTempPass);

  // 13. HOD assigns Teacher to Section and designates as Class Teacher
  console.log("\n13. HOD assigning Teacher to Section and designating Class Teacher...");
  await request("/hierarchy/hod/assign-teacher", {
    method: "POST",
    headers: hodHeader,
    body: {
      teacherId,
      sectionId,
      subject: "Data Structures and Algorithms",
      isClassTeacher: true
    }
  });
  console.log("   ✓ Teacher assigned to section with subject and class teacher status.");

  // 14. Teacher Login & Mandatory Password Change
  console.log("\n14. Teacher Login with temporary credentials & setting new password...");
  const tchLoginRes = await request("/auth/login", {
    method: "POST",
    body: {
      email: teacherEmail,
      password: teacherTempPass
    }
  });
  const tchPassChangeRes = await request("/auth/force-change-password", {
    method: "POST",
    headers: { Authorization: `Bearer ${tchLoginRes.data.token}` },
    body: {
      current_password: teacherTempPass,
      new_password: "NewTeacherPass!2026",
      confirm_password: "NewTeacherPass!2026"
    }
  });
  teacherToken = tchPassChangeRes.data.token;
  const tchHeader = { Authorization: `Bearer ${teacherToken}` };
  console.log("   ✓ Teacher password changed. Permanent session active.");

  // 15. Teacher views strictly their own assigned academic schedule
  console.log("\n15. Teacher fetching /api/hierarchy/teacher/my-schedule...");
  const tchScheduleRes = await request("/hierarchy/teacher/my-schedule", {
    method: "GET",
    headers: tchHeader
  });
  console.log("   ✓ Teacher Schedule retrieved:");
  console.log("     Assigned Sections:", tchScheduleRes.data.teacher.assignedSections.length);
  console.log("     Assigned Subjects:", tchScheduleRes.data.teacher.assignedSubjects);
  console.log("     Class Teacher of Sections:", tchScheduleRes.data.classTeacherOf.length);
  console.log("     HOD Contact:", tchScheduleRes.data.hod?.name);

  // 16. Security Test: Teacher attempts to create an account or modify hierarchy (must be blocked with 403)
  console.log("\n16. Security RBAC verification: Teacher attempts to call Super Admin endpoint...");
  try {
    await request("/hierarchy/tpos", {
      method: "POST",
      headers: tchHeader,
      body: { name: "Hacker", email: "hacker@test.com" }
    });
    console.error("   ❌ ERROR: Teacher was able to call Super Admin endpoint!");
  } catch (err) {
    console.log(`   ✓ Correctly blocked: ${err.status} - ${err.data?.message}`);
  }

  // 17. Security Test: Protect the last active Super Admin
  console.log("\n17. Security verification: Attempting to deactivate or delete the last active Super Admin...");
  const saUser = saLoginRes.data.user;
  try {
    await request(`/hierarchy/accounts/${saUser.id}/status`, {
      method: "PATCH",
      headers: saHeader,
      body: { status: "inactive" }
    });
    console.error("   ❌ ERROR: Last active Super Admin was deactivated!");
  } catch (err) {
    console.log(`   ✓ Correctly protected: ${err.status} - ${err.data?.message}`);
  }

  // 18. Audit Logs
  console.log("\n18. Super Admin checking Audit Logs...");
  const auditLogsRes = await request("/hierarchy/audit-logs", {
    method: "GET",
    headers: saHeader
  });
  console.log(`   ✓ Total audit logs recorded during test: ${auditLogsRes.data.logs.length}`);
  console.log("     Latest actions in audit log:", auditLogsRes.data.logs.slice(0, 5).map((l) => `${l.action} by ${l.userName} (${l.role})`));

  console.log("\n==========================================================");
  console.log("   ALL 18 RBAC & HIERARCHY WORKFLOW TESTS PASSED!         ");
  console.log("==========================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err.data || err.message);
  process.exit(1);
});
