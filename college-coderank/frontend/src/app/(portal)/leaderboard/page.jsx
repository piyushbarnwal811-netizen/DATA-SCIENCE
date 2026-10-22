import { Suspense } from "react";
import Leaderboard from "../../../views/Leaderboard.jsx";
import Loader from "../../../components/Loader.jsx";

export const metadata = {
  title: "Leaderboard — College CodeRank | Rungta University",
  description: "Live competitive programming intelligence rankings across LeetCode, CodeChef, GeeksforGeeks, GitHub & HackerRank.",
};

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<Loader label="Compiling leaderboard intelligence..." />}>
      <Leaderboard />
    </Suspense>
  );
}
