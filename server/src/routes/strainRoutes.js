import express from "express";
import {
  createStrain,
  deleteStrain,
  getAllStrains,
  updateStrain
} from "../repositories/strainRepository.js";

export const strainRoutes = express.Router();

strainRoutes.get("/", (_req, res) => {
  res.json(getAllStrains());
});

strainRoutes.post("/", (req, res) => {
  const strain = createStrain(req.body);
  res.status(201).json(strain);
});

strainRoutes.put("/:id", (req, res) => {
  const strain = updateStrain(req.params.id, req.body);
  if (!strain) return res.status(404).json({ message: "Strain not found" });
  return res.json(strain);
});

strainRoutes.delete("/:id", (req, res) => {
  deleteStrain(req.params.id);
  res.status(204).send();
});
