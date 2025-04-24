// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/auth/Login';
import PoliceDashboard from './components/dashboard/PoliceDashboard';
import AmbulanceDashboard from './components/dashboard/AmbulanceDashboard';
import ParentDashboard from './components/dashboard/ParentDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Profile from './components/common/Profile';
import Chat from './components/common/Chat';
import './styles/tailwind.css';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/police/*" 
            element={
              <ProtectedRoute allowedRoles={['police']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="" element={<PoliceDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="chat" element={<Chat />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/ambulance/*" 
            element={
              <ProtectedRoute allowedRoles={['ambulance']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="" element={<AmbulanceDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="chat" element={<Chat />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/parent/*" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="" element={<ParentDashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="chat" element={<Chat />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect to login if not authenticated */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const isProfileOrChat = location.pathname.includes('/profile') || location.pathname.includes('/chat');
  
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="map-container">
          {!isProfileOrChat && children}
        </div>
      </div>
    </div>
  );
};

export default App;