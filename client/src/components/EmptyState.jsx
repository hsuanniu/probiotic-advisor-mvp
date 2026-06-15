import { ArrowRight } from "lucide-react";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <article className="empty-state polished-empty">
      {Icon && (
        <span className="empty-icon">
          <Icon size={32} />
        </span>
      )}
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="primary-action" type="button" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={18} />
        </button>
      )}
    </article>
  );
}
