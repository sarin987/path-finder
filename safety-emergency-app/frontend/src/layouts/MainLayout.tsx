import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import React, { memo, useMemo } from 'react';

// Components
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Memoize the main box styles to prevent recreation on every render
  const mainBoxSx = useMemo(() => ({
    flexGrow: 1,
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.default'
  }), []);

  const contentBoxSx = useMemo(() => ({
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column'
  }), []);

  return (
    <ResponsiveLayout>
      <CssBaseline />
      <Box 
        component="main"
        sx={mainBoxSx}
      >
        <Box sx={contentBoxSx}>
          {children || <Outlet />}
        </Box>
      </Box>
    </ResponsiveLayout>
  ) as React.ReactElement;
};

// Only re-render if children prop changes
const areEqual = (prevProps: MainLayoutProps, nextProps: MainLayoutProps) => {
  return prevProps.children === nextProps.children;
};

export default memo(MainLayout, areEqual);
