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
import PaymentSuccessPage from "./pages/payment-success/PaymentSuccessPage";

/* Bridge: LandingPage triggers analysis and navigates into /app */
function LandingBridge() {
  const navigate = useNavigate();
  const { fetchAnalysis, setBrandName, setIndustry, setCountry, setMode, setCompetitors, upgradeToPro, unlockStrategyAddon, startAnalysisAfterPayment } = useAnalysis();

  const handleAnalyze = ({ brandName, industry = "", competitors = [], payEntry = false, upgradePro = false, unlockStrategy = false }) => {
    setBrandName(brandName);
    setIndustry(industry);
    setCountry("Auto (US, UK, Germany)");
    setMode("full");
    setCompetitors(competitors);
    if (upgradePro) upgradeToPro();
    if (unlockStrategy) unlockStrategyAddon();
    if (payEntry) {
      startAnalysisAfterPayment({ brandName, industry, competitors });
    } else {
      fetchAnalysis({ brandName, industry, competitors, mode: "full", country: "Auto (US, UK, Germany)" });
    }
    navigate("/app");
  };

  return (
    <LandingPage
      onAnalyze={handleAnalyze}
      onSeeDemo={() => navigate("/app")}
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
      fetchAnalysis({ brandName: brand, industry: params.get("industry") || "", country: "Auto (US, UK, Germany)", mode: "full" });
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
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
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