"use client";

import ProtectedRoute from "../../../components/ProtectedRoute.jsx";
import HierarchyDashboard from "../../../views/HierarchyDashboard.jsx";

export default function HierarchyPage() {
  return (
    <ProtectedRoute role={["super_admin", "admin", "tpo", "director", "hod", "teacher"]}>
      <HierarchyDashboard />
    </ProtectedRoute>
  );
}
