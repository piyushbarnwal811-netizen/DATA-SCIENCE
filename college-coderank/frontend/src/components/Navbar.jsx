"use client";

import { Bell, LogOut, Menu, Search, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import { getInitials } from "../utils/helpers.js";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const signOut = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu size={21} />
        </button>
        <Link href={user ? "/home" : "/"} className="brand" title="College CodeRank — Presented by Data Science Club, Rungta International Skills University">
          <span className="brand__mark">
            <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
          </span>
          <div className="brand__text-group">
            <span className="brand__text">College<span>CodeRank</span></span>
            <span className="brand__college">Rungta International Skills University</span>
            <span className="brand__dsc-tag">
              <span className="brand__dsc-dot" /> Presented by <strong>DATA SCIENCE CLUB</strong>
            </span>
          </div>
        </Link>
        <label className="topbar-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search the leaderboard..."
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                router.push(`/leaderboard?search=${encodeURIComponent(event.currentTarget.value)}`);
              }
            }}
          />
          <kbd>↵</kbd>
        </label>
        <div className="topbar__actions">
          <div className="topbar-dsc-badge" title="Official initiative presented by Data Science Club">
            <Sparkles size={13} className="topbar-dsc-badge__icon" />
            <span>Presented by <strong>Data Science Club</strong></span>
          </div>
          {["super_admin", "admin", "tpo", "director", "hod", "teacher"].includes(user?.role) && (
            <Link
              href="/hierarchy"
              className={`topbar-tour-btn ${pathname === "/hierarchy" ? "opacity-100 ring-2 ring-white/50" : ""}`}
              title="College Hierarchical Management System"
            >
              🏛️ Hierarchy
            </Link>
          )}
          <Link href="/welcome" className="topbar-tour-btn" title="Watch Rungta University Campus Welcome">
            <span className="tour-live-dot" /> Campus Intro
          </Link>
          <button className="icon-button topbar-notice" aria-label="Notifications"><Bell size={19} /></button>
          {user ? (
            <div className="account-menu">
              <Link
                href={
                  ["super_admin", "admin", "tpo", "director", "hod", "teacher"].includes(user.role)
                    ? "/hierarchy"
                    : "/profile"
                }
                className={`avatar ${(pathname === "/admin" || pathname === "/profile" || pathname === "/hierarchy") ? "is-active" : ""}`}
                aria-label="Open profile"
              >
                {getInitials(user.name)}
              </Link>
              <div className="account-menu__info">
                <strong>{user.name}</strong>
                <span>
                  {["super_admin", "admin"].includes(user.role)
                    ? "Super Admin"
                    : user.role === "tpo"
                    ? "TPO Head"
                    : user.role === "director"
                    ? "Director"
                    : user.role === "hod"
                    ? "HOD"
                    : user.role === "teacher"
                    ? "Teacher"
                    : "Student"}
                </span>
              </div>
              <button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
            </div>
          ) : (
            <Link href="/login" className="topbar-login"><UserRound size={17} /> Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}