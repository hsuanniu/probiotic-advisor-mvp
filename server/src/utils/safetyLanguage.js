const restrictedTerms = ["治療", "診斷", "治癒", "改善疾病", "預防疾病", "替代藥物"];

export function containsRestrictedTerms(text = "") {
  return restrictedTerms.filter((term) => text.includes(term));
}

export function safeReferenceText(text = "") {
  return text
    .replaceAll("治療", "保健參考")
    .replaceAll("診斷", "需求判斷參考")
    .replaceAll("治癒", "日常保養支持")
    .replaceAll("改善疾病", "日常保養參考")
    .replaceAll("預防疾病", "健康維持參考")
    .replaceAll("替代藥物", "搭配專業建議");
}
