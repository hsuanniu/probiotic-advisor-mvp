import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./db/database.js";
import { productRoutes } from "./routes/productRoutes.js";
import { strainRoutes } from "./routes/strainRoutes.js";
import { recommendationRoutes } from "./routes/recommendationRoutes.js";
import { profileRoutes } from "./routes/profileRoutes.js";
import { favoriteRoutes } from "./routes/favoriteRoutes.js";
import { dashboardRoutes } from "./routes/dashboardRoutes.js";
import { journeyRoutes } from "./routes/journeyRoutes.js";
import { DISCLAIMER } from "./utils/disclaimer.js";

initializeDatabase();

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", disclaimer: DISCLAIMER });
});

app.use("/api/products", productRoutes);
app.use("/api/strains", strainRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/journeys", journeyRoutes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error", detail: err.message });
});
