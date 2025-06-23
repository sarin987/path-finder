import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import React from 'react';

interface PublicRouteProps {
  element: React.ReactElement;
  restricted?: boolean;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ 
  element,
  restricted = false 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && restricted) {
    return <Navigate to={from} replace />;
  }

  return element;
};

export default PublicRoute;
