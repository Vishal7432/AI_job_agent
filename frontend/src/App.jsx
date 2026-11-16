import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Automation from "./pages/Automation";

const PAGES = { dashboard: Dashboard, jobs: Jobs, automation: Automation };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const Page = PAGES[page];

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <TopBar
          query={query}
          setQuery={setQuery}
          onSearch={() => setPage("jobs")}
          onBell={() => setPage("jobs")}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
        {Page ? (
          <Page go={setPage} query={query} />
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
