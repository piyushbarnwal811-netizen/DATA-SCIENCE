import Link from "next/link";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";

export const metadata = {
  title: "404 Page Not Found — College CodeRank",
  description: "The requested page or dossier could not be found.",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f4f2f1",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#fff",
          padding: "40px 32px",
          borderRadius: 20,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
          border: "1px solid #eee9e7",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: 14,
            borderRadius: 16,
            background: "rgba(237, 87, 88, 0.1)",
            color: "#ed5758",
            marginBottom: 20,
          }}
        >
          <Compass size={36} />
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 10px",
            color: "#302d2d",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          404 · Page Not Found
        </h1>
        <p
          style={{
            color: "#8d8988",
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          The page or student dossier you are looking for does not exist on Rungta Portal or may have been moved.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <Link
            href="/home"
            className="button button--red"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#ed5758",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} /> Campus Home
          </Link>
          <Link
            href="/leaderboard"
            className="button button--white"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#fff",
              color: "#302d2d",
              border: "1px solid #eee9e7",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
