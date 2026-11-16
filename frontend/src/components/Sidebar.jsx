import { useEffect, useState } from "react";
import {
  Briefcase,
  LayoutDashboard,
  Zap,
  Star,
  BarChart3,
  Settings,
  SlidersHorizontal,
  Rocket,
} from "lucide-react";
import { api } from "../api/client";

const ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs and queue", icon: Briefcase },
  { id: "automation", label: "Automation", icon: Zap },
  { id: "settings-jobs", label: "Job settings", icon: SlidersHorizontal },
  { id: "profile", label: "Skills and profile", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  const [name, setName] = useState("");

  useEffect(() => {
    api("/profile")
      .then((p) => setName(p?.fullName || ""))
      .catch(() => {});
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Briefcase size={20} />
        </div>
        <div>
          <div className="brand-name">AI Job Agent</div>
          <div className="brand-sub">Apply · Track · Grow</div>
        </div>
      </div>

      <nav>
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? "active" : ""}`}
            onClick={() => setPage(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="promo">
        <Rocket size={26} />
        <p>Let AI find better opportunities for you</p>
        <button className="btn-primary" onClick={() => setPage("automation")}>
          Run automation
        </button>
      </div>

      <div className="user">
        <div className="avatar">{(name || "U").slice(0, 1).toUpperCase()}</div>
        <div className="user-name">{name || "User"}</div>
      </div>
    </aside>
  );
}
