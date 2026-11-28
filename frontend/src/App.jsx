import { useEffect, useState } from "react";
import "./app.css";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Automation from "./pages/Automation";
import ResumeLab from "./pages/ResumeLab";

const PAGES = { dashboard: Dashboard, jobs: Jobs, automation: Automation };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [jobsInitialTab, setJobsInitialTab] = useState("queue");
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const PAGES = {
    dashboard: Dashboard,
    jobs: Jobs,
    automation: Automation,
    resume: ResumeLab,
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const Page = PAGES[page];
  const go = (nextPage, jobsTab = "queue") => {
    if (nextPage === "jobs") setJobsInitialTab(jobsTab);
    setPage(nextPage);
  };

  return (
    <div className="shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <main className={`main ${page === "jobs" ? "jobs-page-shell" : ""}`}>
        <TopBar
          query={query}
          setQuery={setQuery}
          onSearch={() => go("jobs", query.trim() ? "jobs" : "queue")}
          onBell={() => go("jobs")}
          onMenu={() => setMobileMenuOpen(true)}
          menuOpen={mobileMenuOpen}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
        {Page ? (
          <Page go={go} query={query} initialTab={jobsInitialTab} />
        ) : (
          <>
            <h1 className="page-title">Coming soon</h1>
            <p className="muted">Ye page aage ke step mein banega.</p>
          </>
        )}
      </main>
    </div>
  );
}
