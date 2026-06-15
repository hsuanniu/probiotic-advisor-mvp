import { useEffect, useState } from "react";
import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";

const emptyProduct = {
  brand_name: "",
  product_name: "",
  target_group: "成人",
  main_needs: [],
  strains: [],
  cfu_per_serving: "",
  dosage_form: "粉包",
  usage_instruction: "",
  warnings: "",
  price: 0,
  product_url: ""
};

function csvToArray(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function ProductAdminPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    setProducts(await api.getProducts());
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (editingId) {
      await api.updateProduct(editingId, form);
    } else {
      await api.createProduct(form);
    }
    setForm(emptyProduct);
    setEditingId(null);
    await load();
  }

  function edit(product) {
    setEditingId(product.id);
    setForm(product);
  }

  async function remove(id) {
    await api.deleteProduct(id);
    await load();
  }

  async function favorite(product) {
    await api.createFavorite({
      item_type: "product",
      item_id: product.id,
      item_name: product.product_name,
      item_meta: { summary: `${product.brand_name} · ${product.main_needs.join("、")}` }
    });
    setMessage(`已收藏：${product.product_name}`);
    setTimeout(() => setMessage(""), 1800);
  }

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Product Database</p>
          <h2>產品管理</h2>
          <p>維護產品族群、主打需求、菌種組合與食用參考資訊，作為推薦引擎的產品資料來源。</p>
        </div>
        {message && <span className="success-pill">{message}</span>}
      </section>

      <form className="admin-form" onSubmit={submit}>
        <FormField label="品牌名稱"><input value={form.brand_name} onChange={(event) => update("brand_name", event.target.value)} required /></FormField>
        <FormField label="產品名稱"><input value={form.product_name} onChange={(event) => update("product_name", event.target.value)} required /></FormField>
        <FormField label="適用族群"><input value={form.target_group} onChange={(event) => update("target_group", event.target.value)} required /></FormField>
        <FormField label="主打需求，逗號分隔"><input value={form.main_needs.join(", ")} onChange={(event) => update("main_needs", csvToArray(event.target.value))} /></FormField>
        <FormField label="菌種，逗號分隔"><input value={form.strains.join(", ")} onChange={(event) => update("strains", csvToArray(event.target.value))} /></FormField>
        <FormField label="每份 CFU"><input value={form.cfu_per_serving} onChange={(event) => update("cfu_per_serving", event.target.value)} required /></FormField>
        <FormField label="劑型"><input value={form.dosage_form} onChange={(event) => update("dosage_form", event.target.value)} required /></FormField>
        <FormField label="建議食用方式"><input value={form.usage_instruction} onChange={(event) => update("usage_instruction", event.target.value)} required /></FormField>
        <FormField label="注意事項"><input value={form.warnings} onChange={(event) => update("warnings", event.target.value)} required /></FormField>
        <FormField label="價格"><input type="number" value={form.price} onChange={(event) => update("price", event.target.value)} /></FormField>
        <FormField label="產品連結"><input value={form.product_url} onChange={(event) => update("product_url", event.target.value)} /></FormField>
        <button className="primary-action" type="submit">
          <Plus size={18} />
          {editingId ? "更新產品資料" : "新增產品資料"}
        </button>
      </form>

      <section className="table-panel">
        {!products.length && (
          <EmptyState
            icon={Plus}
            title="尚未建立產品資料庫"
            description="請先新增產品名稱、菌種組合與適用族群，讓推薦結果可以配對產品建議。"
          />
        )}
        {products.map((product) => (
          <article className="admin-row" key={product.id}>
            <div>
              <strong>{product.brand_name} / {product.product_name}</strong>
              <span>{product.target_group} · {product.main_needs.join("、")} · {product.cfu_per_serving}</span>
            </div>
            <div className="row-actions">
              <button type="button" className="icon-button" onClick={() => favorite(product)} title="收藏"><Heart size={17} /></button>
              <button type="button" className="icon-button" onClick={() => edit(product)} title="編輯"><Pencil size={17} /></button>
              <button type="button" className="icon-button danger" onClick={() => remove(product.id)} title="刪除"><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </section>
      <Disclaimer />
    </main>
  );
}
