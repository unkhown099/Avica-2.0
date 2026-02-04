// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdmin }) => {
  // Example: check if admin info exists in localStorage or state
  const user = JSON.parse(localStorage.getItem('user')); // or use context/store

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (isAdmin && user.role !== 'admin') {
    // Logged in but not admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
