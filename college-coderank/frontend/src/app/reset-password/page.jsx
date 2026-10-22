import { Suspense } from "react";
import ResetPassword from "../../views/ResetPassword.jsx";
import Loader from "../../components/Loader.jsx";

export const metadata = {
  title: "Reset Password — College CodeRank | Rungta University",
  description: "Set a new secure password for your student coding portal account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader label="Loading security token..." />}>
      <ResetPassword />
    </Suspense>
  );
}
