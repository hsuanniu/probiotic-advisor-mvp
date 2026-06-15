import { db, parseJsonField } from "../db/database.js";

function normalizeFavorite(row) {
  return {
    ...row,
    item_meta: parseJsonField(row.item_meta, {})
  };
}

export function getFavorites() {
  return db.prepare("SELECT * FROM favorites WHERE user_id = 1 ORDER BY id DESC").all().map(normalizeFavorite);
}

export function createFavorite(favorite) {
  db.prepare(`
    INSERT OR IGNORE INTO favorites (user_id, item_type, item_id, item_name, item_meta)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    1,
    favorite.item_type,
    Number(favorite.item_id),
    favorite.item_name,
    JSON.stringify(favorite.item_meta || {})
  );

  return getFavorites().find((item) => item.item_type === favorite.item_type && item.item_id === Number(favorite.item_id));
}

export function deleteFavorite(id) {
  return db.prepare("DELETE FROM favorites WHERE id = ? AND user_id = 1").run(id);
}

export function deleteFavoriteByItem(itemType, itemId) {
  return db.prepare("DELETE FROM favorites WHERE user_id = 1 AND item_type = ? AND item_id = ?").run(itemType, Number(itemId));
}
