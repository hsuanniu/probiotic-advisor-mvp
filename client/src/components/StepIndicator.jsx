const defaultSteps = ["填寫需求", "比對菌種", "查看推薦"];

export default function StepIndicator({ current = 1, steps = defaultSteps }) {
  return (
    <ol className="step-indicator" aria-label="流程進度">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const className = stepNumber === current ? "step-item active" : stepNumber < current ? "step-item done" : "step-item";

        return (
          <li className={className} key={step}>
            <span>{stepNumber}</span>
            <strong>{step}</strong>
          </li>
        );
      })}
    </ol>
  );
}
