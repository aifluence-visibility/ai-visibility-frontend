import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  clearPendingPaymentContext,
  markFrontendPaymentSuccess,
  readPendingPaymentContext,
} from "../../shared/utils/paymentFlow";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const {
    startAnalysisAfterPayment,
    upgradeToPro,
    unlockStrategyAddon,
  } = useAnalysis();
  const [message, setMessage] = useState("Confirming payment and unlocking analysis...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const pending = readPendingPaymentContext();
      if (!pending) {
        navigate("/app", { replace: true });
        return;
      }

      markFrontendPaymentSuccess("stripe_redirect");

      if (pending.upgradePro) upgradeToPro();
      if (pending.unlockStrategy) unlockStrategyAddon();

      setMessage("Payment confirmed. Preparing your AI visibility dashboard...");

      await startAnalysisAfterPayment({
        brandName: pending.brandName,
        industry: pending.industry || "",
        competitors: pending.competitors || [],
      });

      clearPendingPaymentContext();

      if (!cancelled) {
        navigate("/app", { replace: true });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, startAnalysisAfterPayment, upgradeToPro, unlockStrategyAddon]);

  return (
    <div className="min-h-screen bg-[#07111f] px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_100px_rgba(2,8,23,0.58)] backdrop-blur-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300/90">Payment success</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white">Analysis access unlocked</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">{message}</p>
      </div>
    </div>
  );
}
