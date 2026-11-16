import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Automation from "./pages/Automation";

const PAGES = { dashboard: Dashboard, jobs: Jobs, automation: Automation };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const Page = PAGES[page];

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        {Page ? (
          <Page go={setPage} />
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
