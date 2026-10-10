import { useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Activity, ArrowUpRight, BookOpen, CircleHelp, Home as HomeIcon, ShieldCheck, Trophy, UserRound, Users, Video } from "lucide-react";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminStudentProfile from "./pages/AdminStudentProfile.jsx";
import Home from "./pages/Home.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";
import WelcomeSplash from "./components/WelcomeSplash.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader label="Checking your account..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/profile"} replace />;
  return <Outlet />;
}

function PortalLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const links = isAdmin
    ? [{ to: "/home", label: "Home", icon: HomeIcon }, { to: "/leaderboard", label: "Leaderboard", icon: Trophy }, { to: "/admin", label: "Admin dashboard", icon: ShieldCheck }]
    : [{ to: "/home", label: "Home", icon: HomeIcon }, { to: "/leaderboard", label: "Leaderboard", icon: Trophy }, ...(user ? [{ to: "/profile", label: "My profile", icon: UserRound }] : [])];

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
              <span>{user ? user.role === "admin" ? "Campus Administrator" : `${user.branch} · Section ${user.section}` : "RISU Coding Community"}</span>
              <small>{user?.email || "Rungta International Skills University"}</small>
            </div>
          </section>
          <nav className="side-nav" aria-label="Main navigation">
            {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/home"} className={({ isActive }) => `side-nav__link ${isActive ? "is-active" : ""}`} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
            {!user && <NavLink to="/login" className={({ isActive }) => `side-nav__link ${isActive ? "is-active" : ""}`}><UserRound size={18} /><span>Sign in</span></NavLink>}
            <NavLink to="/welcome" className={({ isActive }) => `side-nav__link ${isActive ? "is-active" : ""}`}><Video size={18} /><span>Campus Intro</span></NavLink>
          </nav>
          <div className="side-note"><span className="side-note__icon"><Activity size={16} /></span><strong>Consistency compounds.</strong><p>One focused session today is a win.</p></div>
          <div className="left-rail__bottom"><span><BookOpen size={15} /> Built for your coding journey</span><a href="https://github.com" target="_blank" rel="noreferrer">Community <ArrowUpRight size={13} /></a></div>
        </aside>
        <main className="main-content" key={location.pathname}><Outlet /></main>
      </div>
      <Footer />
    </>
  );
}

function Code2Mark() {
  return <img src="/college_logo.png" alt="Rungta University Logo" className="campus-symbol__logo" />;
}

function RootEntry() {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Loading Rungta Portal..." />;
  if (user) return <Navigate to="/home" replace />;
  return <WelcomeSplash />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootEntry />} />
      <Route path="/welcome" element={<WelcomeSplash />} />
      <Route element={<PortalLayout />}>
        <Route path="home" element={<Home />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/students/:id" element={<AdminStudentProfile />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}