import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import profileRoutes from "./routes/profile.routes.js";
import jobRoutes from "./routes/job.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

await connectDB();
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`),
);
