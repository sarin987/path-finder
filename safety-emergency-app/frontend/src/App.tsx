import './App.css';

import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PublicRoute from '@/components/common/PublicRoute';
import PrivateRoute from '@/components/common/PrivateRoute';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import EmergenciesPage from '@/pages/emergencies/EmergenciesPage';
import EmergencyDetailsPage from '@/pages/emergencies/EmergencyDetailsPage';
import CreateEmergencyPage from '@/pages/emergencies/CreateEmergencyPage';
import MapPage from '@/pages/map/MapViewPage';
import ChatPage from '@/pages/chat/ChatPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

// Layout component that includes the MainLayout and Outlet for nested routes
const AuthenticatedLayout: React.FC = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Main App component with all providers
const App: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              maxSnack={3}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              autoHideDuration={3000}
            >
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute
                        restricted
                        element={
                          <AuthLayout>
                            <LoginPage />
                          </AuthLayout>
                        }
                      />
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute
                        restricted
                        element={
                          <AuthLayout>
                            <RegisterPage />
                          </AuthLayout>
                        }
                      />
                    }
                  />

                  {/* Protected Routes */}
                  <Route element={<PrivateRoute element={<AuthenticatedLayout />} />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="emergencies" element={<EmergenciesPage />} />
                    <Route path="emergencies/:id" element={<EmergencyDetailsPage />} />
                    <Route path="create-emergency" element={<CreateEmergencyPage />} />
                    <Route path="map" element={<MapPage />} />
                    <Route path="chat" element={<ChatPage />} />
                  </Route>

                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AuthProvider>
            </SnackbarProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} position="bottom" buttonPosition="bottom-left" />
        </QueryClientProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
