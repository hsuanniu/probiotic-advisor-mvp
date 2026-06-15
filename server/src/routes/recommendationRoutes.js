import express from "express";
import { getAllProducts } from "../repositories/productRepository.js";
import { getAllStrains } from "../repositories/strainRepository.js";
import { createRecommendationLog } from "../repositories/recommendationLogRepository.js";
import { buildRecommendation } from "../services/recommendationEngine.js";
import { generateRecommendationCopy } from "../services/openaiRecommendationService.js";

export const recommendationRoutes = express.Router();

recommendationRoutes.post("/", async (req, res) => {
  const products = getAllProducts();
  const strains = getAllStrains();
  const recommendation = buildRecommendation(req.body, products, strains);
  const generatedCopy = await generateRecommendationCopy(recommendation);

  recommendation.sales_talk = generatedCopy.sales_talk;
  recommendation.consumer_summary = generatedCopy.consumer_summary;

  const recommendationLogId = createRecommendationLog({
    ...req.body,
    recommended_strains: recommendation.recommended_strain_names,
    recommended_products: recommendation.recommended_products.map((product) => product.product_name),
    confidence_score: recommendation.confidence_score,
    gut_health_score: recommendation.gut_health_score,
    plan_level: recommendation.plan_recommendation.level,
    primary_goal: req.body.primary_goal
  });

  recommendation.recommendation_log_id = Number(recommendationLogId);

  res.json(recommendation);
});
