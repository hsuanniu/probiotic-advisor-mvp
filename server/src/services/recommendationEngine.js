import { DISCLAIMER, PROFESSIONAL_CONSULT_NOTICE } from "../utils/disclaimer.js";

const ruleMap = {
  "腸胃順暢": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium lactis"],
    ingredients: ["益生元", "膳食纖維"],
    reason: "此需求常見於日常消化道保養情境，可優先參考與腸道菌相支持相關的菌種方向。"
  },
  "排便調整": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium lactis"],
    ingredients: ["益生元", "膳食纖維"],
    reason: "此需求適合參考搭配膳食纖維或益生元的菌種組合，作為日常排便節律保養參考。"
  },
  "過敏體質調整": {
    strains: ["Lactobacillus paracasei", "Lactobacillus rhamnosus"],
    ingredients: ["乳鐵蛋白", "益生元"],
    reason: "此類需求只能作為體質保養方向參考，不應宣稱可處理特定過敏或疾病。"
  },
  "女性私密保養": {
    strains: ["Lactobacillus crispatus", "Lactobacillus rhamnosus"],
    ingredients: ["蔓越莓"],
    reason: "女性日常保養可參考與女性菌相支持相關的乳酸菌方向，並搭配蔓越莓等常見保健成分。"
  },
  "兒童保健": {
    strains: ["Bifidobacterium breve", "Lactobacillus rhamnosus"],
    ingredients: ["益生元"],
    reason: "兒童保健建議採保守劑量與簡單成分，並依產品標示與專業建議使用。"
  },
  "寵物腸胃": {
    strains: ["Enterococcus faecium", "Lactobacillus acidophilus"],
    ingredients: ["寵物專用配方"],
    reason: "寵物應選擇標示為寵物專用的產品，並依獸醫或產品標示建議作為保健參考。"
  },
  "外食族": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium longum"],
    ingredients: ["綜合型益生菌", "膳食纖維"],
    reason: "外食族可參考綜合型菌種與膳食纖維搭配，作為日常飲食不均衡時的保養輔助。"
  },
  "熬夜族": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium longum"],
    ingredients: ["綜合型益生菌", "益生元"],
    reason: "熬夜族可著重日常保養與飲食作息支持，產品說明應避免過度承諾。"
  },
  "旅遊備用": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium lactis"],
    ingredients: ["粉包劑型", "綜合型益生菌"],
    reason: "旅遊備用情境可參考攜帶方便、食用方式簡單的益生菌產品。"
  },
  "日常保養": {
    strains: ["Lactobacillus plantarum", "Bifidobacterium longum"],
    ingredients: ["綜合型益生菌", "益生元"],
    reason: "日常保養適合參考成分單純、使用情境廣泛的綜合型產品。"
  }
};

const sensitiveConditions = ["懷孕", "長期用藥", "免疫低下", "疾病", "兒童", "長者"];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function overlaps(a = [], b = []) {
  return a.some((item) => b.includes(item));
}

function scoreProduct(product, request, recommendedStrains) {
  let score = 0;
  if (overlaps(product.main_needs, request.needs)) score += 30;
  if (product.target_group === request.target_group) score += 20;
  if (product.target_group === "成人" && request.target_group !== "寵物") score += 8;
  if (overlaps(product.strains, recommendedStrains)) score += 25;
  if (request.needs.includes("旅遊備用") && product.dosage_form === "粉包") score += 10;
  return score;
}

function calculateConfidence(request, matchedProductCount, recommendedStrains) {
  let confidence = 35;
  confidence += Math.min(request.needs.length * 10, 25);
  confidence += Math.min(recommendedStrains.length * 5, 20);
  confidence += Math.min(matchedProductCount * 5, 15);

  if (request.special_conditions?.length) confidence -= 10;
  if (request.special_conditions?.some((condition) => sensitiveConditions.includes(condition))) {
    confidence -= 10;
  }

  return Math.max(35, Math.min(confidence, 95));
}

function getCfuRange(strains, strainRows) {
  const matched = strainRows.filter((strain) => strains.includes(strain.strain_name));
  if (!matched.length) {
    return "建議依產品標示食用，第一版可參考每日 10-100 億 CFU 的保健食品常見區間。";
  }

  const min = Math.min(...matched.map((strain) => strain.suggested_cfu_min));
  const max = Math.max(...matched.map((strain) => strain.suggested_cfu_max));
  return `可參考每日 ${min.toLocaleString()}-${max.toLocaleString()} CFU，仍需依產品標示與個人情況調整。`;
}

function calculateGutHealthScore(request) {
  let score = 92;
  const eatingOutPenalty = {
    "幾乎不外食": 0,
    "每週 1-3 次": 5,
    "每週 4-6 次": 10,
    "幾乎每天": 16
  };
  const bowelPenalty = {
    "大致規律": 0,
    "偶爾不規律": 8,
    "經常不規律": 16,
    "偏硬或偏稀": 18
  };
  const stressPenalty = {
    "睡眠與壓力大致穩定": 0,
    "偶爾睡不好或壓力較高": 7,
    "經常睡不好或壓力較高": 14
  };

  score -= eatingOutPenalty[request.eating_out_frequency] || 0;
  score -= bowelPenalty[request.bowel_status] || 0;
  score -= stressPenalty[request.stress_sleep] || 0;
  if (request.age_range === "65 歲以上") score -= 4;
  return Math.max(35, Math.min(95, score));
}

function getPlanRecommendation(score, request) {
  const goals = request.primary_goals?.length
    ? request.primary_goals
    : String(request.primary_goal || "日常腸胃保養").split("、").filter(Boolean);
  const concerns = request.concerns || [];
  const selected = [...goals, ...concerns];
  const highNeeds = selected.filter((item) => ["長期營養支持", "高規格保養", "長期保養"].includes(item)).length;
  const midNeeds = selected.filter((item) => ["熟齡健康管理", "女性日常保養", "睡眠壓力", "排便不規律"].includes(item)).length;

  if (
    selected.includes("高規格保養") ||
    highNeeds >= 2 ||
    (highNeeds >= 1 && midNeeds >= 2) ||
    score < 48 ||
    (goals.some((goal) => ["熟齡健康管理", "長期營養支持"].includes(goal)) && request.stress_sleep === "經常睡不好或壓力較高")
  ) {
    return {
      level: "C",
      name: "旗艦版",
      positioning: "高規格原料、專業照護級營養支持、長期健康管理",
      price_range: "NT$6,990～8,990",
      is_primary: false
    };
  }

  if (
    score < 80 ||
    goals.some((goal) => ["熟齡健康管理", "長期營養支持", "女性日常保養"].includes(goal)) ||
    concerns.some((concern) => ["長期保養", "熟齡保養", "排便不規律", "睡眠壓力"].includes(concern)) ||
    midNeeds >= 2
  ) {
    return {
      level: "B",
      name: "進階版",
      positioning: "高菌數、多菌株、熟齡保養、長期保健",
      price_range: "NT$3,990～4,990",
      is_primary: true
    };
  }

  return {
    level: "A",
    name: "基礎版",
    positioning: "日常保養、外食族、排便不規律",
    price_range: "NT$1,990～2,490",
    is_primary: false
  };
}

function buildLifestyleAnalysis(request) {
  const analysis = [];
  const riskAlerts = [];
  const lifestyleAdvice = [];

  if (request.eating_out_frequency === "幾乎每天" || request.eating_out_frequency === "每週 4-6 次") {
    analysis.push("外食頻率較高，日常飲食中的蔬果、膳食纖維與水分攝取可能較不穩定。");
    riskAlerts.push("外食壓力偏高，建議優先建立固定飲水與蔬果攝取習慣。");
    lifestyleAdvice.push("每日至少安排一餐加入兩種蔬菜，並以原型食物取代部分精緻點心。");
  } else {
    analysis.push("外食頻率目前相對可控，可持續留意膳食纖維與水分攝取。");
  }

  if (request.bowel_status && request.bowel_status !== "大致規律") {
    analysis.push("目前排便規律度仍有調整空間，適合從作息、飲水與纖維攝取同步管理。");
    riskAlerts.push("排便節律不穩定時，不建議只依賴單一營養補充品。");
    lifestyleAdvice.push("固定用餐與活動時間，逐步增加膳食纖維並觀察個人適應狀況。");
  } else {
    analysis.push("排便狀況大致規律，可將重點放在維持穩定生活習慣。");
  }

  if (request.stress_sleep === "經常睡不好或壓力較高") {
    analysis.push("睡眠與壓力負荷較高，可能影響日常消化感受與保養持續度。");
    riskAlerts.push("長期高壓與睡眠不足會降低健康管理的持續性。");
    lifestyleAdvice.push("每天保留固定放鬆時段，並盡量維持一致的入睡時間。");
  } else {
    lifestyleAdvice.push("維持規律作息、足量飲水與適度活動，是長期保養的核心。");
  }

  return {
    analysis: unique(analysis),
    risk_alerts: unique(riskAlerts.length ? riskAlerts : ["目前沒有明顯高風險生活型態訊號，建議持續追蹤日常變化。"]),
    lifestyle_advice: unique(lifestyleAdvice)
  };
}

export function buildRecommendation(request, products, strains) {
  const needs = request.needs || [];
  const rules = needs.map((need) => ruleMap[need]).filter(Boolean);
  const recommendedStrainNames = unique(rules.flatMap((rule) => rule.strains));
  const pairedIngredients = unique(rules.flatMap((rule) => rule.ingredients));
  const reasons = unique(rules.map((rule) => rule.reason));
  const matchedStrains = strains.filter((strain) => recommendedStrainNames.includes(strain.strain_name));

  const rankedProducts = products
    .map((product) => ({
      ...product,
      match_score: scoreProduct(product, { ...request, needs }, recommendedStrainNames)
    }))
    .filter((product) => product.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 4);

  const hasSensitiveCondition =
    request.special_conditions?.length ||
    ["兒童", "長者", "寵物"].includes(request.target_group);

  const confidence = calculateConfidence(request, rankedProducts.length, recommendedStrainNames);
  const cfuRange = getCfuRange(recommendedStrainNames, strains);
  const gutHealthScore = calculateGutHealthScore(request);
  const planRecommendation = getPlanRecommendation(gutHealthScore, request);
  const lifestyle = buildLifestyleAnalysis(request);
  const attentionNotes = [
    "推薦內容僅可作為保健食品與營養補充參考。",
    "請依產品標示食用，避免同時疊加多款相似產品造成攝取量過高。",
    hasSensitiveCondition ? PROFESSIONAL_CONSULT_NOTICE : "",
    request.needs?.includes("過敏體質調整") ? "過敏體質相關說明不得宣稱處理或控制特定過敏狀況。" : "",
    request.target_group === "寵物" ? "寵物請選擇寵物專用產品，並優先參考獸醫建議。" : ""
  ].filter(Boolean);

  return {
    request_summary: {
      user_type: request.user_type,
      age: request.age,
      gender: request.gender,
      target_group: request.target_group,
      needs,
      lifestyle: request.lifestyle,
      age_range: request.age_range || "",
      eating_out_frequency: request.eating_out_frequency || "",
      bowel_status: request.bowel_status || "",
      stress_sleep: request.stress_sleep || "",
      primary_goal: request.primary_goal || "",
      primary_goals: request.primary_goals || [],
      concerns: request.concerns || [],
      special_conditions: request.special_conditions || [],
      description: request.description || ""
    },
    recommended_strains: matchedStrains,
    recommended_strain_names: recommendedStrainNames,
    recommended_products: rankedProducts,
    reasons,
    suggested_cfu: cfuRange,
    paired_ingredients: pairedIngredients,
    confidence_score: confidence,
    gut_health_score: gutHealthScore,
    plan_recommendation: planRecommendation,
    lifestyle_analysis: lifestyle.analysis,
    risk_alerts: lifestyle.risk_alerts,
    lifestyle_advice: lifestyle.lifestyle_advice,
    front_facing_directions: unique([
      "腸道平衡",
      request.eating_out_frequency === "幾乎每天" || request.eating_out_frequency === "每週 4-6 次" ? "外食壓力" : "",
      request.bowel_status !== "大致規律" ? "排便規律" : "",
      request.age_range === "65 歲以上" || request.primary_goals?.includes("熟齡健康管理") || request.concerns?.includes("熟齡保養") ? "熟齡保養" : "",
      request.primary_goals?.includes("長期營養支持") || request.concerns?.includes("長期保養") ? "長期營養支持" : ""
    ]),
    attention_notes: attentionNotes,
    sales_talk:
      "可以先從客戶的日常需求與使用族群切入，說明這些菌種方向可作為保健參考，再提醒依產品標示與專業建議使用。",
    consumer_summary:
      "以下結果是依照你填寫的需求整理出的益生菌菌種與產品方向，可作為日常保養與營養補充參考。",
    disclaimer: DISCLAIMER
  };
}
