import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  Box,
  Collapse,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Warning as EmergencyIcon,
  Person as ProfileIcon,
  Group as UsersIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  AddAlert as CreateEmergencyIcon,
  ListAlt as EmergencyListIcon,
  Map as MapIcon,
  Notifications as AlertsIcon,
  History as HistoryIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState({
    emergencies: false,
    management: false,
  });

  // Toggle sidebar on mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Toggle submenu
  const handleClick = (item: string) => {
    setOpen({ ...open, [item]: !open[item as keyof typeof open] });
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location, isMobile]);

  // Menu items
  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ];

  const emergencyMenuItems = [
    { text: 'All Emergencies', icon: <EmergencyListIcon />, path: '/emergencies' },
    { text: 'Create Emergency', icon: <CreateEmergencyIcon />, path: '/emergencies/create' },
    { text: 'Map View', icon: <MapIcon />, path: '/map' },
  ];

  const adminMenuItems = [
    { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
    { text: 'Alerts', icon: <AlertsIcon />, path: '/admin/alerts' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/admin/reports' },
  ];

  const userMenuItems = [
    { text: 'My Profile', icon: <ProfileIcon />, path: '/profile' },
    { text: 'My Emergencies', icon: <HistoryIcon />, path: '/my-emergencies' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const renderMenuItems = (items: any[]) => {
    return items.map((item) => (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          selected={location.pathname === item.path}
          onClick={() => navigate(item.path)}
          sx={{
            '&.Mui-selected': {
              backgroundColor: theme.palette.action.selected,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            borderRadius: 1,
            mx: 1,
            my: 0.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    ));
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            py: 2,
          }}
        >
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Safety App
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      
      <List>
        {renderMenuItems(mainMenuItems)}
        
        <ListItemButton onClick={() => handleClick('emergencies')}>
          <ListItemIcon><EmergencyIcon /></ListItemIcon>
          <ListItemText primary="Emergencies" />
          {open.emergencies ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open.emergencies} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderMenuItems(emergencyMenuItems)}
          </List>
        </Collapse>
        
        {user?.role === 'admin' && (
          <>
            <ListItemButton onClick={() => handleClick('management')}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Admin" />
              {open.management ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open.management} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderMenuItems(adminMenuItems)}
              </List>
            </Collapse>
          </>
        )}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      <List>
        {renderMenuItems(userMenuItems)}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: drawerWidth },
        flexShrink: { sm: 0 },
      }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
