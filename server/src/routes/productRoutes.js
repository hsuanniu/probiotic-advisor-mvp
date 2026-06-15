import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct
} from "../repositories/productRepository.js";

export const productRoutes = express.Router();

productRoutes.get("/", (_req, res) => {
  res.json(getAllProducts());
});

productRoutes.post("/", (req, res) => {
  const product = createProduct(req.body);
  res.status(201).json(product);
});

productRoutes.put("/:id", (req, res) => {
  const product = updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ message: "Product not found" });
  return res.json(product);
});

productRoutes.delete("/:id", (req, res) => {
  deleteProduct(req.params.id);
  res.status(204).send();
});
