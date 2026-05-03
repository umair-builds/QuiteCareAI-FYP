import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    // Redirect to sign in if not logged in
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
