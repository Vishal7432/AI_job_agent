import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import profileRoutes from "./routes/profile.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  if (err.type === "entity.parse.failed") {
    console.error("Invalid JSON request body");
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  console.error(err);
  res.status(status).json({ error: err.message });
});

await connectDB();
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`),
);
