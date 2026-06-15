import { ArrowRight, BriefcaseBusiness, Gauge, Route, Sparkles, UserRound } from "lucide-react";
import Disclaimer from "../components/Disclaimer.jsx";

const valueCards = [
  {
    title: "生活型態評估",
    description: "透過 7 題短問卷整理外食、排便、睡眠壓力與最大保健目標。",
    icon: Sparkles
  },
  {
    title: "腸道健康分數",
    description: "將日常狀態轉換成容易理解的分數、四象指標與 A/B/C 方案等級。",
    icon: Gauge
  },
  {
    title: "90 天持續追蹤",
    description: "在 Day 1、30、60、90 記錄生活狀態，搭配食用、回報與回購提醒。",
    icon: Route
  }
];

export default function HomePage({ mode, setMode, setPage }) {
  return (
    <main className="page-shell">
      <section className="hero-band">
        <div>
          <p className="eyebrow">Four Aspects Health Journey</p>
          <h1>四象生活 AI 健康顧問</h1>
          <p className="hero-copy">從生活型態評估、腸道健康分數到 90 天持續追蹤，協助建立容易理解、可以長期執行的日常保養與營養補充計畫。</p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => setPage("intake")}>
              <ArrowRight size={18} />
              開始生活評估
            </button>
            <button className="secondary-action" type="button" onClick={() => setPage("journey")}>
              <Route size={18} />
              查看 90 天旅程
            </button>
          </div>
          <div className="mode-picker" aria-label="選擇模式">
            <button className={mode === "business" ? "mode-card selected" : "mode-card"} onClick={() => setMode("business")}>
              <BriefcaseBusiness size={24} />
              <strong>業務版</strong>
              <span>協助客戶完成生活評估、方案分級與 90 天追蹤說明。</span>
            </button>
            <button className={mode === "consumer" ? "mode-card selected" : "mode-card"} onClick={() => setMode("consumer")}>
              <UserRound size={24} />
              <strong>消費者版</strong>
              <span>了解自己的腸道健康分數與可執行的日常保養方向。</span>
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-label="平台重點">
          {valueCards.map(({ title, description, icon: Icon }) => (
            <article className="value-card" key={title}>
              <span className="value-icon">
                <Icon size={22} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Disclaimer />
    </main>
  );
}
