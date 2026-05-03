import React from 'react';
import { Routes, Route } from 'react-router-dom';

// 1. OLD TOAST (Keep for Login/Signup if needed)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

// 2. NEW TOAST (Required for Sidebar Delete Button)
import { Toaster } from 'react-hot-toast'; 

// Import Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import MainChat from './pages/MainChat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import ProtectedRoute from './components/ProtectedRoute';
import AuthRoute from './components/AuthRoute';

function App() {
  return (
    <>
      {/* Container for React-Toastify (Login/Signup) */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* [NEW] Container for React-Hot-Toast (Sidebar Delete) */}
      <Toaster />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={
          <AuthRoute>
            <SignIn />
          </AuthRoute>
        } />
        <Route path="/signup" element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <MainChat />
          </ProtectedRoute>
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;