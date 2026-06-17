import { useEffect, useState } from "react";
import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";

const emptyStrain = {
  strain_name: "",
  strain_code: "",
  application_areas: [],
  suggested_cfu_min: 0,
  suggested_cfu_max: 0,
  target_group: "成人",
  warnings: "",
  evidence_notes: ""
};

function csvToArray(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function StrainAdminPage() {
  const [strains, setStrains] = useState([]);
  const [form, setForm] = useState(emptyStrain);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setStrains(await api.getStrains());
    } catch {
      setStrains([]);
      setMessage("目前無法連線到後端，菌種資料暫以空狀態顯示。");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateStrain(editingId, form);
      } else {
        await api.createStrain(form);
      }
      await load();
    } catch {
      setMessage("目前無法連線到後端，請稍後再儲存菌種資料。");
    }
    setForm(emptyStrain);
    setEditingId(null);
  }

  function edit(strain) {
    setEditingId(strain.id);
    setForm(strain);
  }

  async function remove(id) {
    try {
      await api.deleteStrain(id);
      await load();
    } catch {
      setStrains((current) => current.filter((strain) => strain.id !== id));
      setMessage("目前無法連線到後端，已先從畫面移除。");
    }
  }

  async function favorite(strain) {
    try {
      await api.createFavorite({
        item_type: "strain",
        item_id: strain.id,
        item_name: strain.strain_name,
        item_meta: { summary: `${strain.strain_code || "No code"} · ${strain.application_areas.join("、")}` }
      });
      setMessage(`已收藏：${strain.strain_name}`);
    } catch {
      setMessage("目前無法連線到後端，收藏功能暫時無法儲存。");
    }
    setTimeout(() => setMessage(""), 1800);
  }

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Strain Database</p>
          <h2>菌種管理</h2>
          <p>維護菌種名稱、strain code、應用方向與 CFU 參考區間，支援後續推薦與說明內容。</p>
        </div>
        {message && <span className="success-pill">{message}</span>}
      </section>

      <form className="admin-form" onSubmit={submit}>
        <FormField label="菌種名稱"><input value={form.strain_name} onChange={(event) => update("strain_name", event.target.value)} required /></FormField>
        <FormField label="strain code"><input value={form.strain_code} onChange={(event) => update("strain_code", event.target.value)} /></FormField>
        <FormField label="常見應用方向，逗號分隔"><input value={form.application_areas.join(", ")} onChange={(event) => update("application_areas", csvToArray(event.target.value))} /></FormField>
        <FormField label="建議 CFU 下限"><input type="number" value={form.suggested_cfu_min} onChange={(event) => update("suggested_cfu_min", event.target.value)} /></FormField>
        <FormField label="建議 CFU 上限"><input type="number" value={form.suggested_cfu_max} onChange={(event) => update("suggested_cfu_max", event.target.value)} /></FormField>
        <FormField label="適用族群"><input value={form.target_group} onChange={(event) => update("target_group", event.target.value)} required /></FormField>
        <FormField label="注意事項"><input value={form.warnings} onChange={(event) => update("warnings", event.target.value)} required /></FormField>
        <FormField label="參考文獻欄位"><input value={form.evidence_notes} onChange={(event) => update("evidence_notes", event.target.value)} /></FormField>
        <button className="primary-action" type="submit">
          <Plus size={18} />
          {editingId ? "更新菌種資料" : "新增菌種資料"}
        </button>
      </form>

      <section className="table-panel">
        {!strains.length && (
          <EmptyState
            icon={Plus}
            title="尚未建立菌種資料庫"
            description="請先新增菌種名稱、strain code、應用方向與 CFU 區間，讓系統可以進行需求配對。"
          />
        )}
        {strains.map((strain) => (
          <article className="admin-row" key={strain.id}>
            <div>
              <strong>{strain.strain_name} / {strain.strain_code || "未填 code"}</strong>
              <span>{strain.target_group} · {strain.application_areas.join("、")} · {strain.suggested_cfu_min.toLocaleString()}-{strain.suggested_cfu_max.toLocaleString()} CFU</span>
            </div>
            <div className="row-actions">
              <button type="button" className="icon-button" onClick={() => favorite(strain)} title="收藏"><Heart size={17} /></button>
              <button type="button" className="icon-button" onClick={() => edit(strain)} title="編輯"><Pencil size={17} /></button>
              <button type="button" className="icon-button danger" onClick={() => remove(strain.id)} title="刪除"><Trash2 size={17} /></button>
            </div>
          </article>
        ))}
      </section>
      <Disclaimer />
    </main>
  );
}
