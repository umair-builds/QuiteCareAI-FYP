/**
 * api.js — Central API service for QuietCareAI
 *
 * HOW THE URL SWITCH WORKS:
 *  - Locally (npm run dev):  VITE_BACKEND_URL is not set → falls back to http://localhost:5005
 *  - On Vercel (production): VITE_BACKEND_URL is set in the Vercel Dashboard to
 *                            https://quite-care-ai-fyp-imz9.vercel.app
 */
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

export const API_BASE = BACKEND_URL;

export default API_BASE;
