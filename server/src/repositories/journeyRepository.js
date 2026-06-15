import { db } from "../db/database.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const reminderTemplates = [
  { reminder_type: "daily_intake_reminder", due_day: 1, message: "每日服用提醒：今天記得依產品標示完成營養補充。" },
  { reminder_type: "day_30_checkin", due_day: 30, message: "Day 30 回報提醒：記錄排便、脹氣與睡眠壓力狀況。" },
  { reminder_type: "day_60_checkin", due_day: 60, message: "Day 60 回報提醒：完成第二次生活型態回顧。" },
  { reminder_type: "reorder_reminder", due_day: 24, message: "回購提醒：預估剩不到 7 天，建議準備下一盒。" },
  { reminder_type: "day_90_review", due_day: 90, message: "Day 90 重新評估提醒：完成挑戰總結與下一階段規劃。" }
];

function toDateOnly(value = new Date()) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

function differenceInDays(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.floor((end - start) / DAY_MS);
}

function calculateStreak(logs, today) {
  const byDate = new Map(logs.map((log) => [log.log_date, log.status]));
  let cursor = today;
  if (!byDate.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;

  while (byDate.get(cursor) === "taken") {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function getGrowthStage(currentDay) {
  if (currentDay >= 90) return { key: "completed", label: "完成", description: "90 天健康挑戰已完成。" };
  if (currentDay >= 60) return { key: "tree", label: "小樹", description: "持續累積生活習慣，準備完成挑戰。" };
  if (currentDay >= 30) return { key: "sprout", label: "發芽", description: "已完成第一階段，持續維持日常節奏。" };
  return { key: "seed", label: "種子", description: "從每日打卡開始，建立穩定的營養補充習慣。" };
}

function getNextCheckpoint(currentDay) {
  const next = [30, 60, 90].find((day) => day >= currentDay);
  return next || 90;
}

function ensureJourneyReminders(journey) {
  reminderTemplates.forEach((reminder) => {
    const scheduledDate = addDays(journey.start_date, reminder.due_day - 1);
    db.prepare(`
      INSERT OR IGNORE INTO reminder_states (
        journey_id, user_id, reminder_type, due_day, scheduled_date, status, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      journey.id,
      1,
      reminder.reminder_type,
      reminder.due_day,
      scheduledDate,
      "pending",
      reminder.message
    );
    db.prepare(`
      UPDATE reminder_states
      SET user_id = 1,
          scheduled_date = COALESCE(scheduled_date, ?),
          message = ?
      WHERE journey_id = ? AND reminder_type = ?
    `).run(scheduledDate, reminder.message, journey.id, reminder.reminder_type);
  });
}

function hydrateJourney(row) {
  if (!row) return null;
  ensureJourneyReminders(row);
  const today = toDateOnly();
  const targetDays = Number(row.target_days || 90);
  const currentDay = Math.min(targetDays, Math.max(1, differenceInDays(row.start_date, today) + 1));
  const logs = db.prepare("SELECT * FROM daily_logs WHERE journey_id = ? ORDER BY log_date DESC").all(row.id);
  const takenDays = logs.filter((log) => log.status === "taken").length;
  const todayLog = logs.find((log) => log.log_date === today) || null;
  const nextCheckpoint = getNextCheckpoint(currentDay);
  const productDays = Number(row.product_days || 30);
  const cycleDay = ((currentDay - 1) % productDays) + 1;
  const productRemainingDays = productDays - cycleDay + 1;

  const dailyReminder = db.prepare(`
    SELECT * FROM reminder_states
    WHERE journey_id = ? AND reminder_type = 'daily_intake_reminder'
  `).get(row.id);
  if (dailyReminder && dailyReminder.scheduled_date < today) {
    db.prepare(`
      UPDATE reminder_states
      SET scheduled_date = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(today, dailyReminder.id);
  }

  db.prepare(`
    UPDATE reminder_states
    SET status = 'sent', updated_at = CURRENT_TIMESTAMP
    WHERE journey_id = ? AND status = 'pending' AND scheduled_date <= ?
  `).run(row.id, today);

  if (currentDay >= targetDays && row.status === "active") {
    db.prepare("UPDATE health_journeys SET status = 'completed', current_day = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(targetDays, row.id);
  } else if (Number(row.current_day) !== currentDay) {
    db.prepare("UPDATE health_journeys SET current_day = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(currentDay, row.id);
  }

  return {
    ...row,
    status: currentDay >= targetDays ? "completed" : row.status,
    current_day: currentDay,
    target_days: targetDays,
    product_days: productDays,
    initial_score: Number(row.initial_score),
    daily_logs: logs,
    today_log: todayLog,
    taken_days: takenDays,
    skipped_days: logs.filter((log) => log.status === "skipped").length,
    consecutive_days: calculateStreak(logs, today),
    progress_percent: Math.min(100, Math.round((currentDay / targetDays) * 100)),
    remaining_days: Math.max(0, targetDays - currentDay),
    next_checkpoint_day: nextCheckpoint,
    days_to_next_checkpoint: Math.max(0, nextCheckpoint - currentDay),
    product_remaining_days: productRemainingDays,
    show_reorder_reminder: productRemainingDays <= 7,
    growth_stage: getGrowthStage(currentDay)
  };
}

export function createJourney(payload) {
  const existing = db.prepare(`
    SELECT * FROM health_journeys WHERE user_id = 1 AND status = 'active' ORDER BY id DESC LIMIT 1
  `).get();
  if (existing) {
    const activeJourney = getJourneyById(existing.id);
    if (activeJourney?.status === "active") return activeJourney;
  }

  const startDate = payload.start_date || toDateOnly();
  const result = db.prepare(`
    INSERT INTO health_journeys (
      user_id, recommendation_log_id, start_date, target_days, product_days,
      current_day, initial_score, plan_level, primary_goal, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    payload.recommendation_log_id || null,
    startDate,
    90,
    30,
    1,
    Number(payload.initial_score),
    payload.plan_level,
    payload.primary_goal,
    "active"
  );

  reminderTemplates.forEach((reminder) => {
    db.prepare(`
      INSERT INTO reminder_states (
        journey_id, user_id, reminder_type, due_day, scheduled_date, status, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      result.lastInsertRowid,
      1,
      reminder.reminder_type,
      reminder.due_day,
      addDays(startDate, reminder.due_day - 1),
      "pending",
      reminder.message
    );
  });

  return getJourneyById(result.lastInsertRowid);
}

export function getJourneyById(id) {
  const row = db.prepare("SELECT * FROM health_journeys WHERE id = ? AND user_id = 1").get(Number(id));
  if (!row) return null;
  const journey = hydrateJourney(row);
  return {
    ...journey,
    checkins: db.prepare("SELECT * FROM journey_checkins WHERE journey_id = ? ORDER BY checkpoint_day").all(Number(id)),
    reminders: db.prepare(`
      SELECT * FROM reminder_states
      WHERE journey_id = ?
        AND reminder_type IN (
          'daily_intake_reminder', 'day_30_checkin', 'day_60_checkin',
          'day_90_review', 'reorder_reminder'
        )
      ORDER BY due_day
    `).all(Number(id))
  };
}

export function getJourneys() {
  return db.prepare("SELECT * FROM health_journeys WHERE user_id = 1 ORDER BY id DESC").all().map(hydrateJourney);
}

export function createDailyLog(journeyId, payload) {
  const journey = db.prepare("SELECT * FROM health_journeys WHERE id = ? AND user_id = 1").get(Number(journeyId));
  if (!journey) return null;
  const logDate = payload.date || toDateOnly();
  const status = payload.status === "skipped" ? "skipped" : "taken";

  db.prepare(`
    INSERT INTO daily_logs (journey_id, user_id, log_date, status)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(journey_id, user_id, log_date) DO UPDATE SET
      status = excluded.status,
      created_at = CURRENT_TIMESTAMP
  `).run(Number(journeyId), 1, logDate, status);

  if (logDate === toDateOnly()) {
    db.prepare(`
      UPDATE reminder_states SET status = 'dismissed', updated_at = CURRENT_TIMESTAMP
      WHERE journey_id = ? AND reminder_type = 'daily_intake_reminder'
    `).run(Number(journeyId));
  }

  return getJourneyById(journeyId);
}

export function createCheckin(journeyId, payload) {
  const day = Number(payload.checkpoint_day);
  const bowelScore = Number(payload.bowel_score);
  const bloatingScore = Number(payload.bloating_score);
  const sleepStressScore = Number(payload.sleep_stress_score);
  const overallScore = Number(payload.overall_score);

  db.prepare(`
    INSERT INTO journey_checkins (
      journey_id, user_id, checkpoint_day, continued_use, bowel_status, bloating_status,
      stress_sleep, self_score, willing_to_repurchase, bowel_score, bloating_score,
      sleep_stress_score, overall_score, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(journey_id, checkpoint_day) DO UPDATE SET
      continued_use = excluded.continued_use,
      bowel_status = excluded.bowel_status,
      bloating_status = excluded.bloating_status,
      stress_sleep = excluded.stress_sleep,
      self_score = excluded.self_score,
      willing_to_repurchase = excluded.willing_to_repurchase,
      bowel_score = excluded.bowel_score,
      bloating_score = excluded.bloating_score,
      sleep_stress_score = excluded.sleep_stress_score,
      overall_score = excluded.overall_score,
      notes = excluded.notes,
      created_at = CURRENT_TIMESTAMP
  `).run(
    Number(journeyId),
    1,
    day,
    payload.continued_use,
    `${bowelScore} / 10`,
    `${bloatingScore} / 10`,
    `${sleepStressScore} / 10`,
    overallScore,
    payload.willing_to_repurchase,
    bowelScore,
    bloatingScore,
    sleepStressScore,
    overallScore,
    payload.notes || ""
  );

  const reminderType = day === 90 ? "day_90_review" : `day_${day}_checkin`;
  db.prepare(`
    UPDATE reminder_states SET status = 'dismissed', updated_at = CURRENT_TIMESTAMP
    WHERE journey_id = ? AND reminder_type = ?
  `).run(Number(journeyId), reminderType);

  if (day === 90) {
    db.prepare("UPDATE health_journeys SET status = 'completed', current_day = 90, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(Number(journeyId));
  }

  return getJourneyById(journeyId);
}

export function updateReminder(id, payload) {
  const reminder = db.prepare("SELECT * FROM reminder_states WHERE id = ?").get(Number(id));
  if (!reminder) return null;
  const action = payload.action || "";

  if (action === "postpone") {
    db.prepare(`
      UPDATE reminder_states
      SET status = 'pending', scheduled_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(addDays(toDateOnly(), 1), Number(id));
  } else if (action === "reordered") {
    db.prepare(`
      UPDATE reminder_states
      SET status = 'pending', scheduled_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(addDays(toDateOnly(), 30), Number(id));
  } else {
    const status = payload.status;
    const allowed = ["pending", "sent", "dismissed"];
    const nextStatus = allowed.includes(status) ? status : "dismissed";
    db.prepare("UPDATE reminder_states SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(nextStatus, Number(id));
  }

  return db.prepare("SELECT * FROM reminder_states WHERE id = ?").get(Number(id));
}
