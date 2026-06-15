import express from "express";
import {
  createFavorite,
  deleteFavorite,
  deleteFavoriteByItem,
  getFavorites
} from "../repositories/favoriteRepository.js";

export const favoriteRoutes = express.Router();

favoriteRoutes.get("/", (_req, res) => {
  res.json(getFavorites());
});

favoriteRoutes.post("/", (req, res) => {
  res.status(201).json(createFavorite(req.body));
});

favoriteRoutes.delete("/item/:itemType/:itemId", (req, res) => {
  deleteFavoriteByItem(req.params.itemType, req.params.itemId);
  res.status(204).send();
});

favoriteRoutes.delete("/:id", (req, res) => {
  deleteFavorite(req.params.id);
  res.status(204).send();
});
