import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../features/auth/authSlice';
import { toast } from 'react-toastify';
import API_BASE from '../services/api';

const AuthSuccess = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthLogin = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');

        if (!token) {
          setError('Authentication failed. No token received.');
          toast.error('Authentication failed.');
          setTimeout(() => navigate('/signin'), 2000);
          return;
        }

        // We have the token, now fetch the user details from /api/auth/me
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile.');
        }

        const data = await response.json();
        
        // Dispatch to Redux store
        dispatch(login({
          user: data.user,
          token: token
        }));

        toast.success(`Welcome back, ${data.user.username}!`);
        navigate('/chat');

      } catch (err) {
        console.error('OAuth Login Error:', err);
        setError(err.message || 'An error occurred during authentication.');
        toast.error('Failed to load user profile.');
        setTimeout(() => navigate('/signin'), 2000);
      }
    };

    processOAuthLogin();
  }, [location, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Login Error</h2>
            <p className="text-sm text-gray-600">{error}</p>
            <p className="text-xs text-gray-400 mt-4">Redirecting you to sign in...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Completing Login</h2>
            <p className="text-sm text-gray-500">Please wait while we securely connect your account...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
