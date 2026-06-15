import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "../utils/loadEnv.js";

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.resolve(__dirname, "../../data/probiotic-advisor.sqlite");
const databasePath = path.resolve(process.cwd(), process.env.DATABASE_PATH || defaultDbPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec("PRAGMA journal_mode = WAL");

export function initializeDatabase() {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);

  const logColumns = db.prepare("PRAGMA table_info(recommendation_logs)").all().map((column) => column.name);
  const migrations = [
    ["gut_health_score", "INTEGER"],
    ["plan_level", "TEXT"],
    ["primary_goal", "TEXT"]
  ];
  migrations.forEach(([name, type]) => {
    if (!logColumns.includes(name)) {
      db.exec(`ALTER TABLE recommendation_logs ADD COLUMN ${name} ${type}`);
    }
  });

  const ensureColumns = (tableName, columns) => {
    const existing = db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
    columns.forEach(([name, definition]) => {
      if (!existing.includes(name)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
      }
    });
  };

  ensureColumns("health_journeys", [
    ["target_days", "INTEGER NOT NULL DEFAULT 90"],
    ["product_days", "INTEGER NOT NULL DEFAULT 30"]
  ]);
  ensureColumns("journey_checkins", [
    ["user_id", "INTEGER NOT NULL DEFAULT 1"],
    ["bowel_score", "INTEGER"],
    ["bloating_score", "INTEGER"],
    ["sleep_stress_score", "INTEGER"],
    ["overall_score", "INTEGER"]
  ]);
  ensureColumns("reminder_states", [
    ["user_id", "INTEGER NOT NULL DEFAULT 1"],
    ["scheduled_date", "TEXT"]
  ]);
}

export function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function stringifyJsonField(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}
