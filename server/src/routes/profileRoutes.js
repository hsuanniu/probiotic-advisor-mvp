import express from "express";
import { getProfile, updateProfile } from "../repositories/profileRepository.js";

export const profileRoutes = express.Router();

profileRoutes.get("/", (_req, res) => {
  res.json(getProfile());
});

profileRoutes.put("/", (req, res) => {
  res.json(updateProfile(req.body));
});
