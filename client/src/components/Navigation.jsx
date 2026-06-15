import { Boxes, ClipboardList, Heart, Home, LayoutDashboard, Microscope, Route, ShieldCheck, UserRound } from "lucide-react";

const items = [
  { page: "home", label: "首頁", icon: Home },
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "intake", label: "生活評估", icon: ClipboardList },
  { page: "journey", label: "90 天旅程", icon: Route },
  { page: "favorites", label: "收藏", icon: Heart },
  { page: "profile", label: "Profile", icon: UserRound },
  { page: "products", label: "產品後台", icon: Boxes },
  { page: "strains", label: "菌種後台", icon: Microscope }
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
        {items.map(({ page, label, icon: Icon }) => (
          <button
            className={currentPage === page ? "nav-button active" : "nav-button"}
            key={page}
            onClick={() => setPage(page)}
            type="button"
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
