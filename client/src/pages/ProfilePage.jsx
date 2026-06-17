import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import FormField from "../components/FormField.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { getOfflineProfile, updateOfflineProfile } from "../utils/offlineAdvisor.js";

const needOptions = ["日常腸胃保養", "外食族保養", "熟齡健康管理", "女性日常保養", "長期營養支持", "其他"];

function toggle(list, item) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setProfile((current) => current || getOfflineProfile());
      setNotice("目前使用本機 demo Profile，避免頁面停在讀取。");
    }, 3000);

    api.getProfile()
      .then((data) => {
        setProfile(data || getOfflineProfile());
        setNotice("");
      })
      .catch(() => {
        setProfile(getOfflineProfile());
        setNotice("目前無法連線到後端，已改用本機 Profile。");
      })
      .finally(() => window.clearTimeout(fallbackTimer));

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      setNotice("");
    } catch {
      setProfile(updateOfflineProfile(profile));
      setNotice("目前無法連線到後端，已儲存在本機 Profile。");
    }
    setSaved(true);
  }

  if (!profile) {
    return (
      <main className="page-shell">
        <section className="section-heading">
          <div>
            <p className="eyebrow">User Profile</p>
            <h2>正在讀取健康 Profile</h2>
            <p>系統正在載入固定健康需求、飲食習慣與保健目標。</p>
          </div>
        </section>
        <SkeletonList count={2} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">User Profile</p>
          <h2>使用者 Profile</h2>
          <p>建立固定的健康需求與飲食習慣，讓平台更像持續使用的 AI 健康顧問。</p>
        </div>
        {notice && <span className="success-pill">{notice}</span>}
      </section>

      <form className="admin-form profile-form" onSubmit={submit}>
        <FormField label="顯示名稱">
          <input value={profile.display_name} onChange={(event) => update("display_name", event.target.value)} />
        </FormField>
        <FormField label="年齡">
          <input type="number" value={profile.age || ""} onChange={(event) => update("age", event.target.value)} />
        </FormField>
        <FormField label="性別">
          <select value={profile.gender} onChange={(event) => update("gender", event.target.value)}>
            <option>不指定</option>
            <option>女性</option>
            <option>男性</option>
            <option>其他</option>
          </select>
        </FormField>
        <FormField label="飲食習慣">
          <input value={profile.diet_habits || ""} onChange={(event) => update("diet_habits", event.target.value)} placeholder="例如 外食多、蔬果少、作息不固定" />
        </FormField>
        <FormField label="健康目標">
          <textarea value={profile.health_goals || ""} onChange={(event) => update("health_goals", event.target.value)} placeholder="例如 建立日常保養習慣，尋找適合的益生菌產品方向" />
        </FormField>
        <fieldset className="choice-panel profile-needs">
          <legend>健康需求</legend>
          <div className="choice-grid">
            {needOptions.map((need) => (
              <label key={need} className={profile.health_needs.includes(need) ? "choice-chip selected" : "choice-chip"}>
                <input type="checkbox" checked={profile.health_needs.includes(need)} onChange={() => update("health_needs", toggle(profile.health_needs, need))} />
                <span>{need}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="primary-action" type="submit">
          <Save size={18} />
          儲存健康 Profile
        </button>
        {saved && <p className="success-note">健康 Profile 已更新，後續分析可依此作為固定參考。</p>}
      </form>
      <Disclaimer />
    </main>
  );
}
