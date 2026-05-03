import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    // Redirect to chat if already logged in
    return <Navigate to="/chat" replace />;
  }

  return children;
};

export default AuthRoute;
