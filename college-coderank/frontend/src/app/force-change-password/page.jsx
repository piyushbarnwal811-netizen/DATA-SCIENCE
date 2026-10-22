import { Suspense } from "react";
import ForceChangePassword from "../../views/ForceChangePassword.jsx";
import Loader from "../../components/Loader.jsx";

export const metadata = {
  title: "Mandatory Password Change — College CodeRank | Rungta University",
  description: "Mandatory first-time password change for newly onboarded students.",
};

export default function ForceChangePasswordPage() {
  return (
    <Suspense fallback={<Loader label="Loading security check..." />}>
      <ForceChangePassword />
    </Suspense>
  );
}
