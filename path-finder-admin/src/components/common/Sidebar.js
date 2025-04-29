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
  FaSignOutAlt, 
  FaUserInjured, 
  FaChild, 
  FaSchool, 
  FaBus 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const getRoleFromPath = (pathname) => {
  if (pathname.startsWith('/ambulance')) return 'ambulance';
  if (pathname.startsWith('/parent')) return 'parent';
  return 'police';
};

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = window.location;
  // Determine role from prop or URL path
  const effectiveRole = role || getRoleFromPath(location.pathname);

  // Define menu items for each role
  const policeMenu = [
    { icon: FaHome, text: 'Dashboard', path: '/police' },
    { icon: FaBell, text: 'Emergency Calls', path: '/police/emergency-calls', badge: 5 },
    { icon: FaMapMarkerAlt, text: 'Active Cases', path: '/police/active-cases' },
    { icon: FaComments, text: 'Chat', path: '/police/chat' },
    { icon: FaUser, text: 'Profile', path: '/police/profile' },
    { icon: FaCog, text: 'Settings', path: '/police/settings' }
  ];
  const ambulanceMenu = [
    { icon: FaHome, text: 'Dashboard', path: '/ambulance' },
    { icon: FaBell, text: 'Emergency Calls', path: '/ambulance/emergency-calls', badge: 5 },
    { icon: FaUserInjured, text: 'Patients', path: '/ambulance/patients' },
    { icon: FaMapMarkerAlt, text: 'Live Map', path: '/ambulance/map' },
    { icon: FaComments, text: 'Chat', path: '/ambulance/chat' },
    { icon: FaCog, text: 'Settings', path: '/ambulance/settings' }
  ];
  const parentMenu = [
    { icon: FaHome, text: 'Dashboard', path: '/parent' },
    { icon: FaBell, text: 'Emergency Calls', path: '/parent/emergency-calls', badge: 5 },
    { icon: FaChild, text: 'Children', path: '/parent/children' },
    { icon: FaSchool, text: 'Schools', path: '/parent/schools' },
    { icon: FaBus, text: 'Buses', path: '/parent/buses' },
    { icon: FaMapMarkerAlt, text: 'Live Map', path: '/parent/map' },
    { icon: FaCog, text: 'Settings', path: '/parent/settings' }
  ];

  let menuItems;
  if (effectiveRole === 'ambulance') menuItems = ambulanceMenu;
  else if (effectiveRole === 'parent') menuItems = parentMenu;
  else menuItems = policeMenu;

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