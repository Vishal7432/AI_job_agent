import { useEffect, useState } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import Donut from "../components/Donut";

const LABEL = {
  applied: "Applied",
  approved: "Approved",
  rejected: "Rejected",
};

function timeAgo(date) {
  const mins = Math.round((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day ago`;
}

export default function Dashboard({ go }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/stats")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return <div className="msg error">Stats load nahi hue: {error}</div>;
  if (!data) return <p className="muted">Loading...</p>;

  const { counts, scoredJobs, recent, topMatches } = data;
  const decided = counts.approved + counts.applied + counts.rejected;
  const rate = decided
    ? Math.round(((counts.approved + counts.applied) / decided) * 100)
    : 0;

  let heroText =
    "Abhi koi job queue mein nahi hai. Automation page se Discover aur Score chalao.";
  if (counts.pending > 0)
    heroText = `${counts.pending} jobs tumhare approval ka wait kar rahi hain.`;
  else if (scoredJobs > 0)
    heroText = `${scoredJobs} scored jobs ready hain. Unhe queue mein daalke approve karo.`;

  return (
    <>
      <section className="hero">
        <h1>Your AI Job Agent is working for you</h1>
        <p>
          {heroText} Final apply tum khud karoge, taaki accounts safe rahein.
        </p>
        <button className="btn-primary" onClick={() => go("jobs")}>
          Open approval queue <ArrowRight size={16} />
        </button>
      </section>

      <section className="stats">
        <StatCard
          icon={Send}
          tone="violet"
          value={counts.applied}
          label="Applied"
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          value={counts.approved}
          label="Approved"
        />
        <StatCard
          icon={XCircle}
          tone="red"
          value={counts.rejected}
          label="Rejected"
        />
        <StatCard
          icon={Hourglass}
          tone="blue"
          value={counts.pending}
          label="Waiting for approval"
        />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>Recent activity</h2>
          {recent.length === 0 && (
            <p className="muted">Abhi koi activity nahi.</p>
          )}
          {recent.map((a) => (
            <div className="activity" key={a._id}>
              <div>
                <div className="activity-title">{a.job?.title}</div>
                <div className="muted small">
                  {a.job?.company} · {timeAgo(a.updatedAt)}
                </div>
              </div>
              <span className={`pill ${a.status}`}>
                {LABEL[a.status] || a.status}
              </span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Application summary</h2>
          <div className="summary">
            <Donut
              label={`${rate}%`}
              sub="Approval rate"
              segments={[
                { label: "Applied", value: counts.applied, color: "#5b3fd9" },
                { label: "Approved", value: counts.approved, color: "#22c55e" },
                { label: "Rejected", value: counts.rejected, color: "#ef4444" },
              ]}
            />
            <ul className="legend">
              <li>
                <i style={{ background: "#5b3fd9" }} />
                Applied <b>{counts.applied}</b>
              </li>
              <li>
                <i style={{ background: "#22c55e" }} />
                Approved <b>{counts.approved}</b>
              </li>
              <li>
                <i style={{ background: "#ef4444" }} />
                Rejected <b>{counts.rejected}</b>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Top job matches</h2>
        {topMatches.length === 0 && (
          <p className="muted">Pehle jobs score karo.</p>
        )}
        <div className="matches">
          {topMatches.map((j) => (
            <a
              className="match"
              key={j._id}
              href={j.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="match-title">{j.title}</div>
              <div className="muted small">
                {j.company} · {j.location || "n/a"}
              </div>
              <span className="pill applied">{j.matchScore}% match</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
