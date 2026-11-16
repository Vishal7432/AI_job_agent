import { useEffect, useState } from "react";
import { api, patch } from "../api/client";
import JobCard from "../components/JobCard";
import { useAction } from "../hooks/useAction";

const QUEUE_FILTERS = ["pending_approval", "approved", "applied", "rejected"];

export default function Jobs() {
  const [tab, setTab] = useState("queue");
  const [queueFilter, setQueueFilter] = useState("pending_approval");
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const refresh = async () => {
    try {
      setLoadError(null);
      if (tab === "jobs") setJobs(await api("/jobs?status=scored&sort=score"));
      else setApps(await api(`/applications?status=${queueFilter}`));
    } catch (e) {
      setLoadError(e.message);
    }
  };

  const { msg, busy, run } = useAction(refresh);

  useEffect(() => {
    refresh();
  }, [tab, queueFilter]);

  return (
    <>
      <h1 className="page-title">Jobs and queue</h1>
      {loadError && <div className="msg error">{loadError}</div>}
      {msg && (
        <div className={`msg ${msg.type === "error" ? "error" : ""}`}>
          {msg.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={tab === "queue" ? "active" : ""}
          onClick={() => setTab("queue")}
        >
          Approval queue
        </button>
        <button
          className={tab === "jobs" ? "active" : ""}
          onClick={() => setTab("jobs")}
        >
          Scored jobs
        </button>
      </div>

      {tab === "jobs" && (
        <>
          {jobs.length === 0 && (
            <p className="muted">Abhi koi scored job nahi.</p>
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
            <p className="muted">Is status mein koi application nahi.</p>
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
                  className="btn-primary"
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
              <span className="pill">{a.status.replace("_", " ")}</span>
            </JobCard>
          ))}
        </>
      )}
    </>
  );
}
