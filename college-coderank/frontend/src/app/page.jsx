"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import WelcomeSplash from "../components/WelcomeSplash.jsx";
import Loader from "../components/Loader.jsx";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loader label="Loading Rungta Portal..." />;
  }

  if (user) {
    return <Loader label="Entering campus..." />;
  }

  return <WelcomeSplash />;
}
