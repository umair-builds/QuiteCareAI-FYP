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

function App() {
  return (
    <>
      {/* Container for React-Toastify (Login/Signup) */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* [NEW] Container for React-Hot-Toast (Sidebar Delete) */}
      <Toaster />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/chat" element={<MainChat />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;