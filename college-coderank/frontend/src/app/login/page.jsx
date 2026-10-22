import { Suspense } from "react";
import Login from "../../views/Login.jsx";
import Loader from "../../components/Loader.jsx";

export const metadata = {
  title: "Sign In — College CodeRank | Rungta University",
  description: "Sign in to your student or campus administrator account on College CodeRank.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader label="Loading sign in..." />}>
      <Login />
    </Suspense>
  );
}
