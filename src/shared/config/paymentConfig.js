export const PAYMENT_MODES = {
  FAKE: "fake",
  STRIPE_TEST: "stripe_test",
  STRIPE_LIVE: "stripe_live",
};

function normalizeMode(value) {
  const mode = (value || "").toLowerCase().trim();
  if (Object.values(PAYMENT_MODES).includes(mode)) return mode;
  return PAYMENT_MODES.FAKE;
}

export const PAYMENT_MODE = normalizeMode(process.env.REACT_APP_PAYMENT_MODE);

export function isFakePaymentMode() {
  return PAYMENT_MODE === PAYMENT_MODES.FAKE;
}

export function isStripePaymentMode() {
  return PAYMENT_MODE === PAYMENT_MODES.STRIPE_TEST || PAYMENT_MODE === PAYMENT_MODES.STRIPE_LIVE;
}

export function getStripePaymentLink() {
  if (PAYMENT_MODE === PAYMENT_MODES.STRIPE_LIVE) {
    return process.env.REACT_APP_STRIPE_PAYMENT_LINK_LIVE || process.env.REACT_APP_STRIPE_PAYMENT_LINK || "";
  }
  if (PAYMENT_MODE === PAYMENT_MODES.STRIPE_TEST) {
    return process.env.REACT_APP_STRIPE_PAYMENT_LINK_TEST || process.env.REACT_APP_STRIPE_PAYMENT_LINK || "";
  }
  return "";
}
