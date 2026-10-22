"use client";

import ProtectedRoute from "../../../components/ProtectedRoute.jsx";
import AdminDashboard from "../../../views/AdminDashboard.jsx";

export default function AdminPage() {
  return (
    <ProtectedRoute role="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
