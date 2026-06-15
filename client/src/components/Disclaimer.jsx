export const DISCLAIMER =
  "本系統僅提供保健食品與營養補充參考，不能取代醫師、藥師或營養師建議。若有疾病、懷孕、兒童、長者、免疫低下或正在用藥，請先諮詢專業人員。";

export default function Disclaimer() {
  return (
    <aside className="disclaimer">
      <strong>使用提醒</strong>
      <span>{DISCLAIMER}</span>
    </aside>
  );
}
