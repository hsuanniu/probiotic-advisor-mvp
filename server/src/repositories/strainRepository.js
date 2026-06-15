import { db, parseJsonField, stringifyJsonField } from "../db/database.js";

function normalizeStrain(row) {
  return {
    ...row,
    application_areas: parseJsonField(row.application_areas),
    suggested_cfu_min: Number(row.suggested_cfu_min),
    suggested_cfu_max: Number(row.suggested_cfu_max)
  };
}

export function getAllStrains() {
  return db.prepare("SELECT * FROM strains ORDER BY id DESC").all().map(normalizeStrain);
}

export function getStrainById(id) {
  const row = db.prepare("SELECT * FROM strains WHERE id = ?").get(id);
  return row ? normalizeStrain(row) : null;
}

export function createStrain(strain) {
  const result = db
    .prepare(`
      INSERT INTO strains (
        strain_name, strain_code, application_areas, suggested_cfu_min,
        suggested_cfu_max, target_group, warnings, evidence_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      strain.strain_name,
      strain.strain_code || "",
      stringifyJsonField(strain.application_areas),
      Number(strain.suggested_cfu_min || 0),
      Number(strain.suggested_cfu_max || 0),
      strain.target_group,
      strain.warnings,
      strain.evidence_notes || ""
    );

  return getStrainById(result.lastInsertRowid);
}

export function updateStrain(id, strain) {
  db.prepare(`
    UPDATE strains
    SET strain_name = ?, strain_code = ?, application_areas = ?, suggested_cfu_min = ?,
        suggested_cfu_max = ?, target_group = ?, warnings = ?, evidence_notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    strain.strain_name,
    strain.strain_code || "",
    stringifyJsonField(strain.application_areas),
    Number(strain.suggested_cfu_min || 0),
    Number(strain.suggested_cfu_max || 0),
    strain.target_group,
    strain.warnings,
    strain.evidence_notes || "",
    id
  );

  return getStrainById(id);
}

export function deleteStrain(id) {
  return db.prepare("DELETE FROM strains WHERE id = ?").run(id);
}
