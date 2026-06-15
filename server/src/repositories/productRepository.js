import { db, parseJsonField, stringifyJsonField } from "../db/database.js";

function normalizeProduct(row) {
  return {
    ...row,
    main_needs: parseJsonField(row.main_needs),
    strains: parseJsonField(row.strains),
    price: Number(row.price)
  };
}

export function getAllProducts() {
  return db.prepare("SELECT * FROM products ORDER BY id DESC").all().map(normalizeProduct);
}

export function getProductById(id) {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return row ? normalizeProduct(row) : null;
}

export function createProduct(product) {
  const result = db
    .prepare(`
      INSERT INTO products (
        brand_name, product_name, target_group, main_needs, strains,
        cfu_per_serving, dosage_form, usage_instruction, warnings, price, product_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      product.brand_name,
      product.product_name,
      product.target_group,
      stringifyJsonField(product.main_needs),
      stringifyJsonField(product.strains),
      product.cfu_per_serving,
      product.dosage_form,
      product.usage_instruction,
      product.warnings,
      Number(product.price || 0),
      product.product_url || ""
    );

  return getProductById(result.lastInsertRowid);
}

export function updateProduct(id, product) {
  db.prepare(`
    UPDATE products
    SET brand_name = ?, product_name = ?, target_group = ?, main_needs = ?, strains = ?,
        cfu_per_serving = ?, dosage_form = ?, usage_instruction = ?, warnings = ?,
        price = ?, product_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    product.brand_name,
    product.product_name,
    product.target_group,
    stringifyJsonField(product.main_needs),
    stringifyJsonField(product.strains),
    product.cfu_per_serving,
    product.dosage_form,
    product.usage_instruction,
    product.warnings,
    Number(product.price || 0),
    product.product_url || "",
    id
  );

  return getProductById(id);
}

export function deleteProduct(id) {
  return db.prepare("DELETE FROM products WHERE id = ?").run(id);
}
