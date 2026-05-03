/**
 * api.js — Central API service for QuietCareAI
 *
 * HOW THE URL SWITCH WORKS:
 *  - Locally (npm run dev):  VITE_AI_ENGINE_URL is set in .env.local → http://localhost:8000
 *  - On Vercel (production): VITE_AI_ENGINE_URL is set in Vercel Dashboard → HF Spaces URL
 *
 *  - Locally (npm run dev):  VITE_BACKEND_URL is not set → falls back to http://localhost:5005
 *  - On Vercel (production): VITE_BACKEND_URL is set in the Vercel Dashboard to
 *                            https://quite-care-ai-fyp-imz9.vercel.app
 */
import axios from 'axios';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005';

export const API_BASE = BACKEND_URL;

export const R2_URL = "https://pub-c4751c4c00514714b4e7a941dd0d90d1.r2.dev/animations";

export const AI_ENGINE_URL =
  import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

// Set up global Axios interceptor for JWT Auth
axios.interceptors.request.use(
  (config) => {
    const tokenStr = localStorage.getItem('token');
    if (tokenStr) {
      try {
        const token = JSON.parse(tokenStr);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Error parsing token from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor to handle expired tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout if token is expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default API_BASE;
