import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import { AnalysisProvider, useAnalysis } from "./shared/hooks/useAnalysis";
import AppLayout from "./layout/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import VisibilityScorePage from "./pages/visibility-score/VisibilityScorePage";
import PromptPerformancePage from "./pages/prompt-performance/PromptPerformancePage";
import CompetitorAnalysisPage from "./pages/competitor-analysis/CompetitorAnalysisPage";
import OpportunitiesPage from "./pages/opportunities/OpportunitiesPage";
import SentimentPage from "./pages/sentiment/SentimentPage";
import ActionsPage from "./pages/actions/ActionsPage";
import GrowthImpactPage from "./pages/growth-impact/GrowthImpactPage";
import SettingsPage from "./pages/settings/SettingsPage";
import TeamPage from "./pages/team/TeamPage";
import ReportsPage from "./pages/reports/ReportsPage";
import { WorkspaceProvider } from "./shared/hooks/useWorkspace";

/* Bridge: LandingPage triggers analysis and navigates into /app */
function LandingBridge() {
  const navigate = useNavigate();
  const { fetchAnalysis, setBrandName, setIndustry, setCountry, setMode } = useAnalysis();

  const handleAnalyze = ({ brandName, industry = "", country = "Global", mode = "quick" }) => {
    setBrandName(brandName);
    setIndustry(industry);
    setCountry(country);
    setMode(mode);
    fetchAnalysis({ brandName, industry, country, mode });
    navigate("/app");
  };

  return (
    <LandingPage
      onAnalyze={handleAnalyze}
      onSeeDemo={() => handleAnalyze({ brandName: "Stripe", mode: "quick" })}
    />
  );
}

/* Auto-analyze from search params: /app?brand=X&industry=Y */
function AutoAnalyze() {
  const [params] = useSearchParams();
  const { fetchAnalysis, hasAnalyzedOnce } = useAnalysis();
  useEffect(() => {
    const brand = params.get("brand");
    if (brand && !hasAnalyzedOnce) {
      fetchAnalysis({ brandName: brand, industry: params.get("industry") || "", country: params.get("country") || "Global", mode: params.get("mode") || "quick" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
      <AnalysisProvider>
        <Routes>
          <Route path="/" element={<LandingBridge />} />
          <Route path="/app" element={<><AutoAnalyze /><AppLayout /></>}>
            <Route index element={<DashboardPage />} />
            <Route path="visibility" element={<VisibilityScorePage />} />
            <Route path="prompts" element={<PromptPerformancePage />} />
            <Route path="competitors" element={<CompetitorAnalysisPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="sentiment" element={<SentimentPage />} />
            <Route path="actions" element={<ActionsPage />} />
            <Route path="growth" element={<GrowthImpactPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </AnalysisProvider>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}

export default App;