import { useState, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  // Memoize user initial to prevent recalculation on every render
  const userInitial = useMemo(() => user?.name?.charAt(0).toUpperCase() || 'U', [user?.name]);

  const handleProfileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleNotificationsMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  }, []);

  const handleLogout = useCallback(async () => {
    handleMenuClose();
    await logout();
    navigate('/login', { replace: true });
  }, [handleMenuClose, logout, navigate]);

  const handleProfile = useCallback(() => {
    handleMenuClose();
    navigate('/profile');
  }, [handleMenuClose, navigate]);

  const handleSettings = useCallback(() => {
    handleMenuClose();
    navigate('/settings');
  }, [handleMenuClose, navigate]);

  const notificationsOpen = Boolean(notificationsAnchorEl);
  const profileOpen = Boolean(anchorEl);

  // Memoize the app bar and toolbar styles
  const appBarSx = useMemo(() => ({
    zIndex: (theme: any) => theme.zIndex.drawer + 1,
    backgroundColor: 'background.paper',
    color: 'text.primary',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }), []);

  const toolbarSx = useMemo(() => ({
    minHeight: { xs: '56px', sm: '64px' },
    px: { xs: 1, sm: 2 }
  }), []);

  const titleSx = useMemo(() => ({
    flexGrow: 1,
    display: { xs: 'none', sm: 'block' },
    color: 'primary.main',
    fontWeight: 600
  }), []);

  return (
    <AppBar position="fixed" sx={appBarSx}>
      <Toolbar sx={toolbarSx}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={titleSx}
        >
          Safety Emergency App
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationsMenuOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              alt={user?.name || 'User'}
              src={user?.avatar}
              sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}
            >
              {userInitial}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={notificationsOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemText primary="No new notifications" />
        </MenuItem>
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={profileOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

// Only re-render if props change
const areEqual = (prevProps: HeaderProps, nextProps: HeaderProps) => {
  return prevProps.onMenuClick === nextProps.onMenuClick;
};

const Header = memo(HeaderComponent, areEqual);

export default Header;
