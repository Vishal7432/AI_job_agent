import { useEffect, useState } from "react";
import "./App.css";
import { api, post, patch } from "./api/client";
import JobCard from "./components/JobCard";

const QUEUE_FILTERS = ["pending_approval", "approved", "applied", "rejected"];

export default function App() {
  const [tab, setTab] = useState("jobs");
  const [queueFilter, setQueueFilter] = useState("pending_approval");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      if (tab === "jobs") setJobs(await api("/jobs?status=scored&sort=score"));
      else setApps(await api(`/applications?status=${queueFilter}`));
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };

  useEffect(() => {
    refresh();
  }, [tab, queueFilter]);

  // Har button ka kaam yahin se chalta hai (loading + message ek jagah)
  const run = async (label, fn) => {
    setBusy(true);
    setMsg({ type: "info", text: `${label}... thoda wait karo` });
    try {
      const result = await fn();
      setMsg({ type: "info", text: `${label}: ${JSON.stringify(result)}` });
      await refresh();
    } catch (e) {
      setMsg({ type: "error", text: `${label} fail: ${e.message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <h1>AI Job Agent</h1>
      <p className="sub">
        Discover → Score → Approve → Apply (final submit tum khud karoge)
      </p>

      <div className="toolbar">
        <button
          disabled={busy}
          onClick={() => run("Discover", () => post("/jobs/discover"))}
        >
          1. Discover jobs
        </button>
        <button
          disabled={busy}
          onClick={() => run("Score", () => post("/jobs/score?limit=300"))}
        >
          2. Score jobs
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={() => run("Queue", () => post("/applications/queue"))}
        >
          3. Scored jobs ko queue mein daalo
        </button>
      </div>

      {msg && (
        <div className={`msg ${msg.type === "error" ? "error" : ""}`}>
          {msg.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={tab === "jobs" ? "active" : ""}
          onClick={() => setTab("jobs")}
        >
          Scored jobs
        </button>
        <button
          className={tab === "queue" ? "active" : ""}
          onClick={() => setTab("queue")}
        >
          Approval queue
        </button>
      </div>

      {tab === "jobs" && (
        <>
          {jobs.length === 0 && (
            <p className="sub">
              Abhi koi scored job nahi. Upar se Discover aur Score chalao.
            </p>
          )}
          {jobs.map((j) => (
            <JobCard key={j._id} job={j} />
          ))}
        </>
      )}

      {tab === "queue" && (
        <>
          <div className="tabs">
            {QUEUE_FILTERS.map((s) => (
              <button
                key={s}
                className={queueFilter === s ? "active" : ""}
                onClick={() => setQueueFilter(s)}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          {apps.length === 0 && (
            <p className="sub">Is status mein koi application nahi.</p>
          )}

          {apps.map((a) => (
            <JobCard key={a._id} job={a.job}>
              {a.status === "pending_approval" && (
                <>
                  <button
                    className="good"
                    disabled={busy}
                    onClick={() =>
                      run("Approve", () =>
                        patch(`/applications/${a._id}/approve`),
                      )
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="bad"
                    disabled={busy}
                    onClick={() =>
                      run("Reject", () =>
                        patch(`/applications/${a._id}/reject`),
                      )
                    }
                  >
                    Reject
                  </button>
                </>
              )}
              {a.status === "approved" && (
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    run("Mark applied", () =>
                      patch(`/applications/${a._id}/applied`),
                    )
                  }
                >
                  Maine apply kar diya
                </button>
              )}
              <span className="badge">{a.status}</span>
            </JobCard>
          ))}
        </>
      )}
    </div>
  );
}
