import { getStripePaymentLink } from "../config/paymentConfig";

const PENDING_PAYMENT_CONTEXT_KEY = "lumio-pending-payment-context";
const FRONTEND_PAYMENT_STATUS_KEY = "lumio-frontend-payment-status";

export function savePendingPaymentContext(context) {
  try {
    localStorage.setItem(
      PENDING_PAYMENT_CONTEXT_KEY,
      JSON.stringify({
        ...context,
        savedAt: Date.now(),
      })
    );
  } catch {
    // Best-effort persistence only.
  }
}

export function readPendingPaymentContext() {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingPaymentContext() {
  try {
    localStorage.removeItem(PENDING_PAYMENT_CONTEXT_KEY);
  } catch {
    // no-op
  }
}

export function markFrontendPaymentSuccess(source = "frontend") {
  try {
    localStorage.setItem(
      FRONTEND_PAYMENT_STATUS_KEY,
      JSON.stringify({
        success: true,
        source,
        confirmedAt: Date.now(),
      })
    );
  } catch {
    // no-op
  }
}

export function getFrontendPaymentStatus() {
  try {
    const raw = localStorage.getItem(FRONTEND_PAYMENT_STATUS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearFrontendPaymentStatus() {
  try {
    localStorage.removeItem(FRONTEND_PAYMENT_STATUS_KEY);
  } catch {
    // no-op
  }
}

export function redirectToStripePaymentLink() {
  const paymentLink = getStripePaymentLink();
  if (!paymentLink) return false;
  window.location.assign(paymentLink);
  return true;
}

// TODO(webhook): In production, replace frontend-only success markers with
// backend-verified Stripe session/webhook validation before unlocking analysis.
