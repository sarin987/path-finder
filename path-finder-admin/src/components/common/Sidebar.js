import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Typography, 
  IconButton, 
  Badge 
} from '@mui/material';
import { 
  FaHome, 
  FaBell, 
  FaMapMarkerAlt, 
  FaUser, 
  FaComments, 
  FaCog, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: FaHome,
      text: 'Dashboard',
      path: '/dashboard'
    },
    {
      icon: FaBell,
      text: 'Emergency Calls',
      path: '/emergency-calls',
      badge: 5 // Example badge count
    },
    {
      icon: FaMapMarkerAlt,
      text: 'Active Cases',
      path: '/active-cases'
    },
    {
      icon: FaComments,
      text: 'Chat',
      path: '/chat'
    },
    {
      icon: FaUser,
      text: 'Profile',
      path: '/profile'
    },
    {
      icon: FaCog,
      text: 'Settings',
      path: '/settings'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1a237e',
          color: 'white'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1 
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold', 
            fontSize: '1.2rem' 
          }}>
            {user?.name || 'User Name'}
          </Typography>
          <Typography variant="caption" sx={{ 
            opacity: 0.7, 
            fontSize: '0.875rem' 
          }}>
            {user?.role || 'Police Officer'}
          </Typography>
        </Box>
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  <item.icon />
                </Badge>
              ) : (
                <item.icon />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ color: 'white' }} 
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', padding: 2 }}>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon sx={{ color: 'white' }}>
            <FaSignOutAlt />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: 'white' }} />
        </ListItem>
      </Box>
    </Drawer>
  );
};

export default Sidebar;