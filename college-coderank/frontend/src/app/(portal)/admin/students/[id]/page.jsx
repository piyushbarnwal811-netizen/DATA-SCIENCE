"use client";

import ProtectedRoute from "../../../../../components/ProtectedRoute.jsx";
import AdminStudentProfile from "../../../../../views/AdminStudentProfile.jsx";

export default function AdminStudentProfilePage() {
  return (
    <ProtectedRoute role="admin">
      <AdminStudentProfile />
    </ProtectedRoute>
  );
}
