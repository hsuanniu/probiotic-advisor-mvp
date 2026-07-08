import { Bell, Boxes, ChevronRight, Heart, History, Info, Microscope, UserRound } from "lucide-react";
import Disclaimer from "../components/Disclaimer.jsx";

const myItems = [
  {
    page: "favorites",
    title: "收藏",
    description: "查看已收藏的菌種與產品。",
    icon: Heart
  },
  {
    page: "journey",
    title: "提醒設定",
    description: "查看每日打卡、回報與回購提醒狀態。",
    icon: Bell
  },
  {
    page: "dashboard",
    title: "歷史紀錄",
    description: "回到 Dashboard 查看最近分析與趨勢。",
    icon: History
  },
  {
    page: "profile",
    title: "個人資料",
    description: "管理年齡、性別、飲食習慣與健康目標。",
    icon: UserRound
  },
  {
    page: "products",
    title: "產品後台",
    description: "維護產品資料庫與方案內容。",
    icon: Boxes
  },
  {
    page: "strains",
    title: "菌種後台",
    description: "維護菌種資料庫與應用方向。",
    icon: Microscope
  }
];

export default function MyPage({ setPage }) {
  return (
    <main className="page-shell my-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Account & More</p>
          <h2>我的</h2>
          <p>收藏、提醒、歷史紀錄與個人資料集中在這裡，主要功能保留在底部導覽。</p>
        </div>
      </section>

      <section className="my-grid" aria-label="我的功能">
        {myItems.map(({ page, title, description, icon: Icon }) => (
          <button className="my-card" key={title} type="button" onClick={() => setPage(page)}>
            <span className="my-card-icon"><Icon size={22} /></span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </section>

      <section className="report-card about-card">
        <p className="eyebrow">About</p>
        <h3><Info size={18} />關於四象生活</h3>
        <p>四象生活 AI 健康顧問提供生活型態評估、腸道健康分數、方案等級與 90 天追蹤參考，內容僅作為保健食品與營養補充參考。</p>
      </section>

      <Disclaimer />
    </main>
  );
}
