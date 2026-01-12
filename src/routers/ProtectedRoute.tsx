import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  const token = localStorage.getItem('adminToken');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/error?type=403&message=Bạn không có quyền truy cập trang này" replace />;
  }

  return element;
};

export default ProtectedRoute;
