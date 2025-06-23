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
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onClose, isMobile }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Remove local mobile state as it's now controlled by parent
  const [open, setOpen] = useState({
    emergencies: false,
    management: false,
  });

  // Close drawer when route changes
  useEffect(() => {
    if (isMobile) {
      onClose();
    }
  }, [location.pathname, isMobile, onClose]);

  // Toggle submenu
  const handleClick = (item: string) => {
    setOpen({ ...open, [item]: !open[item as keyof typeof open] });
  };

  // Menu items
  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ];

  const emergencyMenuItems = [
    { text: 'All Emergencies', icon: <EmergencyListIcon />, path: '/emergencies' },
    { text: 'Create Emergency', icon: <CreateEmergencyIcon />, path: '/emergencies/create' },
    { text: 'Map View', icon: <MapIcon />, path: '/map' },
    { text: 'Chat', icon: <ChatIcon />, path: '/chat' },
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

  const drawerContent = (
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
      aria-label="navigation"
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: isMobile ? theme.shadows[16] : 'none',
            backgroundColor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
