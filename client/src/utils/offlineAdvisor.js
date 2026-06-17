const DISCLAIMER =
  "本系統僅提供保健食品與營養補充參考，不能取代醫師、藥師或營養師建議。若有疾病、懷孕、兒童、長者、免疫低下或正在用藥，請先諮詢專業人員。";

const STORAGE_KEYS = {
  recommendations: "four-aspects-recommendations",
  journeys: "four-aspects-journeys",
  profile: "four-aspects-profile"
};

const planMap = {
  A: {
    level: "A",
    name: "基礎版",
    positioning: "日常保養、外食族、排便不規律",
    price_range: "NT$1,990～2,490",
    is_primary: false
  },
  B: {
    level: "B",
    name: "進階版",
    positioning: "高菌數、多菌株、熟齡保養、長期保健",
    price_range: "NT$3,990～4,990",
    is_primary: true
  },
  C: {
    level: "C",
    name: "旗艦版",
    positioning: "高規格原料、專業照護級營養支持、長期健康管理",
    price_range: "NT$6,990～8,990",
    is_primary: false
  }
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable in strict browser modes. The UI should still continue.
  }
}

function unique(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function differenceInDays(from, to) {
  return Math.floor((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000);
}

function getGrowthStage(currentDay) {
  if (currentDay >= 90) return { key: "completed", label: "完成", description: "90 天健康挑戰已完成。" };
  if (currentDay >= 60) return { key: "tree", label: "小樹", description: "持續累積生活習慣，準備完成挑戰。" };
  if (currentDay >= 30) return { key: "sprout", label: "發芽", description: "已完成第一階段，持續維持日常節奏。" };
  return { key: "seed", label: "種子", description: "從每日打卡開始，建立穩定的營養補充習慣。" };
}

function getPlanLevel(form, score) {
  const goals = form.primary_goals || [form.primary_goal].filter(Boolean);
  const concerns = form.concerns || [];
  const selected = [...goals, ...concerns];
  const highNeeds = selected.filter((item) => ["長期營養支持", "高規格保養", "長期保養"].includes(item)).length;
  const midNeeds = selected.filter((item) => ["熟齡健康管理", "女性日常保養", "睡眠壓力", "排便不規律"].includes(item)).length;

  if (selected.includes("高規格保養") || highNeeds >= 2 || (highNeeds >= 1 && midNeeds >= 2) || score < 55) return "C";
  if (selected.includes("熟齡健康管理") || selected.includes("長期保養") || selected.includes("長期營養支持") || midNeeds >= 2 || score < 80) return "B";
  return "A";
}

function getNeeds(form) {
  const goals = form.primary_goals || [form.primary_goal].filter(Boolean);
  const concerns = form.concerns || [];
  const goalNeeds = {
    "日常腸胃保養": ["腸胃順暢", "日常保養"],
    "外食族保養": ["外食族", "腸胃順暢"],
    "熟齡健康管理": ["日常保養", "排便調整"],
    "女性日常保養": ["女性私密保養", "日常保養"],
    "長期營養支持": ["日常保養", "熬夜族"],
    "高規格保養": ["日常保養", "熬夜族"],
    "其他": ["日常保養"]
  };
  const concernNeeds = {
    "排便不規律": ["排便調整"],
    "外食壓力": ["外食族"],
    "睡眠壓力": ["熬夜族"],
    "熟齡保養": ["日常保養", "排便調整"],
    "長期保養": ["日常保養"],
    "高規格保養": ["日常保養"],
    "女性日常保養": ["女性私密保養"]
  };

  return unique([
    ...goals.flatMap((goal) => goalNeeds[goal] || []),
    ...concerns.flatMap((concern) => concernNeeds[concern] || [])
  ]);
}

function calculateScore(form) {
  let score = 92;
  score -= { "幾乎不外食": 0, "每週 1-3 次": 5, "每週 4-6 次": 10, "幾乎每天": 16 }[form.eating_out_frequency] || 0;
  score -= { "大致規律": 0, "偶爾不規律": 8, "經常不規律": 16, "偏硬或偏稀": 18 }[form.bowel_status] || 0;
  score -= { "睡眠與壓力大致穩定": 0, "偶爾睡不好或壓力較高": 7, "經常睡不好或壓力較高": 14 }[form.stress_sleep] || 0;
  if (form.age_range === "65 歲以上") score -= 4;
  if ((form.concerns || []).includes("高規格保養")) score -= 4;
  return Math.max(35, Math.min(95, score));
}

export function buildLocalRecommendation(form, mode = "business") {
  const goals = form.primary_goals?.length ? form.primary_goals : [form.primary_goal || "日常腸胃保養"];
  const concerns = form.concerns || [];
  const needs = getNeeds({ ...form, primary_goals: goals });
  const score = calculateScore({ ...form, primary_goals: goals });
  const plan = planMap[getPlanLevel({ ...form, primary_goals: goals }, score)];
  const logId = Date.now();
  const targetGroup = form.age_range === "65 歲以上" ? "長者" : goals.includes("女性日常保養") ? "女性" : "成人";
  const highDemand = [...goals, ...concerns].filter((item) => ["熟齡健康管理", "長期營養支持", "長期保養", "高規格保養"].includes(item));

  const result = {
    recommendation_log_id: logId,
    request_summary: {
      user_type: mode,
      age: { "18-29 歲": 24, "30-44 歲": 37, "45-64 歲": 54, "65 歲以上": 68 }[form.age_range],
      age_range: form.age_range,
      gender: form.gender,
      target_group: targetGroup,
      needs,
      lifestyle: `${form.eating_out_frequency}；${form.stress_sleep}`,
      eating_out_frequency: form.eating_out_frequency,
      bowel_status: form.bowel_status,
      stress_sleep: form.stress_sleep,
      primary_goal: goals.join("、"),
      primary_goals: goals,
      concerns,
      special_conditions: [],
      description: form.description || ""
    },
    recommended_strains: [],
    recommended_strain_names: [],
    recommended_products: [],
    reasons: ["依據生活型態、排便狀況、睡眠壓力與保健目標，建立日常營養補充與 90 天追蹤方向。"],
    suggested_cfu: "請依產品標示食用，並依個人狀態保守調整。",
    paired_ingredients: ["益生元", "膳食纖維"],
    confidence_score: Math.min(95, Math.max(65, score)),
    gut_health_score: score,
    plan_recommendation: plan,
    lifestyle_analysis: [
      form.eating_out_frequency === "幾乎每天" || form.eating_out_frequency === "每週 4-6 次"
        ? "外食頻率偏高，建議優先建立固定飲水、蔬果與膳食纖維攝取習慣。"
        : "外食頻率目前相對可控，可持續留意膳食纖維與水分攝取。",
      form.bowel_status === "大致規律"
        ? "排便狀況大致規律，可將重點放在維持穩定生活習慣。"
        : "排便規律度仍有調整空間，適合從作息、飲水與纖維攝取同步管理。",
      highDemand.length
        ? "你選擇了較高規格或長期管理需求，建議用 90 天追蹤方式觀察日常狀態。"
        : "目前較適合以日常保養與容易持續的營養補充方案開始。"
    ],
    risk_alerts: concerns.length
      ? concerns.map((concern) => `${concern}：建議以日常保養與生活紀錄方式持續觀察。`)
      : ["目前沒有明顯高風險生活型態訊號，建議持續追蹤日常變化。"],
    lifestyle_advice: [
      "維持規律作息、足量飲水與適度活動，是長期保養的核心。",
      "外食日可優先補足蔬菜、原型食物與水分攝取。",
      "建議搭配 90 天打卡，觀察日常感受與續購需求。"
    ],
    front_facing_directions: unique(["腸道平衡", goals.includes("外食族保養") ? "外食壓力" : "", concerns.includes("排便不規律") ? "排便規律" : "", highDemand.length ? "長期健康管理" : ""]),
    attention_notes: ["推薦內容僅可作為保健食品與營養補充參考。", "請依產品標示食用，避免同時疊加多款相似產品造成攝取量過高。"],
    sales_talk: "可先從客戶的生活型態與保健目標切入，說明此結果作為日常營養補充與 90 天追蹤參考。",
    consumer_summary: "以下結果依照你填寫的生活型態整理，可作為日常保養與營養補充參考。",
    disclaimer: DISCLAIMER
  };

  const recommendations = readStorage(STORAGE_KEYS.recommendations, []);
  writeStorage(STORAGE_KEYS.recommendations, [result, ...recommendations].slice(0, 20));
  return result;
}

function normalizeLogFromRecommendation(item, index) {
  return {
    id: item.recommendation_log_id || index + 1,
    needs: item.request_summary?.needs || [],
    target_group: item.request_summary?.target_group || "成人",
    plan_level: item.plan_recommendation?.level || "A",
    gut_health_score: item.gut_health_score || 82,
    confidence_score: item.confidence_score || 82,
    created_at: item.created_at || new Date(Date.now() - index * 86400000).toISOString()
  };
}

export function getDemoDashboard() {
  const stored = readStorage(STORAGE_KEYS.recommendations, []);
  const recentLogs = stored.length
    ? stored.map(normalizeLogFromRecommendation).slice(0, 6)
    : [
        { id: 1, needs: ["日常保養", "外食族"], target_group: "成人", plan_level: "A", gut_health_score: 82, confidence_score: 82, created_at: new Date().toISOString() },
        { id: 2, needs: ["日常保養", "排便調整"], target_group: "長者", plan_level: "B", gut_health_score: 74, confidence_score: 78, created_at: addDays(todayString(), -2) },
        { id: 3, needs: ["女性私密保養", "日常保養"], target_group: "女性", plan_level: "B", gut_health_score: 79, confidence_score: 81, created_at: addDays(todayString(), -5) }
      ];

  const counts = new Map();
  recentLogs.forEach((log) => log.needs.forEach((need) => counts.set(need, (counts.get(need) || 0) + 1)));
  const popularNeeds = [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  return {
    recent_logs: recentLogs,
    popular_needs: popularNeeds.length ? popularNeeds : [{ label: "日常保養", count: 3 }, { label: "外食族", count: 2 }],
    common_conditions: [{ label: "外食壓力", count: 2 }, { label: "排便不規律", count: 1 }, { label: "睡眠壓力", count: 1 }],
    top_strains: [],
    total_analyses: recentLogs.length,
    average_confidence: Math.round(recentLogs.reduce((sum, log) => sum + log.confidence_score, 0) / recentLogs.length),
    average_health_score: Math.round(recentLogs.reduce((sum, log) => sum + log.gut_health_score, 0) / recentLogs.length),
    is_demo: !stored.length
  };
}

function buildReminders(journey) {
  const templates = [
    ["daily_intake_reminder", 1, "每日服用提醒：今天記得依產品標示完成營養補充。"],
    ["reorder_reminder", 24, "回購提醒：預估剩不到 7 天，建議準備下一盒。"],
    ["day_30_checkin", 30, "Day 30 回報提醒：記錄排便、脹氣與睡眠壓力狀況。"],
    ["day_60_checkin", 60, "Day 60 回報提醒：完成第二次生活型態回顧。"],
    ["day_90_review", 90, "Day 90 重新評估提醒：完成挑戰總結與下一階段規劃。"]
  ];
  return templates.map(([reminder_type, due_day, message], index) => ({
    id: Number(`${journey.id}${index + 1}`),
    journey_id: journey.id,
    user_id: 1,
    reminder_type,
    due_day,
    scheduled_date: reminder_type === "daily_intake_reminder" ? todayString() : addDays(journey.start_date, due_day - 1),
    status: reminder_type === "daily_intake_reminder" ? "sent" : "pending",
    message
  }));
}

function hydrateJourney(journey) {
  const today = todayString();
  const currentDay = Math.min(90, Math.max(1, differenceInDays(journey.start_date, today) + 1));
  const dailyLogs = journey.daily_logs || [];
  const takenDays = dailyLogs.filter((log) => log.status === "taken").length;
  const todayLog = dailyLogs.find((log) => log.log_date === today) || null;
  const productRemainingDays = 30 - (((currentDay - 1) % 30) + 1) + 1;
  const completedDays = new Set((journey.checkins || []).map((item) => Number(item.checkpoint_day)));
  const nextCheckpoint = [30, 60, 90].find((day) => !completedDays.has(day)) || 90;

  return {
    ...journey,
    current_day: currentDay,
    target_days: 90,
    product_days: 30,
    daily_logs: dailyLogs,
    today_log: todayLog,
    taken_days: takenDays,
    skipped_days: dailyLogs.filter((log) => log.status === "skipped").length,
    consecutive_days: takenDays,
    progress_percent: Math.min(100, Math.round((currentDay / 90) * 100)),
    remaining_days: Math.max(0, 90 - currentDay),
    next_checkpoint_day: nextCheckpoint,
    days_to_next_checkpoint: Math.max(0, nextCheckpoint - currentDay),
    product_remaining_days: productRemainingDays,
    show_reorder_reminder: productRemainingDays <= 7,
    growth_stage: getGrowthStage(currentDay),
    checkins: journey.checkins || [],
    reminders: journey.reminders || buildReminders(journey)
  };
}

export function getOfflineJourneys() {
  return readStorage(STORAGE_KEYS.journeys, []).map(hydrateJourney);
}

export function getOfflineJourney(id) {
  return getOfflineJourneys().find((journey) => Number(journey.id) === Number(id)) || null;
}

export function createOfflineJourney(payload = {}) {
  const journeys = readStorage(STORAGE_KEYS.journeys, []);
  const active = journeys.find((journey) => journey.status === "active");
  if (active) return hydrateJourney(active);

  const journey = {
    id: Date.now(),
    user_id: 1,
    recommendation_log_id: payload.recommendation_log_id || null,
    start_date: payload.start_date || todayString(),
    target_days: 90,
    product_days: 30,
    current_day: 1,
    initial_score: Number(payload.initial_score || 82),
    plan_level: payload.plan_level || "A",
    primary_goal: payload.primary_goal || "日常腸胃保養",
    status: "active",
    daily_logs: [],
    checkins: [],
    reminders: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  journey.reminders = buildReminders(journey);
  writeStorage(STORAGE_KEYS.journeys, [journey, ...journeys]);
  return hydrateJourney(journey);
}

export function createOfflineDailyLog(id, payload) {
  const journeys = readStorage(STORAGE_KEYS.journeys, []);
  const next = journeys.map((journey) => {
    if (Number(journey.id) !== Number(id)) return journey;
    const logDate = payload.date || todayString();
    const logs = (journey.daily_logs || []).filter((log) => log.log_date !== logDate);
    return {
      ...journey,
      daily_logs: [{ id: Date.now(), journey_id: journey.id, user_id: 1, log_date: logDate, status: payload.status || "taken", created_at: new Date().toISOString() }, ...logs],
      updated_at: new Date().toISOString()
    };
  });
  writeStorage(STORAGE_KEYS.journeys, next);
  return getOfflineJourney(id);
}

export function createOfflineCheckin(id, payload) {
  const journeys = readStorage(STORAGE_KEYS.journeys, []);
  const next = journeys.map((journey) => {
    if (Number(journey.id) !== Number(id)) return journey;
    const checkins = (journey.checkins || []).filter((item) => Number(item.checkpoint_day) !== Number(payload.checkpoint_day));
    return {
      ...journey,
      checkins: [{ id: Date.now(), journey_id: journey.id, user_id: 1, ...payload, created_at: new Date().toISOString() }, ...checkins],
      updated_at: new Date().toISOString()
    };
  });
  writeStorage(STORAGE_KEYS.journeys, next);
  return getOfflineJourney(id);
}

export function updateOfflineReminder(id, payload) {
  const journeys = readStorage(STORAGE_KEYS.journeys, []);
  const next = journeys.map((journey) => ({
    ...journey,
    reminders: (journey.reminders || buildReminders(journey)).map((reminder) => {
      if (Number(reminder.id) !== Number(id)) return reminder;
      if (payload.action === "postpone") return { ...reminder, status: "pending", scheduled_date: addDays(todayString(), 1) };
      if (payload.action === "reordered") return { ...reminder, status: "pending", scheduled_date: addDays(todayString(), 30) };
      return { ...reminder, status: payload.status || "dismissed" };
    })
  }));
  writeStorage(STORAGE_KEYS.journeys, next);
  return next.flatMap((journey) => journey.reminders || []).find((reminder) => Number(reminder.id) === Number(id)) || null;
}

export function getOfflineProfile() {
  return readStorage(STORAGE_KEYS.profile, {
    display_name: "Demo 使用者",
    age: 37,
    gender: "不指定",
    diet_habits: "外食偶爾偏多，想建立穩定日常保養習慣",
    health_goals: "維持日常保養與長期健康管理",
    health_needs: ["日常腸胃保養", "外食族保養"]
  });
}

export function updateOfflineProfile(profile) {
  writeStorage(STORAGE_KEYS.profile, profile);
  return profile;
}
