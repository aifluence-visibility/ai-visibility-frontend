import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  if (showDashboard) {
    return <AnalyticsDashboard />;
  }

  return (
    <LandingPage
      onAnalyze={() => setShowDashboard(true)}
      onSeeDemo={() => setShowDashboard(true)}
    />
  );
}

export default App;