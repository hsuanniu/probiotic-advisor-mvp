import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  PackageCheck,
  Route,
  Sprout,
  TreePine,
  X
} from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import EmptyState from "../components/EmptyState.jsx";
import FormField from "../components/FormField.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import {
  createOfflineCheckin,
  createOfflineDailyLog,
  getOfflineJourney,
  getOfflineJourneys,
  updateOfflineReminder
} from "../utils/offlineAdvisor.js";

const checkpoints = [
  { day: 1, title: "建立挑戰", description: "完成生活型態評估並記錄起始分數。" },
  { day: 30, title: "第一次回報", description: "回顧持續食用與日常狀態。" },
  { day: 60, title: "第二次回報", description: "確認生活習慣與自我感受。" },
  { day: 90, title: "完成與重新評估", description: "完成挑戰總結與下一階段規劃。" }
];

const stageIcons = {
  seed: CircleDot,
  sprout: Sprout,
  tree: TreePine,
  completed: BadgeCheck
};

const initialCheckin = {
  checkpoint_day: 30,
  continued_use: "大多有持續",
  bowel_score: 7,
  bloating_score: 7,
  sleep_stress_score: 7,
  overall_score: 7,
  willing_to_repurchase: "考慮中",
  notes: ""
};

function ScoreField({ label, value, onChange }) {
  return (
    <FormField label={`${label}：${value} / 10`}>
      <input type="range" min="1" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </FormField>
  );
}

export default function JourneyPage({ setPage }) {
  const [journeys, setJourneys] = useState(null);
  const [journey, setJourney] = useState(null);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const list = await api.getJourneys();
      setJourneys(list || []);
      if (list?.length) setJourney(await api.getJourney(list[0].id));
    } catch {
      const offlineJourneys = getOfflineJourneys();
      setJourneys(offlineJourneys);
      if (offlineJourneys.length) setJourney(getOfflineJourney(offlineJourneys[0].id));
      setNotice("目前無法連線到後端，已改用本機 90 天旅程資料。");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setCheckin((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function logToday(status) {
    try {
      const updated = await api.createDailyLog(journey.id, { status });
      setJourney(updated);
    } catch {
      setJourney(createOfflineDailyLog(journey.id, { status }));
      setNotice("已使用本機資料儲存今日打卡。");
    } finally {
      setMessage(status === "taken" ? "今日已完成打卡，持續累積你的健康習慣。" : "已記錄今天略過，明天再繼續即可。");
    }
  }

  async function submitCheckin(event) {
    event.preventDefault();
    const checkpointDay = availableCheckinDays.includes(checkin.checkpoint_day)
      ? checkin.checkpoint_day
      : availableCheckinDays[0];
    try {
      const updated = await api.createJourneyCheckin(journey.id, { ...checkin, checkpoint_day: checkpointDay });
      setJourney(updated);
    } catch {
      setJourney(createOfflineCheckin(journey.id, { ...checkin, checkpoint_day: checkpointDay }));
      setNotice("已使用本機資料儲存階段回報。");
    } finally {
      setMessage(`Day ${checkpointDay} 回報已儲存。`);
    }
  }

  async function updateReminder(reminder, payload, feedback) {
    try {
      await api.updateReminder(reminder.id, payload);
      setJourney(await api.getJourney(journey.id));
    } catch {
      updateOfflineReminder(reminder.id, payload);
      setJourney(getOfflineJourney(journey.id));
      setNotice("已使用本機資料更新提醒狀態。");
    }
    setMessage(feedback);
  }

  if (!journeys) {
    return <main className="page-shell"><SkeletonList count={3} /></main>;
  }

  if (!journeys.length || !journey) {
    return (
      <main className="page-shell">
        <EmptyState
          icon={Route}
          title="尚未建立 90 天健康挑戰"
          description="請先完成生活型態評估並建立初始分數，再開始每日打卡與 Day 30、60、90 回報。"
          actionLabel="開始 90 天挑戰"
          onAction={() => setPage("intake")}
        />
        {notice && <p className="success-note">{notice}</p>}
        <Disclaimer />
      </main>
    );
  }

  const completedDays = new Set(journey.checkins.map((item) => Number(item.checkpoint_day)));
  const StageIcon = stageIcons[journey.growth_stage.key] || CircleDot;
  const reorderReminder = journey.reminders.find((reminder) => reminder.reminder_type === "reorder_reminder");
  const availableCheckinDays = [30, 60, 90].filter((day) => day <= journey.current_day && !completedDays.has(day));
  const nextCheckinDay = [30, 60, 90].find((day) => !completedDays.has(day));

  return (
    <main className="page-shell challenge-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">90-Day Health Challenge</p>
          <h2>90 天健康挑戰</h2>
          <p>方案 {journey.plan_level} · 目標：{journey.primary_goal} · 起始分數 {journey.initial_score} 分</p>
        </div>
        {message && <span className="success-pill">{message}</span>}
        {!message && notice && <span className="success-pill">{notice}</span>}
      </section>

      <section className={journey.today_log ? "daily-check-card completed" : "daily-check-card"}>
        <div className="daily-check-copy">
          <span className="daily-check-icon">{journey.today_log?.status === "taken" ? <CheckCircle2 size={30} /> : <CalendarCheck size={30} />}</span>
          <div>
            <p className="eyebrow">Daily Check-in</p>
            <h3>{journey.today_log?.status === "taken" ? "今天已完成服用" : journey.today_log?.status === "skipped" ? "今天已記錄略過" : "今天吃了嗎？"}</h3>
            <p>{journey.today_log ? "每一次記錄都能幫助你看見長期健康管理的累積。" : "依產品標示完成每日營養補充，並留下今天的記錄。"}</p>
          </div>
        </div>
        <div className="daily-check-actions">
          <button className="primary-action" type="button" onClick={() => logToday("taken")}><Check size={18} />已服用</button>
          <button className="secondary-action" type="button" onClick={() => logToday("skipped")}><X size={18} />今天略過</button>
        </div>
      </section>

      <section className="challenge-stat-grid">
        <article><strong>{journey.consecutive_days}</strong><span>連續服用天數</span></article>
        <article><strong>{journey.taken_days}</strong><span>累積服用天數</span></article>
        <article><strong>{journey.current_day} / 90</strong><span>挑戰進度</span></article>
        <article><strong>{journey.remaining_days}</strong><span>距離完成天數</span></article>
      </section>

      <section className="report-grid challenge-progress-grid">
        <article className="report-card growth-card">
          <span className={`growth-visual ${journey.growth_stage.key}`}><StageIcon size={54} /></span>
          <div>
            <p className="eyebrow">Growth Stage</p>
            <h3>{journey.growth_stage.label}階段</h3>
            <p>{journey.growth_stage.description}</p>
          </div>
        </article>
        <article className="report-card">
          <div className="challenge-progress-heading">
            <div>
              <p className="eyebrow">Challenge Progress</p>
              <h3>你已完成 {journey.current_day} / 90 天</h3>
            </div>
            <strong>{journey.progress_percent}%</strong>
          </div>
          <div className="challenge-progress-track"><span style={{ width: `${journey.progress_percent}%` }} /></div>
          <p className="report-note">
            {journey.days_to_next_checkpoint > 0
              ? `距離 Day ${journey.next_checkpoint_day} 階段回報還有 ${journey.days_to_next_checkpoint} 天。`
              : `Day ${journey.next_checkpoint_day} 回報已到期，可以完成階段記錄。`}
          </p>
          <p className="report-note">距離 90 天挑戰完成還有 {journey.remaining_days} 天。</p>
        </article>
      </section>

      <section className="journey-timeline">
        {checkpoints.map((checkpoint) => {
          const completed = checkpoint.day === 1 || completedDays.has(checkpoint.day);
          return (
            <article className={completed ? "timeline-card completed" : "timeline-card"} key={checkpoint.day}>
              <span>{completed ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}</span>
              <div><strong>Day {checkpoint.day}</strong><h3>{checkpoint.title}</h3><p>{checkpoint.description}</p></div>
            </article>
          );
        })}
      </section>

      {journey.show_reorder_reminder && reorderReminder && (
        <section className="reorder-alert">
          <PackageCheck size={28} />
          <div>
            <h3>你的益生菌預估剩不到 7 天</h3>
            <p>目前預估剩餘 {journey.product_remaining_days} 天，建議準備下一盒，維持營養補充習慣。</p>
          </div>
          <div className="reorder-actions">
            <button className="secondary-action" type="button" onClick={() => updateReminder(reorderReminder, { action: "postpone" }, "已延後一天提醒。")}>稍後提醒</button>
            <button className="primary-action" type="button" onClick={() => updateReminder(reorderReminder, { action: "reordered" }, "已記錄續購意願，30 天後會再次提醒。")}>我要續購</button>
          </div>
        </section>
      )}

      <section className="report-grid">
        {availableCheckinDays.length ? (
          <form className="report-card checkin-form" onSubmit={submitCheckin}>
            <p className="eyebrow">30 / 60 / 90 Day Check-in</p>
            <h3>階段健康回報</h3>
            <FormField label="回報節點">
              <select value={availableCheckinDays.includes(checkin.checkpoint_day) ? checkin.checkpoint_day : availableCheckinDays[0]} onChange={(event) => update("checkpoint_day", Number(event.target.value))}>
                {availableCheckinDays.map((day) => <option value={day} key={day}>Day {day}</option>)}
              </select>
            </FormField>
            <FormField label="是否持續食用">
              <select value={checkin.continued_use} onChange={(event) => update("continued_use", event.target.value)}>
                <option>每天持續</option><option>大多有持續</option><option>偶爾中斷</option><option>已停止</option>
              </select>
            </FormField>
            <ScoreField label="排便狀況" value={checkin.bowel_score} onChange={(value) => update("bowel_score", value)} />
            <ScoreField label="脹氣狀況" value={checkin.bloating_score} onChange={(value) => update("bloating_score", value)} />
            <ScoreField label="睡眠 / 壓力狀況" value={checkin.sleep_stress_score} onChange={(value) => update("sleep_stress_score", value)} />
            <ScoreField label="自我感受" value={checkin.overall_score} onChange={(value) => update("overall_score", value)} />
            <FormField label="是否願意續購">
              <select value={checkin.willing_to_repurchase} onChange={(event) => update("willing_to_repurchase", event.target.value)}>
                <option>願意</option><option>考慮中</option><option>暫時不考慮</option>
              </select>
            </FormField>
            <FormField label="備註">
              <textarea value={checkin.notes} onChange={(event) => update("notes", event.target.value)} placeholder="記錄近期飲食、作息或自我感受。" />
            </FormField>
            <button className="primary-action" type="submit"><CalendarCheck size={18} />送出階段回報</button>
          </form>
        ) : (
          <article className="report-card checkin-locked">
            <Clock3 size={30} />
            <p className="eyebrow">Next Check-in</p>
            <h3>{nextCheckinDay ? `Day ${nextCheckinDay} 回報尚未開放` : "所有階段回報已完成"}</h3>
            <p>{nextCheckinDay ? `目前是 Day ${journey.current_day}，距離下一次階段回報還有 ${Math.max(0, nextCheckinDay - journey.current_day)} 天。` : "你已完成 Day 30、60、90 的健康回報。"}</p>
          </article>
        )}

        <article className="report-card">
          <p className="eyebrow">Reminder Status</p>
          <h3>提醒狀態</h3>
          <div className="reminder-list">
            {journey.reminders.map((reminder) => (
              <div className={reminder.status === "dismissed" ? "reminder-row completed" : "reminder-row"} key={reminder.id}>
                <Bell size={18} />
                <span><strong>{reminder.scheduled_date || `Day ${reminder.due_day}`}</strong>{reminder.message}</span>
                <em>{reminder.status === "sent" ? "已發送" : reminder.status === "dismissed" ? "已處理" : "待提醒"}</em>
              </div>
            ))}
          </div>
          <p className="report-note">目前為站內提醒狀態，尚未串接 LINE、金流或物流。</p>
        </article>
      </section>

      <Disclaimer />
    </main>
  );
}
