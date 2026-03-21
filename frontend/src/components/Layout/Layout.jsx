import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen } from "lucide-react";
import Squares from "../Background/Squares";
import "./Layout.css";

const navClass = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

export function Layout() {
  const location = useLocation();
  const isMarket = location.pathname === "/marketplace";

  return (
    <div className="app-container">
      <div className="background-wrapper">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222222"
        />
      </div>
      <nav className="top-nav glass-panel">
        <div className="nav-brand">
          <div className="logo-orb"></div>
          <span className="brand-name">NEVORAX</span>
          <span className="brand-badge-v4 mono">BUILT_FOR_WDK_HACKATHON</span>
        </div>

        <div className="nav-links">
          <div className="nav-item active">
            {isMarket ? <BookOpen size={18} /> : <LayoutDashboard size={18} />}
            <span>{isMarket ? "Agent Ecosystem" : "Intelligence Console"}</span>
          </div>
        </div>

        <div className="nav-actions">
          <div className="project-nav glass-panel-v4 mono">
            <span className="label-mini">NAVIGATION:</span>
            <NavLink to="/" className="nav-util-btn">CONSOLE</NavLink>
            <span className="separator">|</span>
            <NavLink to="/marketplace" className="nav-util-btn">MARKET</NavLink>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
