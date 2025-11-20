import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  // 1. Show a loading message while the context is
  //    checking the user's session.
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // 2. If not loading and there is NO session,
  //    redirect the user to the login page.
  if (!session) {
    // 'replace' stops the user from using the back
    // button to get to the protected page.
    return <Navigate to="/login" replace />;
  }

  // 3. If not loading AND there is a session,
  //    render the child route (e.g., the Dashboard).
  //    <Outlet /> is the placeholder for the child.
  return <Outlet />;
};

export default ProtectedRoute;