import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Map as MapIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import LocationMap from '@/components/LocationMap';

const drawerWidth = 240;

const DashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Calculate dynamic heights for responsive layout
  const mapHeight = useMemo(() => {
    if (isMobile) {
      return 'calc(100vh - 56px - 48px)' // header + tabs
    }
    return 'calc(100vh - 64px - 48px - 32px)' // header + tabs + container padding
  }, [isMobile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem 
          button 
          selected={activeTab === 0}
          onClick={(e) => handleTabChange(e, 0)}
        >
          <ListItemIcon><MapIcon /></ListItemIcon>
          <ListItemText primary="Map View" />
        </ListItem>
        <ListItem 
          button 
          selected={activeTab === 1}
          onClick={(e) => handleTabChange(e, 1)}
        >
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Responders" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Emergency Response Dashboard
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              {!isMobile && 'Logout'}
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            <Paper 
              elevation={3} 
              sx={{ 
                height: mapHeight,
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2
              }}
            >
              <LocationMap 
                key="map-view" 
                role="all" 
                style={{ 
                  height: '100%',
                  width: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }} 
              />
            </Paper>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 1, sm: 2, md: 3 },
                minHeight: '50vh',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>Responders</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary">
                    Responders list will be displayed here
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
