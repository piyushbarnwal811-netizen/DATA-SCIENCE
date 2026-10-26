import { Suspense } from "react";
import SetupAccount from "../../views/SetupAccount.jsx";
import Loader from "../../components/Loader.jsx";

export const metadata = {
  title: "Official Account Setup — College CodeRank | Rungta University",
  description: "Set up and activate your official university faculty or administrative account.",
};

export default function SetupAccountPage() {
  return (
    <Suspense fallback={<Loader label="Validating official invitation..." />}>
      <SetupAccount />
    </Suspense>
  );
}
