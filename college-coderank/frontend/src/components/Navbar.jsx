import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getInitials } from "../utils/helpers.js";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={onMenuClick}>
          <Menu size={21} />
        </button>
        <Link to={user ? "/home" : "/"} className="brand" title="College CodeRank — Rungta International Skills University">
          <span className="brand__mark">
            <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
          </span>
          <div className="brand__text-group">
            <span className="brand__text">College<span>CodeRank</span></span>
            <span className="brand__college">Rungta International Skills University</span>
          </div>
        </Link>
        <label className="topbar-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search the leaderboard..."
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate(`/leaderboard?search=${encodeURIComponent(event.currentTarget.value)}`);
            }}
          />
          <kbd>↵</kbd>
        </label>
        <div className="topbar__actions">
          <Link to="/welcome" className="topbar-tour-btn" title="Watch Rungta University Campus Welcome">
            <span className="tour-live-dot" /> Campus Intro
          </Link>
          <button className="icon-button topbar-notice" aria-label="Notifications"><Bell size={19} /></button>
          {user ? (
            <div className="account-menu">
              <NavLink to={user.role === "admin" ? "/admin" : "/profile"} className="avatar" aria-label="Open profile">
                {getInitials(user.name)}
              </NavLink>
              <div className="account-menu__info"><strong>{user.name}</strong><span>{user.role === "admin" ? "Administrator" : "Student"}</span></div>
              <button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
            </div>
          ) : (
            <Link to="/login" className="topbar-login"><UserRound size={17} /> Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}