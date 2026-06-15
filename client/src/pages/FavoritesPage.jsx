import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  async function load() {
    setFavorites(await api.getFavorites());
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api.deleteFavorite(id);
    await load();
  }

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Saved Library</p>
          <h2>收藏菌種與產品</h2>
          <p>將常用菌種與產品保存成個人資料庫，方便後續分析與推薦情境使用。</p>
        </div>
      </section>

      <section className="table-panel">
        {!favorites.length && (
          <EmptyState
            icon={Heart}
            title="尚未建立收藏資料庫"
            description="你可以在推薦結果、產品管理或菌種管理中收藏常用菌種與產品，方便後續分析參考。"
          />
        )}
        {favorites.map((favorite) => (
          <article className="admin-row favorite-row" key={favorite.id}>
            <div>
              <strong>{favorite.item_name}</strong>
              <span>{favorite.item_type === "product" ? "產品" : "菌種"} · {new Date(favorite.created_at).toLocaleString()}</span>
              {favorite.item_meta?.summary && <small>{favorite.item_meta.summary}</small>}
            </div>
            <button type="button" className="icon-button danger" onClick={() => remove(favorite.id)} title="移除收藏">
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </section>
      <Disclaimer />
    </main>
  );
}
