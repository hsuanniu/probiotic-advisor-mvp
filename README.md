# 四象生活健康顧問

AI Probiotic Advisor 是一套「AI 益生菌推薦系統」MVP。第一版使用 rule-based recommendation engine，不進行醫療診斷，也不宣稱產品可處理任何疾病。

目前產品定位已延伸為「四象生活 AI 健康顧問 + 90 天益生菌追蹤工具」：

- 7 題生活型態短問卷
- 腸道健康分數
- A / B / C 營養補充方案等級
- 90 天健康旅程
- 每日服用打卡與連續天數
- Day 30 / 60 / 90 階段回報
- 每日食用、回報與回購提醒狀態

系統定位：

- 營養保健參考
- 菌種方向建議
- 產品推薦輔助
- 業務、客服、門市與消費者自助查詢工具

全站免責聲明：

```text
本系統僅提供保健食品與營養補充參考，不能取代醫師、藥師或營養師建議。若有疾病、懷孕、兒童、長者、免疫低下或正在用藥，請先諮詢專業人員。
```

## 技術架構

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite via Node.js built-in `node:sqlite`
- Recommendation: rule-based engine
- Future AI: 已預留 OpenAI service 介面，但 MVP 不實際呼叫外部 API

## 專案結構

```text
.
├── AI-Probiotic-Advisor-MVP-Feasibility-Report.md
├── README.md
├── package.json
├── client
│   ├── index.html
│   ├── package.json
│   └── src
│       ├── App.jsx
│       ├── api
│       │   └── client.js
│       ├── components
│       │   ├── Disclaimer.jsx
│       │   ├── FormField.jsx
│       │   └── Navigation.jsx
│       ├── main.jsx
│       ├── pages
│       │   ├── HomePage.jsx
│       │   ├── IntakePage.jsx
│       │   ├── ProductAdminPage.jsx
│       │   ├── RecommendationResultPage.jsx
│       │   └── StrainAdminPage.jsx
│       └── styles
│           └── global.css
└── server
    ├── package.json
    └── src
        ├── app.js
        ├── db
        │   ├── database.js
        │   ├── schema.sql
        │   └── seed.js
        ├── repositories
        │   ├── productRepository.js
        │   ├── recommendationLogRepository.js
        │   └── strainRepository.js
        ├── routes
        │   ├── productRoutes.js
        │   ├── recommendationRoutes.js
        │   └── strainRoutes.js
        ├── server.js
        ├── services
        │   ├── openaiRecommendationService.js
        │   └── recommendationEngine.js
        └── utils
            ├── disclaimer.js
            └── safetyLanguage.js
```

## 安裝

需求：

- Node.js 24 或以上
- npm

```bash
npm install
npm run install:all
```

備註：後端使用 Node.js 內建 `node:sqlite`，所以不需要安裝 native SQLite 套件。執行時若看到 SQLite experimental warning，屬於 Node.js 24 目前的提示，不影響 MVP 使用。

## 初始化資料庫

```bash
npm run db:seed
```

資料庫會建立在：

```text
server/data/probiotic-advisor.sqlite
```

## 本機啟動

```bash
npm run dev
```

預設網址：

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

## 分享給不同地方的人測試

若測試者不在同一個 Wi-Fi，建議使用 ngrok 建立暫時公開網址。

### 1. 建立 production 版並啟動

先停止原本的前後端開發伺服器，然後執行：

```bash
npm run share
```

成功後，後端會啟動在：

```text
http://localhost:4000
```

此時前端頁面也會由同一個 4000 port 提供，所以本機可開：

```text
http://localhost:4000
```

### 2. 安裝 ngrok

若 Mac 尚未安裝 ngrok，可到官方網站下載：

```text
https://ngrok.com/download
```

或使用 Homebrew：

```bash
brew install ngrok
```

### 3. 開啟公開測試網址

另開一個終端機視窗，執行：

```bash
ngrok http 4000
```

ngrok 會顯示一個類似這樣的網址：

```text
https://xxxx-xxxx-xxxx.ngrok-free.app
```

把這個 `https` 網址傳給測試者即可。

注意：MVP 目前沒有登入權限，取得網址的人可以使用產品管理與菌種管理功能。公開分享前建議只給可信任測試者。

## 主要頁面

1. 首頁
   - 標題：AI Probiotic Advisor
   - 模式選擇：業務版 / 消費者版

2. 需求輸入頁
   - 年齡、性別、使用者類型
   - 多選主要需求
   - 飲食習慣、特殊狀況、補充描述

3. 推薦結果頁
   - 使用者需求摘要
   - 推薦菌種與產品
   - 推薦原因、CFU 區間、搭配成分、注意事項
   - 業務版話術或消費者版簡單說明

4. 產品管理頁
   - 新增、編輯、刪除、查看產品

5. 菌種管理頁
   - 新增、編輯、刪除、查看菌種

## API

### Recommendations

```http
POST /api/recommendations
```

Request example:

```json
{
  "user_type": "business",
  "age": 35,
  "gender": "女性",
  "target_group": "成人",
  "needs": ["腸胃順暢", "外食族"],
  "lifestyle": "外食多，作息不固定",
  "special_conditions": [],
  "description": "希望找日常保養方向"
}
```

### Products

```http
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

### Strains

```http
GET /api/strains
POST /api/strains
PUT /api/strains/:id
DELETE /api/strains/:id
```

## SQLite Schema

Schema 位於：

```text
server/src/db/schema.sql
```

包含：

- users_optional
- user_profiles
- products
- strains
- recommendation_logs
- favorites
- health_journeys
- journey_checkins
- reminder_states
- daily_logs

## 90 天健康旅程 API

```http
GET /api/journeys
GET /api/journeys/:id
POST /api/journeys
POST /api/journeys/:id/daily-logs
POST /api/journeys/:id/checkins
PUT /api/journeys/reminders/:id
```

追蹤節點：

- Day 1：建立初始分數
- Day 30：第一次回報
- Day 60：第二次回報
- Day 90：重新評估

每日打卡狀態：

- `taken`：已服用
- `skipped`：今天略過

提醒狀態：

- `pending`：待排程
- `sent`：已顯示站內提醒
- `dismissed`：已處理

`main_needs`、`strains`、`application_areas`、`needs`、`recommended_strains`、`recommended_products` 第一版使用 JSON 字串儲存，方便 SQLite MVP 使用。未來改 PostgreSQL 時可轉成 `jsonb` 或關聯表。

## Rule-based Recommendation Engine

位置：

```text
server/src/services/recommendationEngine.js
```

第一版規則：

- 腸胃順暢 / 排便調整：Lactobacillus plantarum、Bifidobacterium lactis
- 過敏體質調整：Lactobacillus paracasei、Lactobacillus rhamnosus
- 女性私密保養：Lactobacillus crispatus、Lactobacillus rhamnosus
- 兒童保健：Bifidobacterium breve、Lactobacillus rhamnosus
- 寵物腸胃：Enterococcus faecium、Lactobacillus acidophilus
- 外食族 / 熬夜族 / 日常保養：Lactobacillus plantarum、Bifidobacterium longum

信心分數依據：

- 需求與規則命中
- 產品主打需求命中
- 使用者類型與適用族群命中
- 產品菌種與推薦菌種命中
- 特殊狀況會降低分數並加強注意事項

## OpenAI API 預留位置

位置：

```text
server/src/services/openaiRecommendationService.js
```

MVP 目前不呼叫 OpenAI API。未來可在此加入：

- 業務話術潤飾
- 消費者版簡化說明
- 安全文案檢查
- 推薦摘要生成

建議維持 rule-based engine 作為核心決策來源，OpenAI 僅作為文案輔助，避免不可稽核的推薦結果。

## SaaS 擴充建議

未來可擴充：

- 使用者登入與角色權限
- 公司、品牌、門市多租戶
- PostgreSQL
- 推薦紀錄分析儀表板
- 產品資料匯入匯出
- 業務與客服話術模板
- 安全文案與禁用語審核
- OpenAI API 文案輔助
- 產品連結與電商整合
- 知識庫與參考文獻管理

## 合規提醒

本專案刻意避免使用治療、診斷、治癒、改善疾病、預防疾病、替代藥物等醫療宣稱語言。推薦結果只能作為保健食品與營養補充參考，所有特殊狀況都會提示先諮詢專業人員。
