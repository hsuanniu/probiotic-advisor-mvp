import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Gauge,
  Leaf,
  RotateCcw,
  Route
} from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";

const planLevels = [
  {
    level: "A",
    name: "基礎版",
    positioning: "日常保養、外食族、排便不規律",
    price_range: "NT$1,990～2,490"
  },
  {
    level: "B",
    name: "進階版",
    positioning: "高菌數、多菌株、熟齡保養、長期保健",
    price_range: "NT$3,990～4,990",
    is_primary: true
  },
  {
    level: "C",
    name: "旗艦版",
    positioning: "高規格原料、專業照護級營養支持、長期健康管理",
    price_range: "NT$6,990～8,990"
  }
];

function getFourAspectScores(summary, healthScore) {
  const eatingOut = summary.eating_out_frequency;
  const bowel = summary.bowel_status;
  const stress = summary.stress_sleep;
  return [
    { label: "腸道平衡", value: healthScore },
    { label: "外食壓力", value: eatingOut === "幾乎每天" ? 42 : eatingOut === "每週 4-6 次" ? 58 : 82 },
    { label: "排便規律", value: bowel === "大致規律" ? 88 : bowel === "偶爾不規律" ? 68 : 48 },
    { label: "身心節律", value: stress === "睡眠與壓力大致穩定" ? 86 : stress === "偶爾睡不好或壓力較高" ? 66 : 46 }
  ];
}

export default function RecommendationResultPage({ recommendation, setPage }) {
  const [journey, setJourney] = useState(null);
  const [creatingJourney, setCreatingJourney] = useState(false);

  if (!recommendation) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={Gauge}
          title="尚未建立生活型態分析"
          description="完成 7 題短問卷後，系統會提供腸道健康分數、生活建議與 90 天追蹤方案。"
          actionLabel="開始生活型態評估"
          onAction={() => setPage("intake")}
        />
        <Disclaimer />
      </main>
    );
  }

  const summary = recommendation.request_summary;
  const healthScore = recommendation.gut_health_score;
  const recommendedPlan = recommendation.plan_recommendation;
  const aspectScores = getFourAspectScores(summary, healthScore);

  async function startJourney() {
    setCreatingJourney(true);
    try {
      const created = await api.createJourney({
        recommendation_log_id: recommendation.recommendation_log_id,
        initial_score: healthScore,
        plan_level: recommendedPlan.level,
        primary_goal: summary.primary_goal
      });
      setJourney(created);
    } finally {
      setCreatingJourney(false);
    }
  }

  return (
    <main className="page-shell report-page">
      <section className="result-header">
        <div>
          <p className="eyebrow">四象生活健康分析</p>
          <h2>個人生活型態與腸道保養建議</h2>
        </div>
        <div className="report-actions print-hide">
          <button className="secondary-action" type="button" onClick={() => window.print()}>
            <Download size={18} />
            下載報告
          </button>
          <button className="primary-action" type="button" onClick={() => setPage("intake")}>
            <RotateCcw size={18} />
            重新分析
          </button>
        </div>
      </section>

      <Disclaimer />

      <section className="report-grid">
        <article className="report-card summary-card">
          <p className="eyebrow">Lifestyle Summary</p>
          <h3>生活型態摘要</h3>
          <div className="summary-list">
            <span>年齡：{summary.age_range}</span>
            <span>性別：{summary.gender}</span>
            <span>外食：{summary.eating_out_frequency}</span>
            <span>排便：{summary.bowel_status}</span>
            <span>睡眠壓力：{summary.stress_sleep}</span>
            <span>目標：{summary.primary_goal}</span>
          </div>
        </article>

        <article className="report-card health-score-card">
          <p className="eyebrow">Gut Health Score</p>
          <div className="health-score-circle" style={{ "--score": healthScore }}>
            <strong>{healthScore}</strong>
            <span>腸道健康分數</span>
          </div>
          <p>分數由生活型態問卷推估，僅供日常保養與追蹤參考。</p>
        </article>
      </section>

      <section className="report-card">
        <p className="eyebrow">Four Aspects</p>
        <h3>四象生活指標</h3>
        <div className="score-stack">
          {aspectScores.map((score) => (
            <div className="score-row" key={score.label}>
              <div><strong>{score.label}</strong><span>{score.value} 分</span></div>
              <div className="score-track"><span style={{ width: `${score.value}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="report-grid">
        <article className="report-card">
          <p className="eyebrow">Lifestyle Analysis</p>
          <h3>生活型態分析</h3>
          <ul className="reason-list">
            {recommendation.lifestyle_analysis.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="report-card attention-card">
          <h3><AlertTriangle size={18} />主要風險提醒</h3>
          <ul className="reason-list">
            {recommendation.risk_alerts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <section className="report-card">
        <p className="eyebrow">Daily Guidance</p>
        <h3>飲食與生活建議</h3>
        <div className="guidance-grid">
          {recommendation.lifestyle_advice.map((item) => (
            <article className="guidance-card" key={item}>
              <Leaf size={20} />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="report-card">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Plan Level</p>
            <h3>建議方案等級</h3>
          </div>
          <span className="success-pill">本次建議：{recommendedPlan.level} {recommendedPlan.name}</span>
        </div>
        <div className="plan-grid">
          {planLevels.map((plan) => {
            const selected = plan.level === recommendedPlan.level;
            return (
              <article className={selected ? "plan-card selected" : "plan-card"} key={plan.level}>
                {plan.is_primary && <span className="plan-badge">主推商品</span>}
                <strong>{plan.level}</strong>
                <h4>{plan.name}</h4>
                <p>{plan.positioning}</p>
                <span>{plan.price_range}</span>
                {selected && <em><CheckCircle2 size={16} />依本次生活型態建議</em>}
              </article>
            );
          })}
        </div>
        <p className="report-note">方案等級為營養補充與預算帶參考，不代表必須購買特定產品。</p>
      </section>

      <section className="journey-cta">
        <div>
          <p className="eyebrow">90-Day Journey</p>
          <h3>建立 90 天健康旅程</h3>
          <p>從 Day 1 建立初始分數，在 Day 30、60、90 回報生活狀態，持續觀察日常習慣。</p>
        </div>
        {!journey ? (
          <button className="primary-action print-hide" type="button" disabled={creatingJourney} onClick={startJourney}>
            <Route size={18} />
            {creatingJourney ? "正在建立旅程..." : "開始 90 天追蹤"}
          </button>
        ) : (
          <div className="journey-created">
            <CalendarDays size={20} />
            <span>旅程已建立，起始分數 {journey.initial_score} 分</span>
            <button className="secondary-action print-hide" type="button" onClick={() => setPage("journey")}>查看旅程</button>
          </div>
        )}
      </section>
    </main>
  );
}
