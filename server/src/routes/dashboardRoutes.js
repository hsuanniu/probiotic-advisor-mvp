import express from "express";
import { getDashboardStats, getRecommendationLogs } from "../repositories/recommendationLogRepository.js";

export const dashboardRoutes = express.Router();

dashboardRoutes.get("/", (_req, res) => {
  res.json(getDashboardStats());
});

dashboardRoutes.get("/logs", (req, res) => {
  res.json(getRecommendationLogs(req.query.limit || 30));
});
