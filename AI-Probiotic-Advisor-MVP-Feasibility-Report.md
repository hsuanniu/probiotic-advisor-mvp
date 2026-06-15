# AI Probiotic Advisor MVP 可行性評估報告

建立日期：2026-05-14

## 1. 結論摘要

「AI 益生菌推薦系統」MVP 技術上可行，且適合以 React + Node.js + Express + SQLite + rule-based recommendation engine 先行落地。

第一版不需要真正串接大型語言模型，也不需要複雜醫療知識圖譜。只要清楚定義產品資料、菌種資料、需求分類、禁用語與免責聲明，就可以做出可本機執行、可給內部業務與消費者試用的 MVP。

本系統應定位為：

- 營養保健參考工具
- 菌種方向建議工具
- 產品推薦輔助工具
- 內部業務與客服話術輔助工具

本系統不應定位為：

- 醫療診斷工具
- 疾病治療建議工具
- 個人化醫療處方工具
- 取代醫師、藥師或營養師的專業判斷工具

## 2. MVP 可行性判斷

| 項目 | 評估 | 說明 |
| --- | --- | --- |
| 前端 React | 可行 | 表單、結果頁、管理頁都屬於標準 CRUD 與互動 UI |
| 後端 Express | 可行 | API 數量少，Express 足以支援第一版 |
| SQLite | 可行 | 適合 mock data、本機展示、內部 demo |
| Rule-based 推薦 | 可行 | 第一版需求類型有限，可用規則表達 |
| OpenAI API 預留 | 可行 | 可先建立 service interface，不實際呼叫 |
| 未來 PostgreSQL | 可行 | 只要資料存取層抽象良好，遷移成本可控 |
| B2B / B2C 雙模式 | 可行 | 可共用推薦引擎，輸出文案依模式切換 |
| 合規與安全 | 需謹慎 | 必須避免治療、診斷、疾病改善等語言 |

整體建議：可以進入 MVP 開發。

## 3. 建議 MVP 範圍

第一版應控制在「可以跑、可以管理資料、可以輸出保守推薦」。

### 必做功能

1. 首頁
   - 顯示產品名稱：AI Probiotic Advisor
   - 顯示系統定位與免責聲明
   - 選擇業務版或消費者版

2. 需求輸入頁
   - 年齡、性別、使用者類型
   - 多選主要需求
   - 飲食習慣
   - 特殊狀況
   - 補充描述

3. 推薦結果頁
   - 使用者需求摘要
   - 推薦菌種
   - 推薦原因
   - 建議 CFU 區間
   - 可搭配成分
   - 推薦產品
   - 信心分數
   - 注意事項
   - 業務版說明話術
   - 消費者版簡短說明
   - 免責聲明

4. 產品管理頁
   - 產品列表
   - 新增、編輯、刪除產品

5. 菌種管理頁
   - 菌種列表
   - 新增、編輯、刪除菌種

6. 後端 API
   - POST /api/recommendations
   - GET /api/products
   - POST /api/products
   - PUT /api/products/:id
   - DELETE /api/products/:id
   - GET /api/strains
   - POST /api/strains
   - PUT /api/strains/:id
   - DELETE /api/strains/:id

### 第一版不建議做

- 使用者登入權限
- 多租戶 SaaS 架構
- 金流
- 真正 AI 對話式問診
- 醫療文獻自動摘要
- 外部產品 API
- 複雜推薦模型
- 自動宣稱審核

這些適合放到第二階段或 SaaS 化階段。

## 4. 技術架構建議

建議專案採用單一 repo，前後端分資料夾：

```text
ai-probiotic-advisor/
  README.md
  package.json
  server/
    package.json
    src/
      app.js
      server.js
      db/
        database.js
        schema.sql
        seed.js
      repositories/
        productRepository.js
        strainRepository.js
        recommendationLogRepository.js
      routes/
        productRoutes.js
        strainRoutes.js
        recommendationRoutes.js
      services/
        recommendationEngine.js
        openaiRecommendationService.js
      utils/
        disclaimer.js
        safetyLanguage.js
  client/
    package.json
    src/
      App.jsx
      main.jsx
      api/
        client.js
      components/
        Disclaimer.jsx
        Navigation.jsx
        FormField.jsx
      pages/
        HomePage.jsx
        IntakePage.jsx
        RecommendationResultPage.jsx
        ProductAdminPage.jsx
        StrainAdminPage.jsx
      styles/
        global.css
```

### 架構重點

- SQLite 僅放在 repository 層，避免未來 PostgreSQL 遷移時影響 route 與 service。
- recommendationEngine.js 負責 rule-based 邏輯。
- openaiRecommendationService.js 只保留未來接 OpenAI API 的介面。
- disclaimer.js 統一管理免責聲明，避免各頁文字不一致。
- safetyLanguage.js 統一管理禁用語與保守替代表述。

## 5. SQLite Schema 可行性

使用者提供的 schema 完整且適合 MVP。

建議微調：

- main_needs、strains、application_areas、needs、recommended_strains、recommended_products 可先用 JSON 字串儲存。
- price 可用 REAL 或 INTEGER，若台幣價格不需要小數，建議 INTEGER。
- created_at、updated_at 可用 TEXT 儲存 ISO timestamp。
- recommendation_logs 先只記錄非敏感需求資料，不收集姓名、電話、病史等高敏感資訊。

## 6. Rule-based Recommendation Engine 設計

第一版可使用「需求 mapping + 產品 matching + 風險提示」三層邏輯。

### 6.1 需求對菌種 mapping

| 需求 | 推薦菌種方向 | 搭配成分 |
| --- | --- | --- |
| 腸胃順暢 / 排便調整 | Lactobacillus plantarum、Bifidobacterium lactis | 益生元、膳食纖維 |
| 過敏體質調整 | Lactobacillus paracasei、Lactobacillus rhamnosus | 乳鐵蛋白、益生元 |
| 女性私密保養 | Lactobacillus crispatus、Lactobacillus rhamnosus | 蔓越莓 |
| 兒童保健 | Bifidobacterium breve、Lactobacillus rhamnosus | 益生元 |
| 寵物腸胃 | Enterococcus faecium、Lactobacillus acidophilus | 寵物專用配方 |
| 外食族 / 熬夜族 / 日常保養 | Lactobacillus plantarum、Bifidobacterium longum | 綜合型益生菌、膳食纖維 |

### 6.2 信心分數

建議第一版使用簡單加權：

- 需求與菌種規則命中：+30
- 需求與產品主打需求命中：+30
- 使用者類型與產品適用族群命中：+20
- 產品菌種包含推薦菌種：+20
- 有特殊狀況：扣 10 至 30，並提高注意事項優先級

信心分數可限制在 0 至 95，避免造成絕對保證的感覺。

### 6.3 特殊狀況處理

若使用者勾選以下狀況，推薦仍可顯示，但必須加入高優先注意事項：

- 懷孕
- 長期用藥
- 免疫低下
- 兒童
- 長者
- 寵物

建議顯示：

「此情境需先諮詢專業人員，本結果僅作為保健食品與營養補充參考。」

## 7. 合規與文案風險

此產品最大的風險不是技術，而是文案與宣稱。

### 禁用語方向

應避免：

- 治療
- 診斷
- 治癒
- 改善疾病
- 預防疾病
- 降低疾病風險
- 對特定疾病有效
- 替代藥物
- 醫療建議

### 建議用語

可使用：

- 保健參考
- 營養補充參考
- 菌種方向建議
- 可作為日常保養參考
- 可搭配均衡飲食與良好作息
- 適合進一步與專業人員討論
- 產品推薦輔助

## 8. 全站免責聲明

所有頁面都應顯示以下文字：

```text
本系統僅提供保健食品與營養補充參考，不能取代醫師、藥師或營養師建議。若有疾病、懷孕、兒童、長者、免疫低下或正在用藥，請先諮詢專業人員。
```

建議放置位置：

- 首頁：主內容區明顯位置
- 表單頁：送出按鈕上方或下方
- 結果頁：結果頂部與底部至少一處
- 管理頁：頁面底部固定顯示

## 9. Mock Data 建議

第一版建議準備：

- 8 至 12 筆產品
- 8 至 10 筆菌種
- 每個主要需求至少有 1 至 2 個可對應產品
- 至少包含成人、兒童、女性、寵物、長者等族群

產品資料可以使用虛構品牌與產品名稱，避免涉及真實宣稱爭議。

範例產品命名：

- Gut Balance Daily Probiotic
- Flora Support Fiber Blend
- Women Flora Cranberry Probiotic
- Kids Gentle Probiotic
- Pet Digestive Flora Support
- Travel Daily Probiotic Sachet

## 10. OpenAI API 預留位置

第一版不需要真正呼叫 OpenAI API，但建議先保留：

```text
server/src/services/openaiRecommendationService.js
```

該檔案可提供：

- generateSalesExplanation()
- simplifyConsumerExplanation()
- reviewSafetyLanguage()
- summarizeRecommendation()

第一版先回傳 rule-based 固定文字。未來接 OpenAI API 時，可將推薦結果、產品資料、菌種資料與禁用語規則傳入模型，產生更自然但仍受控的說明。

重要：即使未來串 OpenAI，也不應讓模型直接決定醫療相關結論。模型應只負責文案整理、語氣轉換與摘要，核心推薦規則仍應保留可稽核邏輯。

## 11. 本機啟動方式建議

建議提供兩種啟動方式：

### 開發模式

```bash
npm install
npm run install:all
npm run dev
```

前端：

```text
http://localhost:5173
```

後端：

```text
http://localhost:4000
```

### 初始化資料庫

```bash
npm run db:seed
```

## 12. 開發順序建議

1. 建立專案結構
2. 建立 SQLite schema 與 seed mock data
3. 建立 Express API 與 repository 層
4. 建立 rule-based recommendation engine
5. 建立 React 首頁與模式選擇
6. 建立需求輸入頁
7. 建立推薦結果頁
8. 建立產品管理 CRUD
9. 建立菌種管理 CRUD
10. 加入全站免責聲明與安全文案
11. 測試本機啟動與 API
12. 補 README

## 13. SaaS 化擴充建議

未來若要變成 SaaS，可逐步加入：

- 使用者帳號與角色權限
- 公司 / 品牌 / 門市多租戶架構
- PostgreSQL
- 管理後台權限控管
- 推薦紀錄分析儀表板
- 產品資料匯入匯出
- 客服與業務常用話術模板
- 審核通過的安全文案庫
- OpenAI API 文案輔助
- 推薦結果追蹤與回饋
- API key 與第三方電商整合
- 知識庫與參考資料管理
- 法規與禁用語檢查流程

## 14. 主要風險與對策

| 風險 | 等級 | 對策 |
| --- | --- | --- |
| 醫療宣稱風險 | 高 | 全站免責聲明、禁用語、保守文案 |
| 推薦過度肯定 | 中高 | 信心分數上限不設 100，使用「參考」語氣 |
| 使用者輸入特殊狀況 | 中高 | 特殊狀況觸發專業諮詢提示 |
| mock data 不夠完整 | 中 | 每個需求至少建立對應產品與菌種 |
| 未來資料庫遷移 | 中 | repository 層隔離 SQLite |
| AI 串接後產生不當文案 | 高 | 讓 AI 只做文案輔助，不做核心判斷 |

## 15. 建議驗收標準

MVP 完成後，至少應符合：

- 可本機啟動前後端
- 可初始化 SQLite 與 mock data
- 可以新增、編輯、刪除產品
- 可以新增、編輯、刪除菌種
- 使用者可完成需求輸入
- 系統可回傳推薦菌種與產品
- 推薦結果含原因、CFU、搭配成分、注意事項與信心分數
- 業務版與消費者版輸出文案不同
- 全站可見免責聲明
- 不出現治療、診斷、治癒等醫療宣稱
- README 清楚描述安裝與啟動方式

## 16. 最終建議

建議立即進入 MVP 開發。第一版應以穩定、清楚、可展示為優先，不追求複雜 AI。

最佳策略是：

1. 用 rule-based engine 建立可稽核的推薦邏輯。
2. 用 SQLite 建立可管理的產品與菌種資料。
3. 用 React 做出清楚易用的雙模式介面。
4. 全程維持保守保健語氣與免責聲明。
5. 預留 OpenAI API，但不讓 AI 控制核心推薦判斷。

此 MVP 可作為內部業務工具、客服輔助工具、門市推薦輔助工具與消費者自助查詢工具的共同基礎。
