import { Suspense } from "react";
import ForgotPassword from "../../views/ForgotPassword.jsx";
import Loader from "../../components/Loader.jsx";

export const metadata = {
  title: "Forgot Password — College CodeRank | Rungta University",
  description: "Recover your College CodeRank student portal account via email verification.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<Loader label="Loading recovery portal..." />}>
      <ForgotPassword />
    </Suspense>
  );
}
