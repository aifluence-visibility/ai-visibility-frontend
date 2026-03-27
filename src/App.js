import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

function App() {
  const [view, setView] = useState("landing");
  const [analysisParams, setAnalysisParams] = useState({
    brandName: "",
    industry: "",
    country: "Global",
    mode: "quick",
    autoRun: false,
  });

  const handleStartAnalysis = ({ brandName, industry = "", country = "Global", mode = "quick", autoRun = true }) => {
    setAnalysisParams({ brandName, industry, country, mode, autoRun });
    setView("dashboard");
  };

  if (view === "dashboard") {
    return (
      <AnalyticsDashboard
        initialBrandName={analysisParams.brandName}
        initialIndustry={analysisParams.industry}
        initialCountry={analysisParams.country}
        initialMode={analysisParams.mode}
        autoRun={analysisParams.autoRun}
        onBackToLanding={() => setView("landing")}
      />
    );
  }

  return (
    <LandingPage
      onAnalyze={({ brandName, industry, country, mode, autoRun }) =>
        handleStartAnalysis({ brandName, industry, country, mode, autoRun })
      }
      onSeeDemo={() =>
        handleStartAnalysis({ brandName: "Stripe", mode: "quick", autoRun: true })
      }
    />
  );
}

export default App;