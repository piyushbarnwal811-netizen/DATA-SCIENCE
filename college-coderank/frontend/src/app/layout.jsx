import "../index.css";
import { AuthProvider } from "../context/AuthContext.jsx";

export const metadata = {
  title: "College CodeRank — Rungta International Skills University",
  description:
    "Official Campus Coding Intelligence Portal presented by Data Science Club. Real-time algorithmic performance tracking across LeetCode, CodeChef, GeeksforGeeks, GitHub & HackerRank.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/college_logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ed5758",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
