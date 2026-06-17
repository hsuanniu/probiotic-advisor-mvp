import { useEffect, useState } from "react";
import { Activity, BarChart3, Bell, Clock, RotateCcw, Target } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { getDemoDashboard } from "../utils/offlineAdvisor.js";

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="dashboard-stat">
      <Icon size={22} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function RankingList({ title, items, emptyText }) {
  return (
    <article className="report-card">
      <h3>{title}</h3>
      <div className="ranking-list">
        {items.length ? items.map((item, index) => (
          <div className="ranking-row" key={item.label}>
            <span>{index + 1}</span>
            <strong>{item.label}</strong>
            <em>{item.count} 次</em>
          </div>
        )) : <EmptyState icon={Target} title={emptyText} description="完成更多健康需求分析後，這裡會自動累積趨勢資料。" />}
      </div>
    </article>
  );
}

export default function DashboardPage({ setPage }) {
  const [dashboard, setDashboard] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const fallbackTimer = window.setTimeout(() => {
      if (!active) return;
      setDashboard(getDemoDashboard());
      setNotice("目前使用 demo 工作台資料，避免頁面停在讀取狀態。");
    }, 3000);

    async function load() {
      try {
        const data = await api.getDashboard();
        if (!active) return;
        setDashboard(data || getDemoDashboard());
      } catch {
        if (!active) return;
        setDashboard(getDemoDashboard());
        setNotice("目前無法連線到後端，已改用 demo 工作台資料。");
      } finally {
        window.clearTimeout(fallbackTimer);
      }
    }

    load();
    return () => {
      active = false;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!dashboard) {
    return (
      <main className="page-shell">
        <section className="section-heading">
          <div>
            <p className="eyebrow">AI Health Advisor Dashboard</p>
            <h2>正在讀取健康分析工作台</h2>
            <p>系統正在整理最近分析紀錄、熱門需求與菌種推薦排行。</p>
          </div>
        </section>
        <SkeletonList count={4} />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Four Aspects Dashboard</p>
          <h2>健康分析 Dashboard</h2>
          <p>追蹤最近生活評估、熱門保養目標與 90 天健康旅程，建立持續使用的健康顧問工作台。</p>
        </div>
        {notice && <span className="success-pill">{notice}</span>}
        <button className="primary-action" type="button" onClick={() => setPage("intake")}>
          <RotateCcw size={18} />
          建立新分析
        </button>
      </section>

      <section className="dashboard-stat-grid">
        <StatCard icon={Activity} label="總分析次數" value={dashboard.total_analyses} />
        <StatCard icon={BarChart3} label="平均腸道健康分數" value={`${dashboard.average_health_score || dashboard.average_confidence} 分`} />
        <StatCard icon={Target} label="熱門需求數" value={dashboard.popular_needs.length} />
        <StatCard icon={Bell} label="可追蹤節點" value="Day 30/60/90" />
      </section>

      <section className="report-grid">
        <article className="report-card">
          <h3>
            <Clock size={18} />
            最近分析紀錄
          </h3>
          <div className="history-list">
            {dashboard.recent_logs.length ? dashboard.recent_logs.map((log) => (
              <article className="history-row" key={log.id}>
                <div>
                  <strong>{log.needs.join("、") || "未標示需求"}</strong>
                  <span>{new Date(log.created_at).toLocaleString()} · {log.target_group}</span>
                  <small>分析類型：生活型態與腸道保養參考 · 方案 {log.plan_level || "待更新"}</small>
                </div>
                <div className="history-actions">
                  <em>{log.gut_health_score || log.confidence_score} 分</em>
                  <button className="secondary-action compact-action" type="button" onClick={() => setPage("intake")}>
                    重新分析
                  </button>
                </div>
              </article>
            )) : (
              <EmptyState
                icon={Activity}
                title="尚未建立分析紀錄"
                description="建立第一筆生活型態評估後，這裡會顯示最近分析、腸道健康分數與追蹤紀錄。"
                actionLabel="建立第一筆分析"
                onAction={() => setPage("intake")}
              />
            )}
          </div>
        </article>

        <RankingList title="熱門健康需求" items={dashboard.popular_needs} emptyText="尚未累積健康需求趨勢" />
      </section>

      <section className="report-grid">
        <RankingList title="常見症狀 / 注意條件" items={dashboard.common_conditions} emptyText="尚未累積注意條件資料" />
        <RankingList title="常見保養方向" items={dashboard.popular_needs} emptyText="尚未累積保養方向資料" />
      </section>

      <Disclaimer />
    </main>
  );
}
