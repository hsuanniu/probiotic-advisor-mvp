import { db, parseJsonField, stringifyJsonField } from "../db/database.js";

function normalizeProfile(row) {
  return {
    ...row,
    health_needs: parseJsonField(row.health_needs)
  };
}

export function ensureDefaultProfile() {
  const existing = db.prepare("SELECT * FROM user_profiles WHERE id = 1").get();
  if (existing) return normalizeProfile(existing);

  db.prepare(`
    INSERT INTO user_profiles (
      id, display_name, age, gender, health_needs, diet_habits, health_goals
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    "Demo User",
    35,
    "不指定",
    stringifyJsonField(["日常腸胃保養"]),
    "外食頻率中等，作息偶爾不固定",
    "建立日常保養與益生菌產品選擇參考"
  );

  return getProfile();
}

export function getProfile() {
  const row = db.prepare("SELECT * FROM user_profiles WHERE id = 1").get();
  return row ? normalizeProfile(row) : ensureDefaultProfile();
}

export function updateProfile(profile) {
  ensureDefaultProfile();
  db.prepare(`
    UPDATE user_profiles
    SET display_name = ?, age = ?, gender = ?, health_needs = ?,
        diet_habits = ?, health_goals = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    profile.display_name || "Demo User",
    Number(profile.age || 0),
    profile.gender || "不指定",
    stringifyJsonField(profile.health_needs),
    profile.diet_habits || "",
    profile.health_goals || ""
  );

  return getProfile();
}
