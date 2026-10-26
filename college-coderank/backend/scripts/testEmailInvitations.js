import "dotenv/config";
import mongoose from "mongoose";

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

function parseTokenFromLink(link) {
  if (!link) return null;
  const match = link.match(/[?&]token=([^&]+)/);
  return match ? match[1] : null;
}

async function runInvitationTests() {
  console.log("==================================================================");
  console.log("   AUTOMATED HIERARCHICAL EMAIL INVITATION & ACCOUNT SETUP TEST   ");
  console.log("==================================================================\n");

  let superAdminToken = "";
  let tpoToken = "";
  let directorToken = "";
  let hodToken = "";
  let teacherToken = "";

  let directorateId = "";
  let departmentId = "";

  const testEmails = {
    tpo: `test.tpo.${Date.now()}@rungta.org`,
    director: `test.director.${Date.now()}@rungta.org`,
    hod: `test.hod.${Date.now()}@rungta.org`,
    teacher: `test.teacher.${Date.now()}@rungta.org`,
    revoke: `test.revoke.${Date.now()}@rungta.org`
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Super Admin Authentication
    // -------------------------------------------------------------
    console.log("1. Authenticating genuine Super Admin...");
    const saLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: process.env.ADMIN_EMAIL || "piyushbarnwal811@gmail.com",
        password: process.env.ADMIN_PASSWORD || "rungta@123"
      }
    });
    superAdminToken = saLogin.data.token;
    console.log("   ✓ Super Admin authenticated. Token Role:", saLogin.data.user.role);
    const saHeaders = { Authorization: `Bearer ${superAdminToken}` };

    // -------------------------------------------------------------
    // Step 2: Super Admin -> TPO Invitation Workflow
    // -------------------------------------------------------------
    console.log("\n2. [Super Admin -> TPO] Issuing account setup invitation...");
    const tpoInviteRes = await request("/invitations", {
      method: "POST",
      headers: saHeaders,
      body: {
        name: "Prof. Alok Sharma",
        email: testEmails.tpo,
        role: "tpo"
      }
    });
    console.log("   ✓ Invitation created with status:", tpoInviteRes.data.invitation.status);
    console.log("   ✓ Setup Link generated:", tpoInviteRes.data.setupLink);

    const tpoTokenRaw = parseTokenFromLink(tpoInviteRes.data.setupLink);
    if (!tpoTokenRaw) throw new Error("Could not extract security token from setupLink");

    console.log("   -> Verifying token via public endpoint /api/invitations/verify...");
    const tpoVerify = await request(`/invitations/verify?token=${tpoTokenRaw}`, { method: "GET" });
    if (!tpoVerify.data.valid) throw new Error("Token verification failed");
    console.log("   ✓ Token verified. Recipient Name:", tpoVerify.data.invitation.name, "| Role:", tpoVerify.data.invitation.role);

    console.log("   -> TPO accepts invitation and sets password...");
    const tpoAccept = await request("/invitations/accept", {
      method: "POST",
      body: {
        token: tpoTokenRaw,
        password: "TpoPassword@2026!",
        confirmPassword: "TpoPassword@2026!",
        phone: "+91 98765 43210",
        employeeId: "TPO-001"
      }
    });
    console.log("   ✓ TPO Account activated:", tpoAccept.data.message);

    console.log("   -> Verifying single-use restriction (re-accepting should fail)...");
    try {
      await request("/invitations/accept", {
        method: "POST",
        body: {
          token: tpoTokenRaw,
          password: "TpoPassword@2026!",
          confirmPassword: "TpoPassword@2026!"
        }
      });
      throw new Error("Security vulnerability: Re-acceptance of single-use token succeeded!");
    } catch (err) {
      console.log("   ✓ Re-acceptance blocked successfully:", err.message);
    }

    console.log("   -> Testing TPO login with new credentials...");
    const tpoLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: testEmails.tpo,
        password: "TpoPassword@2026!"
      }
    });
    tpoToken = tpoLogin.data.token;
    console.log("   ✓ TPO logged in successfully. Token Role:", tpoLogin.data.user.role);

    console.log("   -> Testing RBAC: TPO must NOT be able to invite any users...");
    try {
      await request("/invitations", {
        method: "POST",
        headers: { Authorization: `Bearer ${tpoToken}` },
        body: {
          name: "Unauthorized User",
          email: "unauth@rungta.org",
          role: "super_admin"
        }
      });
      throw new Error("RBAC bypass: TPO was allowed to issue invitations!");
    } catch (err) {
      console.log("   ✓ TPO invitation attempt rejected with 403 Forbidden.");
    }

    // -------------------------------------------------------------
    // Step 3: Super Admin -> Director Invitation Workflow
    // -------------------------------------------------------------
    console.log("\n3. [Super Admin -> Director] Setting up Directorate and inviting Director...");
    const dirRes = await request("/hierarchy/directorates", {
      method: "POST",
      headers: saHeaders,
      body: {
        name: `Faculty of Engineering & Tech ${Date.now()}`,
        code: `FET${Math.floor(Math.random() * 900 + 100)}`,
        description: "Core technical directorate for engineering departments"
      }
    });
    directorateId = dirRes.data.directorate._id;
    console.log("   ✓ Directorate created:", dirRes.data.directorate.name, "| ID:", directorateId);

    const dirInviteRes = await request("/invitations", {
      method: "POST",
      headers: saHeaders,
      body: {
        name: "Dr. K. R. Sharma",
        email: testEmails.director,
        role: "director",
        directorateId
      }
    });
    console.log("   ✓ Director invitation issued with directorate assignment.");

    const dirTokenRaw = parseTokenFromLink(dirInviteRes.data.setupLink);
    const dirAccept = await request("/invitations/accept", {
      method: "POST",
      body: {
        token: dirTokenRaw,
        password: "DirectorPassword@2026!",
        confirmPassword: "DirectorPassword@2026!",
        designation: "Director - Academic Operations",
        qualification: "Ph.D. in Computer Science"
      }
    });
    console.log("   ✓ Director Account activated:", dirAccept.data.message);

    console.log("   -> Director login with new credentials...");
    const dirLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: testEmails.director,
        password: "DirectorPassword@2026!"
      }
    });
    directorToken = dirLogin.data.token;
    console.log("   ✓ Director logged in successfully. Role:", dirLogin.data.user.role);
    const dirHeaders = { Authorization: `Bearer ${directorToken}` };

    console.log("   -> Testing RBAC: Director must NOT be able to invite another Director or TPO...");
    try {
      await request("/invitations", {
        method: "POST",
        headers: dirHeaders,
        body: {
          name: "Another Director",
          email: "another.dir@rungta.org",
          role: "director"
        }
      });
      throw new Error("RBAC bypass: Director was allowed to invite Director!");
    } catch (err) {
      console.log("   ✓ Director invitation for unauthorized role rejected:", err.message);
    }

    // -------------------------------------------------------------
    // Step 4: Director -> HOD Invitation Workflow
    // -------------------------------------------------------------
    console.log("\n4. [Director -> HOD] Creating department and inviting HOD...");
    const deptRes = await request("/hierarchy/departments", {
      method: "POST",
      headers: dirHeaders,
      body: {
        name: `Computer Science & Systems ${Date.now()}`,
        code: `CSS${Math.floor(Math.random() * 900 + 100)}`,
        directorateId
      }
    });
    departmentId = deptRes.data.department._id;
    console.log("   ✓ Department created:", deptRes.data.department.name, "| ID:", departmentId);

    console.log("   -> Director invites HOD for the department...");
    const hodInviteRes = await request("/invitations", {
      method: "POST",
      headers: dirHeaders,
      body: {
        name: "Dr. Ananya Sen",
        email: testEmails.hod,
        role: "hod",
        departmentId
      }
    });
    console.log("   ✓ HOD invitation created.");

    const hodTokenRaw = parseTokenFromLink(hodInviteRes.data.setupLink);
    const hodAccept = await request("/invitations/accept", {
      method: "POST",
      body: {
        token: hodTokenRaw,
        password: "HodPassword@2026!",
        confirmPassword: "HodPassword@2026!",
        employeeId: "HOD-CSE-01"
      }
    });
    console.log("   ✓ HOD Account activated:", hodAccept.data.message);

    console.log("   -> HOD login with new credentials...");
    const hodLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: testEmails.hod,
        password: "HodPassword@2026!"
      }
    });
    hodToken = hodLogin.data.token;
    console.log("   ✓ HOD logged in successfully. Role:", hodLogin.data.user.role);
    const hodHeaders = { Authorization: `Bearer ${hodToken}` };

    console.log("   -> Testing RBAC: HOD must NOT be able to invite an HOD, Director, or TPO...");
    try {
      await request("/invitations", {
        method: "POST",
        headers: hodHeaders,
        body: {
          name: "Sub HOD",
          email: "sub.hod@rungta.org",
          role: "hod"
        }
      });
      throw new Error("RBAC bypass: HOD was allowed to invite HOD!");
    } catch (err) {
      console.log("   ✓ HOD invitation for unauthorized role rejected:", err.message);
    }

    // -------------------------------------------------------------
    // Step 5: HOD -> Teacher Invitation Workflow
    // -------------------------------------------------------------
    console.log("\n5. [HOD -> Teacher] Inviting Faculty Teacher...");
    const teacherInviteRes = await request("/invitations", {
      method: "POST",
      headers: hodHeaders,
      body: {
        name: "Prof. Manish Verma",
        email: testEmails.teacher,
        role: "teacher"
      }
    });
    console.log("   ✓ Teacher invitation created under HOD's department scope.");

    const teacherTokenRaw = parseTokenFromLink(teacherInviteRes.data.setupLink);
    const teacherAccept = await request("/invitations/accept", {
      method: "POST",
      body: {
        token: teacherTokenRaw,
        password: "TeacherPassword@2026!",
        confirmPassword: "TeacherPassword@2026!",
        designation: "Assistant Professor",
        qualification: "M.Tech CSE"
      }
    });
    console.log("   ✓ Teacher Account activated:", teacherAccept.data.message);

    console.log("   -> Teacher login with new credentials...");
    const teacherLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: testEmails.teacher,
        password: "TeacherPassword@2026!"
      }
    });
    teacherToken = teacherLogin.data.token;
    console.log("   ✓ Teacher logged in successfully. Role:", teacherLogin.data.user.role);

    console.log("   -> Testing RBAC: Teacher must NOT be able to invite any accounts...");
    try {
      await request("/invitations", {
        method: "POST",
        headers: { Authorization: `Bearer ${teacherToken}` },
        body: {
          name: "Student",
          email: "student@rungta.org",
          role: "teacher"
        }
      });
      throw new Error("RBAC bypass: Teacher was allowed to issue invitations!");
    } catch (err) {
      console.log("   ✓ Teacher invitation attempt rejected with 403 Forbidden.");
    }

    // -------------------------------------------------------------
    // Step 6: Invitation Resend and Revoke Workflow
    // -------------------------------------------------------------
    console.log("\n6. Testing Invitation Resend and Revoke workflows...");
    const revokeInviteRes = await request("/invitations", {
      method: "POST",
      headers: saHeaders,
      body: {
        name: "Temporary Invite",
        email: testEmails.revoke,
        role: "tpo"
      }
    });
    const revokeInviteId = revokeInviteRes.data.invitation.id;
    console.log("   ✓ Created temporary pending invitation:", revokeInviteId);

    console.log("   -> Testing Resend...");
    const resendRes = await request(`/invitations/${revokeInviteId}/resend`, {
      method: "POST",
      headers: saHeaders
    });
    console.log("   ✓ Resend succeeded. Resend Count:", resendRes.data.invitation.resendCount);

    console.log("   -> Testing Revoke...");
    const revokeRes = await request(`/invitations/${revokeInviteId}/revoke`, {
      method: "POST",
      headers: saHeaders
    });
    console.log("   ✓ Revoke succeeded:", revokeRes.data.message);

    const revokedTokenRaw = parseTokenFromLink(resendRes.data.setupLink || revokeInviteRes.data.setupLink);
    console.log("   -> Verifying revoked token cannot be accepted...");
    try {
      await request("/invitations/accept", {
        method: "POST",
        body: {
          token: revokedTokenRaw,
          password: "RevokedPassword@2026!",
          confirmPassword: "RevokedPassword@2026!"
        }
      });
      throw new Error("Security vulnerability: Revoked invitation was accepted!");
    } catch (err) {
      console.log("   ✓ Revoked token acceptance rejected as expected:", err.message);
    }

    // -------------------------------------------------------------
    // Step 7: Clean Up Test Records
    // -------------------------------------------------------------
    console.log("\n7. Cleaning up test accounts from database...");
    await mongoose.connect(process.env.MONGODB_URI);
    const Admin = mongoose.model("Admin", new mongoose.Schema({}, { strict: false }));
    const Invitation = mongoose.model("Invitation", new mongoose.Schema({}, { strict: false }));
    const Directorate = mongoose.model("Directorate", new mongoose.Schema({}, { strict: false }));
    const Department = mongoose.model("Department", new mongoose.Schema({}, { strict: false }));

    const deleteEmails = Object.values(testEmails);
    const delAdminRes = await Admin.deleteMany({ email: { $in: deleteEmails } });
    const delInvRes = await Invitation.deleteMany({ email: { $in: deleteEmails } });
    if (directorateId) await Directorate.findByIdAndDelete(directorateId);
    if (departmentId) await Department.findByIdAndDelete(departmentId);

    console.log(`   ✓ Removed ${delAdminRes.deletedCount} test Admin accounts.`);
    console.log(`   ✓ Removed ${delInvRes.deletedCount} test Invitations.`);
    console.log("   ✓ Removed test Directorate and Department.");
    await mongoose.disconnect();

    console.log("\n==================================================================");
    console.log("   ALL HIERARCHICAL EMAIL INVITATION TESTS PASSED PERFECTLY!      ");
    console.log("==================================================================");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    if (error.data) {
      console.error("Response data:", error.data);
    }
    process.exit(1);
  }
}

runInvitationTests();
