import { Medal } from "lucide-react";

export default function RankBadge({ rank }) {
  if (rank > 3) return <span className="rank-number">#{rank}</span>;
  return (
    <span className={`rank-medal rank-medal--${rank}`} aria-label={`Rank ${rank}`}>
      <Medal size={17} strokeWidth={2.2} />
      <span>{rank}</span>
    </span>
  );
}