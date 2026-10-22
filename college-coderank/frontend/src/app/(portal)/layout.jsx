"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Home as HomeIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Video
} from "lucide-react";
import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const STAFF_ROLES = ["super_admin", "admin", "tpo", "director", "hod", "teacher"];

export default function PortalLayout({ children }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const links = [
    { href: "/home", label: "Home", icon: HomeIcon },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ...(isStaff
      ? [
          { href: "/hierarchy", label: "College Hierarchy", icon: Layers },
          ...(isAdmin ? [{ href: "/admin", label: "Admin dashboard", icon: ShieldCheck }] : [])
        ]
      : user
      ? [{ href: "/profile", label: "My profile", icon: UserRound }]
      : [])
  ];

  const isLinkActive = (href) => {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <>
      <Navbar onMenuClick={() => setMenuOpen(!menuOpen)} />
      <div className={`portal-grid ${menuOpen ? "portal-grid--menu-open" : ""}`}>
        <aside className="left-rail">
          <section className="campus-card">
            <div className="campus-card__cover">
              <span className="campus-symbol" title="Rungta International Skills University">
                <img src="/college_logo.png" alt="Rungta University Logo" className="campus-symbol__logo" />
              </span>
            </div>
            <div className="campus-card__body">
              <strong>{user?.name || "Rungta International Skills University"}</strong>
              <span>
                {user
                  ? isStaff
                    ? `${user.designation || user.role.toUpperCase()}`
                    : `${user.branch} · Section ${user.section}`
                  : "RISU Coding Community"}
              </span>
              <div className="campus-card__dsc-badge">
                <Sparkles size={11} /> Presented by <strong>Data Science Club</strong>
              </div>
              <small>{user?.email || "Rungta International Skills University"}</small>
            </div>
          </section>

          <nav className="side-nav" aria-label="Main navigation">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`side-nav__link ${isLinkActive(href) ? "is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                className={`side-nav__link ${pathname === "/login" ? "is-active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <UserRound size={18} />
                <span>Sign in</span>
              </Link>
            )}
            <Link
              href="/welcome"
              className={`side-nav__link ${pathname === "/welcome" ? "is-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <Video size={18} />
              <span>Campus Intro</span>
            </Link>
          </nav>

          <div className="side-note">
            <span className="side-note__icon"><Activity size={16} /></span>
            <strong>Consistency compounds.</strong>
            <p>One focused session today is a win.</p>
          </div>

          <div className="left-rail__bottom">
            <span><Sparkles size={13} /> Presented by Data Science Club</span>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Community <ArrowUpRight size={13} />
            </a>
          </div>
        </aside>

        <main className="main-content" key={pathname}>
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
