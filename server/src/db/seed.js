import { initializeDatabase, db } from "./database.js";
import { createProduct } from "../repositories/productRepository.js";
import { createStrain } from "../repositories/strainRepository.js";
import { ensureDefaultProfile } from "../repositories/profileRepository.js";

initializeDatabase();

db.prepare("DELETE FROM journey_checkins").run();
db.prepare("DELETE FROM daily_logs").run();
db.prepare("DELETE FROM reminder_states").run();
db.prepare("DELETE FROM health_journeys").run();
db.prepare("DELETE FROM recommendation_logs").run();
db.prepare("DELETE FROM favorites").run();
db.prepare("DELETE FROM user_profiles").run();
db.prepare("DELETE FROM products").run();
db.prepare("DELETE FROM strains").run();

const strains = [
  {
    strain_name: "Lactobacillus plantarum",
    strain_code: "LP-01",
    application_areas: ["腸胃順暢", "排便調整", "外食族", "日常保養"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "成人",
    warnings: "特殊狀況者請先諮詢專業人員。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Bifidobacterium lactis",
    strain_code: "BL-04",
    application_areas: ["腸胃順暢", "排便調整", "旅遊備用"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 15000000000,
    target_group: "成人",
    warnings: "請依產品標示食用。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Lactobacillus paracasei",
    strain_code: "LPC-37",
    application_areas: ["過敏體質調整"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "成人",
    warnings: "不得宣稱處理特定過敏或疾病。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Lactobacillus rhamnosus",
    strain_code: "LR-32",
    application_areas: ["過敏體質調整", "女性私密保養", "兒童保健"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "成人 / 兒童 / 女性",
    warnings: "兒童、孕期或用藥者請先諮詢專業人員。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Lactobacillus crispatus",
    strain_code: "LC-11",
    application_areas: ["女性私密保養"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "女性",
    warnings: "女性特殊狀況請先諮詢專業人員。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Bifidobacterium breve",
    strain_code: "BB-03",
    application_areas: ["兒童保健"],
    suggested_cfu_min: 500000000,
    suggested_cfu_max: 5000000000,
    target_group: "兒童",
    warnings: "兒童使用請依年齡、產品標示與專業建議評估。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Enterococcus faecium",
    strain_code: "EF-PET",
    application_areas: ["寵物腸胃"],
    suggested_cfu_min: 100000000,
    suggested_cfu_max: 5000000000,
    target_group: "寵物",
    warnings: "需選擇寵物專用產品，並參考獸醫建議。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Lactobacillus acidophilus",
    strain_code: "LA-14",
    application_areas: ["寵物腸胃", "日常保養"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "成人 / 寵物",
    warnings: "寵物需使用寵物專用配方。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  },
  {
    strain_name: "Bifidobacterium longum",
    strain_code: "BLG-22",
    application_areas: ["外食族", "熬夜族", "日常保養"],
    suggested_cfu_min: 1000000000,
    suggested_cfu_max: 10000000000,
    target_group: "成人",
    warnings: "請依產品標示食用。",
    evidence_notes: "保留參考文獻欄位，MVP mock data。"
  }
];

const products = [
  {
    brand_name: "FloraLab",
    product_name: "Gut Balance Daily Probiotic",
    target_group: "成人",
    main_needs: ["腸胃順暢", "排便調整", "日常保養"],
    strains: ["Lactobacillus plantarum", "Bifidobacterium lactis"],
    cfu_per_serving: "100 億 CFU",
    dosage_form: "膠囊",
    usage_instruction: "每日 1 粒，依產品標示食用。",
    warnings: "特殊狀況者請先諮詢專業人員。",
    price: 980,
    product_url: "https://example.com/gut-balance"
  },
  {
    brand_name: "FloraLab",
    product_name: "Fiber Flora Sachet",
    target_group: "成人",
    main_needs: ["腸胃順暢", "排便調整", "外食族"],
    strains: ["Lactobacillus plantarum", "Bifidobacterium longum"],
    cfu_per_serving: "80 億 CFU",
    dosage_form: "粉包",
    usage_instruction: "每日 1 包，可搭配冷水或常溫飲品。",
    warnings: "請避免以高溫飲品沖泡。",
    price: 880,
    product_url: "https://example.com/fiber-flora"
  },
  {
    brand_name: "PureBiome",
    product_name: "Daily Defense Flora",
    target_group: "成人",
    main_needs: ["過敏體質調整", "日常保養"],
    strains: ["Lactobacillus paracasei", "Lactobacillus rhamnosus"],
    cfu_per_serving: "120 億 CFU",
    dosage_form: "膠囊",
    usage_instruction: "每日 1 粒，建議固定時間食用。",
    warnings: "不得作為特定過敏或疾病相關宣稱。",
    price: 1280,
    product_url: "https://example.com/daily-defense"
  },
  {
    brand_name: "Her Flora",
    product_name: "Women Flora Cranberry Probiotic",
    target_group: "女性",
    main_needs: ["女性私密保養", "日常保養"],
    strains: ["Lactobacillus crispatus", "Lactobacillus rhamnosus"],
    cfu_per_serving: "100 億 CFU",
    dosage_form: "膠囊",
    usage_instruction: "每日 1 粒，依產品標示食用。",
    warnings: "孕期、哺乳或用藥者請先諮詢專業人員。",
    price: 1380,
    product_url: "https://example.com/women-flora"
  },
  {
    brand_name: "TinyBiome",
    product_name: "Kids Gentle Probiotic",
    target_group: "兒童",
    main_needs: ["兒童保健", "腸胃順暢"],
    strains: ["Bifidobacterium breve", "Lactobacillus rhamnosus"],
    cfu_per_serving: "30 億 CFU",
    dosage_form: "粉包",
    usage_instruction: "依年齡與產品標示食用，可加入常溫食物。",
    warnings: "兒童使用請先由照護者評估，必要時諮詢專業人員。",
    price: 760,
    product_url: "https://example.com/kids-gentle"
  },
  {
    brand_name: "PetBiome",
    product_name: "Pet Digestive Flora Support",
    target_group: "寵物",
    main_needs: ["寵物腸胃"],
    strains: ["Enterococcus faecium", "Lactobacillus acidophilus"],
    cfu_per_serving: "20 億 CFU",
    dosage_form: "粉包",
    usage_instruction: "依寵物體重與產品標示混入飼料。",
    warnings: "僅供寵物使用，特殊狀況請先諮詢獸醫。",
    price: 690,
    product_url: "https://example.com/pet-flora"
  },
  {
    brand_name: "TravelBiome",
    product_name: "Travel Daily Probiotic Sachet",
    target_group: "成人",
    main_needs: ["旅遊備用", "外食族", "日常保養"],
    strains: ["Lactobacillus plantarum", "Bifidobacterium lactis"],
    cfu_per_serving: "60 億 CFU",
    dosage_form: "粉包",
    usage_instruction: "每日 1 包，旅遊時可隨身攜帶。",
    warnings: "請依產品標示食用，特殊狀況請先諮詢專業人員。",
    price: 620,
    product_url: "https://example.com/travel-daily"
  },
  {
    brand_name: "NightCare",
    product_name: "Late Night Flora Blend",
    target_group: "成人",
    main_needs: ["熬夜族", "外食族", "日常保養"],
    strains: ["Lactobacillus plantarum", "Bifidobacterium longum"],
    cfu_per_serving: "100 億 CFU",
    dosage_form: "錠劑",
    usage_instruction: "每日 1 錠，搭配均衡飲食與作息調整。",
    warnings: "本產品僅作為日常保養參考，不取代專業建議。",
    price: 990,
    product_url: "https://example.com/late-night-flora"
  }
];

strains.forEach(createStrain);
products.forEach(createProduct);
ensureDefaultProfile();

console.log(`Seed completed: ${strains.length} strains, ${products.length} products.`);
