import { ClipboardList, Home, LayoutDashboard, Route, ShieldCheck, UserRound } from "lucide-react";

const items = [
  { page: "home", label: "首頁", icon: Home },
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "intake", label: "生活評估", icon: ClipboardList },
  { page: "journey", label: "90 天旅程", icon: Route },
  { page: "my", label: "我的", icon: UserRound, activePages: ["my", "favorites", "profile", "products", "strains"] }
];

export default function Navigation({ currentPage, setPage }) {
  return (
    <nav className="top-nav" aria-label="主要導覽">
      <div className="brand-mark">
        <ShieldCheck size={22} />
        <div>
          <strong>四象生活健康顧問</strong>
          <span>90 天益生菌追蹤平台</span>
        </div>
      </div>
      <div className="nav-actions">
        {items.map(({ page, label, icon: Icon, activePages }) => {
          const isActive = page === currentPage || activePages?.includes(currentPage);
          return (
          <button
            className={isActive ? "nav-button active" : "nav-button"}
            key={page}
            onClick={() => setPage(page)}
            type="button"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );})}
      </div>
    </nav>
  );
}
