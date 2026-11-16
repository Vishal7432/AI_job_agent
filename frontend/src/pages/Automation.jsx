import { post } from "../api/client";
import { useAction } from "../hooks/useAction";

export default function Automation() {
  const { msg, busy, run } = useAction();

  return (
    <>
      <h1 className="page-title">Automation</h1>
      <p className="muted">
        Ye teen steps order mein chalao: Discover, Score, phir Queue.
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
          className="btn-primary"
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
    </>
  );
}
