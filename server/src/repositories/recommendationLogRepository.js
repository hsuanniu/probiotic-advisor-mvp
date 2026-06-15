import { db, parseJsonField, stringifyJsonField } from "../db/database.js";

export function createRecommendationLog(log) {
  const result = db
    .prepare(`
      INSERT INTO recommendation_logs (
        user_type, age, gender, target_group, needs, lifestyle, special_conditions,
        recommended_strains, recommended_products, confidence_score,
        gut_health_score, plan_level, primary_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      log.user_type,
      Number(log.age || 0),
      log.gender || "",
      log.target_group || "",
      stringifyJsonField(log.needs),
      log.lifestyle || "",
      stringifyJsonField(log.special_conditions),
      stringifyJsonField(log.recommended_strains),
      stringifyJsonField(log.recommended_products),
      Number(log.confidence_score || 0),
      Number(log.gut_health_score || 0),
      log.plan_level || "",
      log.primary_goal || ""
    );

  return result.lastInsertRowid;
}

function normalizeLog(row) {
  return {
    ...row,
    needs: parseJsonField(row.needs),
    special_conditions: parseJsonField(row.special_conditions),
    recommended_strains: parseJsonField(row.recommended_strains),
    recommended_products: parseJsonField(row.recommended_products),
    confidence_score: Number(row.confidence_score),
    gut_health_score: Number(row.gut_health_score || 0)
  };
}

export function getRecommendationLogs(limit = 20) {
  return db
    .prepare("SELECT * FROM recommendation_logs ORDER BY id DESC LIMIT ?")
    .all(Number(limit))
    .map(normalizeLog);
}

function countItems(logs, field) {
  const counts = new Map();
  logs.forEach((log) => {
    (log[field] || []).forEach((item) => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function getDashboardStats() {
  const logs = getRecommendationLogs(100);
  return {
    recent_logs: logs.slice(0, 6),
    popular_needs: countItems(logs, "needs"),
    common_conditions: countItems(logs, "special_conditions"),
    top_strains: countItems(logs, "recommended_strains"),
    total_analyses: logs.length,
    average_confidence: logs.length
      ? Math.round(logs.reduce((sum, log) => sum + log.confidence_score, 0) / logs.length)
      : 0,
    average_health_score: logs.length
      ? Math.round(logs.reduce((sum, log) => sum + (log.gut_health_score || log.confidence_score), 0) / logs.length)
      : 0
  };
}
