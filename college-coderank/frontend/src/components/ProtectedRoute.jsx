"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

const STAFF_ROLES = ["super_admin", "admin", "tpo", "director", "hod", "teacher"];

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isRoleAllowed = (allowedRole, userRole) => {
    if (!allowedRole) return true;
    if (userRole === "super_admin") return true; // Super admin has access to all admin/staff modules
    const uRole = userRole === "admin" ? "super_admin" : userRole;
    if (Array.isArray(allowedRole)) {
      return (
        allowedRole.includes(userRole) ||
        allowedRole.includes(uRole) ||
        (allowedRole.includes("admin") && (userRole === "admin" || userRole === "super_admin")) ||
        (allowedRole.includes("staff") && STAFF_ROLES.includes(uRole))
      );
    }
    if (allowedRole === "staff") return STAFF_ROLES.includes(uRole);
    if (allowedRole === "admin") return userRole === "admin" || userRole === "super_admin";
    return userRole === allowedRole || uRole === allowedRole;
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      } else if ((user.must_change_password || user.mustChangePassword) && pathname !== "/force-change-password") {
        router.replace("/force-change-password");
      } else if (role && !isRoleAllowed(role, user.role)) {
        router.replace(STAFF_ROLES.includes(user.role) ? "/hierarchy" : "/profile");
      }
    }
  }, [user, loading, role, router, pathname]);

  if (loading) {
    return <Loader label="Checking your account..." />;
  }

  if (
    !user ||
    ((user.must_change_password || user.mustChangePassword) && pathname !== "/force-change-password") ||
    (role && !isRoleAllowed(role, user.role))
  ) {
    return <Loader label="Redirecting..." />;
  }

  return children;
}

