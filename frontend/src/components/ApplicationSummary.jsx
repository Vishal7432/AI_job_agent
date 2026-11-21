import { useRef, useState } from "react";
import { TrendingUp, Trophy } from "lucide-react";
import { api } from "../api/client";
import Donut from "./Donut";

const fetchSummary = (period) =>
  api(`/stats/summary?period=${encodeURIComponent(period)}`);

export default function ApplicationSummary({ initialSummary }) {
  const [period, setPeriod] = useState("30d");
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);
  const { counts } = summary;
  const decided = counts.approved + counts.applied + counts.rejected;
  const rate = decided
    ? Math.round(((counts.approved + counts.applied) / decided) * 100)
    : 0;

  const updateSummary = async (nextPeriod = period) => {
    setPeriod(nextPeriod);
    setLoading(true);
    setError(null);
    const requestId = ++latestRequest.current;

    try {
      const result = await fetchSummary(nextPeriod);
      if (requestId === latestRequest.current) setSummary(result);
    } catch (e) {
      if (requestId === latestRequest.current) setError(e.message);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  return (
    <div className="panel application-summary">
      <div className="panel-heading">
        <h2>Application summary</h2>
        <label className="period-control">
          <span className="sr-only">Application summary time period</span>
          <select
            value={period}
            onChange={(event) => updateSummary(event.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </div>
      <div className="summary" aria-busy={loading}>
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
      {loading && (
        <p className="summary-status" role="status">
          Updating summary...
        </p>
      )}
      {error && (
        <p className="msg error" role="alert">
          Summary load nahi hua: {error}{" "}
          <button onClick={() => updateSummary()}>Retry</button>
        </p>
      )}
      <div className="progress-card">
        <span className="progress-trophy" aria-hidden="true">
          <Trophy size={20} />
        </span>
        <div className="progress-copy">
          <strong>Great Progress!</strong>
          <span>
            {decided > 0
              ? `You have ${decided} application decisions in this period. Keep it up!`
              : "Start applying to see your progress here."}
          </span>
        </div>
        <span className="progress-trend" aria-hidden="true">
          <TrendingUp size={21} />
        </span>
      </div>
    </div>
  );
}
