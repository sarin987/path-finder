import React, { useEffect, useState, useCallback, memo } from 'react';
import { useTheme, useMediaQuery, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Close mobile drawer when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <Box 
      component="div"
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {isAuthenticated && <Header key="header" onMenuClick={handleDrawerToggle} />}
      
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        pt: isAuthenticated ? { xs: '56px', sm: '64px' } : 0, // Only add padding if header is shown
      }}>
        {/* Sidebar - Only show if authenticated */}
        {isAuthenticated && (
          <Sidebar 
            key="sidebar"
            mobileOpen={mobileOpen} 
            onClose={handleCloseDrawer}
            isMobile={isMobile}
          />
        )}
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            p: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Only re-render if props or authentication state changes
const areEqual = (prevProps: ResponsiveLayoutProps, nextProps: ResponsiveLayoutProps) => {
  return prevProps.children === nextProps.children;
};

export default memo(ResponsiveLayout, areEqual);
