import { useEffect, useState } from "react";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { api } from "../api/client";

export default function TopBar({
  query,
  setQuery,
  onSearch,
  theme,
  toggleTheme,
  onBell,
}) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const load = () =>
      api("/stats")
        .then((d) => setPending(d.counts.pending))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="topbar">
      <div className="search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search jobs, companies…"
          aria-label="Search jobs and companies"
        />
      </div>

      <div className="top-actions">
        <button
          className="icon-btn"
          onClick={onBell}
          aria-label="Pending approvals"
        >
          <Bell size={20} />
          {pending > 0 && <span className="dot" />}
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
