import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { api } from "../api/client.js";
import Disclaimer from "../components/Disclaimer.jsx";
import FormField from "../components/FormField.jsx";

const ageOptions = ["18-29 歲", "30-44 歲", "45-64 歲", "65 歲以上"];
const eatingOutOptions = ["幾乎不外食", "每週 1-3 次", "每週 4-6 次", "幾乎每天"];
const bowelOptions = ["大致規律", "偶爾不規律", "經常不規律", "偏硬或偏稀"];
const stressOptions = ["睡眠與壓力大致穩定", "偶爾睡不好或壓力較高", "經常睡不好或壓力較高"];
const goalOptions = ["日常腸胃保養", "外食族保養", "熟齡健康管理", "女性日常保養", "長期營養支持", "其他"];

const goalToNeeds = {
  "日常腸胃保養": ["腸胃順暢", "日常保養"],
  "外食族保養": ["外食族", "腸胃順暢"],
  "熟齡健康管理": ["日常保養", "排便調整"],
  "女性日常保養": ["女性私密保養", "日常保養"],
  "長期營養支持": ["日常保養", "熬夜族"],
  "其他": ["日常保養"]
};

function OptionGroup({ label, options, value, onChange, mobileColumns = 1 }) {
  return (
    <fieldset className={mobileColumns === 2 ? "choice-panel mobile-two-column" : "choice-panel"}>
      <legend>{label}</legend>
      <div className="choice-grid choice-grid-large">
        {options.map((option) => (
          <label className={value === option ? "choice-chip selected" : "choice-chip"} key={option}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
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
    primary_goal: "日常腸胃保養",
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
      const targetGroup =
        form.age_range === "65 歲以上"
          ? "長者"
          : form.primary_goal === "女性日常保養"
            ? "女性"
            : "成人";
      const ageMap = { "18-29 歲": 24, "30-44 歲": 37, "45-64 歲": 54, "65 歲以上": 68 };
      const result = await api.createRecommendation({
        ...form,
        user_type: mode,
        age: ageMap[form.age_range],
        target_group: targetGroup,
        needs: goalToNeeds[form.primary_goal],
        lifestyle: `${form.eating_out_frequency}；${form.stress_sleep}`,
        special_conditions: []
      });
      setRecommendation(result);
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
              <h3>基本資料與最大保健目標</h3>
              <p>先確認年齡區間、性別與最想持續管理的日常保養方向。</p>
            </div>
            <OptionGroup label="1. 年齡區間" options={ageOptions} value={form.age_range} onChange={(value) => update("age_range", value)} mobileColumns={2} />
            <OptionGroup label="2. 性別" options={["不指定", "女性", "男性", "其他"]} value={form.gender} onChange={(value) => update("gender", value)} mobileColumns={2} />
            <OptionGroup label="3. 最大保健目標" options={goalOptions} value={form.primary_goal} onChange={(value) => update("primary_goal", value)} />
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
            <FormField label="7. 其他想補充的健康目標（選填）">
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
