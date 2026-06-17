import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import FormField from "../components/FormField.jsx";
import { buildLocalRecommendation } from "../utils/offlineAdvisor.js";

const ageOptions = ["18-29 歲", "30-44 歲", "45-64 歲", "65 歲以上"];
const eatingOutOptions = ["幾乎不外食", "每週 1-3 次", "每週 4-6 次", "幾乎每天"];
const bowelOptions = ["大致規律", "偶爾不規律", "經常不規律", "偏硬或偏稀"];
const stressOptions = ["睡眠與壓力大致穩定", "偶爾睡不好或壓力較高", "經常睡不好或壓力較高"];
const goalOptions = ["日常腸胃保養", "外食族保養", "熟齡健康管理", "女性日常保養", "長期營養支持", "高規格保養", "其他"];
const concernOptions = ["排便不規律", "外食壓力", "睡眠壓力", "熟齡保養", "長期保養", "高規格保養", "女性日常保養"];

const goalToNeeds = {
  "日常腸胃保養": ["腸胃順暢", "日常保養"],
  "外食族保養": ["外食族", "腸胃順暢"],
  "熟齡健康管理": ["日常保養", "排便調整"],
  "女性日常保養": ["女性私密保養", "日常保養"],
  "長期營養支持": ["日常保養", "熬夜族"],
  "高規格保養": ["日常保養", "熬夜族"],
  "其他": ["日常保養"]
};

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function toggle(list, item) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function OptionGroup({ label, options, value, onChange, mobileColumns = 1, multiple = false }) {
  const selectedValues = multiple ? value : [value];
  return (
    <fieldset className={mobileColumns === 2 ? "choice-panel mobile-two-column" : "choice-panel"}>
      <legend>{label}</legend>
      <div className="choice-grid choice-grid-large">
        {options.map((option) => (
          <label className={selectedValues.includes(option) ? "choice-chip selected" : "choice-chip"} key={option}>
            <input
              type={multiple ? "checkbox" : "radio"}
              checked={selectedValues.includes(option)}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function IntakePage({ mode, setRecommendation, setPage }) {
  const [step, setStep] = useState(1);
  const [loadingStage, setLoadingStage] = useState(0);
  const [form, setForm] = useState({
    age_range: "30-44 歲",
    gender: "不指定",
    eating_out_frequency: "每週 1-3 次",
    bowel_status: "大致規律",
    stress_sleep: "睡眠與壓力大致穩定",
    primary_goals: ["日常腸胃保養"],
    concerns: [],
    description: ""
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function goToStep(nextStep) {
    setStep(nextStep);
    window.scrollTo({ top: 0 });
  }

  async function submit(event) {
    event.preventDefault();
    goToStep(3);
    setLoadingStage(0);
    const stageTimer = setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, 2));
    }, 650);

    try {
      const primaryGoals = form.primary_goals.length ? form.primary_goals : ["日常腸胃保養"];
      const targetGroup =
        form.age_range === "65 歲以上"
          ? "長者"
          : primaryGoals.includes("女性日常保養")
            ? "女性"
            : "成人";
      const ageMap = { "18-29 歲": 24, "30-44 歲": 37, "45-64 歲": 54, "65 歲以上": 68 };
      const needs = unique(primaryGoals.flatMap((goal) => goalToNeeds[goal] || ["日常保養"]));
      const result = await api.createRecommendation({
        ...form,
        primary_goal: primaryGoals.join("、"),
        user_type: mode,
        age: ageMap[form.age_range],
        target_group: targetGroup,
        needs,
        lifestyle: `${form.eating_out_frequency}；${form.stress_sleep}`,
        special_conditions: []
      });
      setRecommendation(result);
      setPage("result");
    } catch {
      setRecommendation(buildLocalRecommendation(form, mode));
      setPage("result");
    } finally {
      clearInterval(stageTimer);
    }
  }

  const loadingMessages = ["正在分析生活型態", "正在計算腸道健康分數", "正在建立 90 天建議"];

  return (
    <main className="page-shell">
      <section className="section-heading">
        <div>
          <p className="eyebrow">四象生活健康評估</p>
          <h2>建立個人生活型態分析</h2>
          <p>透過 7 題短問卷了解飲食、排便與睡眠壓力狀態，提供日常保養與 90 天追蹤參考。</p>
        </div>
      </section>

      <ol className="flow-stepper" aria-label="分析流程">
        {["基本資料", "生活型態", "分析中", "查看建議"].map((label, index) => {
          const number = index + 1;
          return (
            <li className={number === step ? "flow-step active" : number < step ? "flow-step done" : "flow-step"} key={label}>
              <span>{number < step ? <CheckCircle2 size={16} /> : number}</span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>

      <form className="intake-layout" onSubmit={submit}>
        {step === 1 && (
          <section className="flow-panel">
            <div className="flow-copy">
              <p className="eyebrow">Step 1 of 4</p>
              <h3>基本資料與保健目標</h3>
              <p>先確認年齡區間、性別與想持續管理的日常保養方向，可複選。</p>
            </div>
            <OptionGroup label="1. 年齡區間" options={ageOptions} value={form.age_range} onChange={(value) => update("age_range", value)} mobileColumns={2} />
            <OptionGroup label="2. 性別" options={["不指定", "女性", "男性", "其他"]} value={form.gender} onChange={(value) => update("gender", value)} mobileColumns={2} />
            <OptionGroup
              label="3. 最大保健目標（可複選）"
              options={goalOptions}
              value={form.primary_goals}
              multiple
              onChange={(value) => update("primary_goals", toggle(form.primary_goals, value))}
            />
            <div className="flow-actions">
              <button className="primary-action" type="button" onClick={() => goToStep(2)}>
                下一步：生活型態
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="flow-panel">
            <div className="flow-copy">
              <p className="eyebrow">Step 2 of 4</p>
              <h3>飲食、排便與睡眠壓力</h3>
              <p>這些日常資訊會用來計算腸道健康分數與建議方案等級。</p>
            </div>
            <OptionGroup label="4. 外食頻率" options={eatingOutOptions} value={form.eating_out_frequency} onChange={(value) => update("eating_out_frequency", value)} mobileColumns={2} />
            <OptionGroup label="5. 排便狀況" options={bowelOptions} value={form.bowel_status} onChange={(value) => update("bowel_status", value)} mobileColumns={2} />
            <OptionGroup label="6. 壓力 / 睡眠狀況" options={stressOptions} value={form.stress_sleep} onChange={(value) => update("stress_sleep", value)} />
            <OptionGroup
              label="7. 困擾狀況（可複選）"
              options={concernOptions}
              value={form.concerns}
              multiple
              onChange={(value) => update("concerns", toggle(form.concerns, value))}
            />
            <FormField label="8. 其他想補充的健康目標（選填）">
              <textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="例如：希望建立穩定飲食與日常營養補充習慣。" />
            </FormField>
            <Disclaimer />
            <div className="flow-actions split">
              <button className="secondary-action" type="button" onClick={() => goToStep(1)}>
                <ArrowLeft size={18} />
                回上一步
              </button>
              <button className="primary-action" type="submit">
                <Send size={18} />
                建立健康分析
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="analysis-loading" aria-live="polite">
            <div className="analysis-orbit"><Loader2 size={40} /></div>
            <p className="eyebrow">Step 3 of 4</p>
            <h3>{loadingMessages[loadingStage]}</h3>
            <p>系統正在整理生活型態與日常保養方向，不提供醫療診斷。</p>
            <div className="analysis-progress">
              {loadingMessages.map((message, index) => (
                <span className={index <= loadingStage ? "active" : ""} key={message}>{message}</span>
              ))}
            </div>
          </section>
        )}
      </form>
    </main>
  );
}
