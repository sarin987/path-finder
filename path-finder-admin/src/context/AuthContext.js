// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationPreferences, setLocationPreferences] = useState({
    zoom: 15,
    mapType: 'roadmap',
    showTraffic: false,
    showBikeLanes: false
  });

  useEffect(() => {
    // Check for saved credentials and preferences
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');
    const savedRemember = localStorage.getItem('rememberMe');
    const savedLocation = localStorage.getItem('location');
    const savedPreferences = localStorage.getItem('locationPreferences');

    if (savedRemember === 'true') {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
      setLocation(JSON.parse(savedLocation));
      setLocationPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const login = (userData, userRole, userLocation, remember) => {
    setUser(userData);
    setRole(userRole);
    setLocation(userLocation);
    setRememberMe(remember);

    if (remember) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      localStorage.setItem('location', JSON.stringify(userLocation));
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('locationPreferences', JSON.stringify(locationPreferences));
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setLocation(null);
    setRememberMe(false);
    setLocationPreferences({
      zoom: 15,
      mapType: 'roadmap',
      showTraffic: false,
      showBikeLanes: false
    });
    localStorage.clear();
  };

  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    if (rememberMe) {
      localStorage.setItem('location', JSON.stringify(newLocation));
    }
  };

  const updateLocationPreferences = (newPreferences) => {
    setLocationPreferences(newPreferences);
    if (rememberMe) {
      localStorage.setItem('locationPreferences', JSON.stringify(newPreferences));
    }
  };

  const resetPassword = async (email) => {
    // In a real app, this would make an API call to reset password
    try {
      // Simulate password reset request
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      location,
      locationPreferences,
      rememberMe,
      login, 
      logout,
      updateLocation,
      updateLocationPreferences,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};