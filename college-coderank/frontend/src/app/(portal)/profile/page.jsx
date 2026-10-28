"use client";

import ProtectedRoute from "../../../components/ProtectedRoute.jsx";
import Profile from "../../../views/Profile.jsx";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  );
}
