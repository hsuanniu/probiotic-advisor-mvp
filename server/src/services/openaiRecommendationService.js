// Reserved for future OpenAI API integration.
// The MVP keeps core recommendation decisions in the rule-based engine so results remain auditable.
export async function generateRecommendationCopy(recommendation) {
  return {
    sales_talk: recommendation.sales_talk,
    consumer_summary: recommendation.consumer_summary,
    safety_review: "MVP 使用固定保守文案，尚未呼叫 OpenAI API。"
  };
}
