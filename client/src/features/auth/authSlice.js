import { createSlice } from '@reduxjs/toolkit';

// --- STEP 1: Check LocalStorage immediately when app loads ---
// If user data exists in browser memory, load it. If not, set to null.
const safeParseJSON = (value) => {
  try {
    if (!value || value === 'undefined' || value === 'null') return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const userFromStorage = localStorage.getItem('user');
const tokenFromStorage = localStorage.getItem('token');

const initialState = {
  user: safeParseJSON(userFromStorage),
  token: safeParseJSON(tokenFromStorage),
  isAuthenticated: !!safeParseJSON(userFromStorage),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action: Login
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // --- STEP 2: Save to LocalStorage on Login ---
      // This persists the data even if the user refreshes the page
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', JSON.stringify(action.payload.token));
    },
    
    // Action: Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // --- STEP 3: Remove from LocalStorage on Logout ---
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;