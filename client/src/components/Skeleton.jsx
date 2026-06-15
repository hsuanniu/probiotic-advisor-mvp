export function SkeletonCard() {
  return (
    <article className="skeleton-card" aria-label="資料載入中">
      <span />
      <strong />
      <p />
      <p />
    </article>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
