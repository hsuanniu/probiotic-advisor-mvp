import { useState } from "react";
import Navigation from "./components/Navigation.jsx";
import HomePage from "./pages/HomePage.jsx";
import IntakePage from "./pages/IntakePage.jsx";
import RecommendationResultPage from "./pages/RecommendationResultPage.jsx";
import ProductAdminPage from "./pages/ProductAdminPage.jsx";
import StrainAdminPage from "./pages/StrainAdminPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import JourneyPage from "./pages/JourneyPage.jsx";
import MyPage from "./pages/MyPage.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [mode, setMode] = useState("business");
  const [recommendation, setRecommendation] = useState(null);

  function navigateTo(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="app-frame">
      <Navigation currentPage={page} setPage={navigateTo} />
      {page === "home" && <HomePage mode={mode} setMode={setMode} setPage={navigateTo} />}
      {page === "dashboard" && <DashboardPage setPage={navigateTo} />}
      {page === "intake" && <IntakePage mode={mode} setRecommendation={setRecommendation} setPage={navigateTo} />}
      {page === "result" && <RecommendationResultPage mode={mode} recommendation={recommendation} setPage={navigateTo} />}
      {page === "my" && <MyPage setPage={navigateTo} />}
      {page === "favorites" && <FavoritesPage />}
      {page === "profile" && <ProfilePage />}
      {page === "journey" && <JourneyPage setPage={navigateTo} />}
      {page === "products" && <ProductAdminPage />}
      {page === "strains" && <StrainAdminPage />}
    </div>
  );
}
