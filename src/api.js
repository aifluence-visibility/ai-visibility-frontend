const LIVE_BACKEND_URL = "https://ai-visibility-backend-x3ww.onrender.com";

const API_BASE_URL =
  (process.env.REACT_APP_API_URL || LIVE_BACKEND_URL).replace(/\/+$/, "");

export const ANALYZE_API_URL = `${API_BASE_URL}/analyze`;
