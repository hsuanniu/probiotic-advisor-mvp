import express from "express";
import {
  createCheckin,
  createDailyLog,
  createJourney,
  getJourneyById,
  getJourneys,
  updateReminder
} from "../repositories/journeyRepository.js";

export const journeyRoutes = express.Router();

journeyRoutes.get("/", (_req, res) => {
  res.json(getJourneys());
});

journeyRoutes.get("/:id", (req, res) => {
  const journey = getJourneyById(req.params.id);
  if (!journey) return res.status(404).json({ message: "Journey not found" });
  return res.json(journey);
});

journeyRoutes.post("/", (req, res) => {
  res.status(201).json(createJourney(req.body));
});

journeyRoutes.post("/:id/checkins", (req, res) => {
  const journey = getJourneyById(req.params.id);
  if (!journey) return res.status(404).json({ message: "Journey not found" });
  if (Number(req.body.checkpoint_day) > journey.current_day) {
    return res.status(400).json({ message: `Day ${req.body.checkpoint_day} check-in is not available yet` });
  }
  res.status(201).json(createCheckin(req.params.id, req.body));
});

journeyRoutes.post("/:id/daily-logs", (req, res) => {
  const journey = createDailyLog(req.params.id, req.body);
  if (!journey) return res.status(404).json({ message: "Journey not found" });
  return res.status(201).json(journey);
});

journeyRoutes.put("/reminders/:id", (req, res) => {
  const reminder = updateReminder(req.params.id, req.body);
  if (!reminder) return res.status(404).json({ message: "Reminder not found" });
  return res.json(reminder);
});
