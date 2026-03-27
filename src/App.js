import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

function App() {
  const [view, setView] = useState("landing");
  const [analysisParams, setAnalysisParams] = useState({
    brandName: "",
    mode: "quick",
    autoRun: false,
  });

  const handleStartAnalysis = ({ brandName, mode = "quick", autoRun = true }) => {
    setAnalysisParams({ brandName, mode, autoRun });
    setView("dashboard");
  };

  if (view === "dashboard") {
    return (
      <AnalyticsDashboard
        initialBrandName={analysisParams.brandName}
        initialMode={analysisParams.mode}
        autoRun={analysisParams.autoRun}
        onBackToLanding={() => setView("landing")}
      />
    );
  }

  return (
    <LandingPage
      onAnalyze={({ brandName, mode, autoRun }) =>
        handleStartAnalysis({ brandName, mode, autoRun })
      }
      onSeeDemo={() =>
        handleStartAnalysis({ brandName: "Stripe", mode: "quick", autoRun: true })
      }
    />
  );
}

export default App;