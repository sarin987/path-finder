import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Button, Box, Grid, Container, Paper, Divider, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LocalHospital as AmbulanceIcon, 
  FireTruck as FireIcon,
  Warning as EmergencyIcon,
  Person as ProfileIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <Card elevation={3} sx={{ height: '100%', borderTop: `4px solid ${color}` }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom>{title}</Typography>
          <Typography variant="h5" component="div">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    emergencies: 0,
    activeResponders: 0,
    resolvedCases: 0,
    responseTime: '0 min',
  });
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setStats({
          emergencies: 12,
          activeResponders: 8,
          resolvedCases: 45,
          responseTime: '8 min',
        });
        
        // In a real app, you would do something like:
        // const response = await fetch('/api/dashboard/stats');
        // const data = await response.json();
        // setStats(data);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleEmergency = () => {
    // Handle emergency button click
    console.log('Emergency button clicked');
    // Navigate to emergency page or show emergency dialog
  };

  if (authLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" flexDirection="column">
        <Typography color="error" variant="h6" gutterBottom>
          Error loading dashboard
        </Typography>
        <Typography color="textSecondary" paragraph>
          {error}
        </Typography>
        <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleEmergency}
            startIcon={<EmergencyIcon />}
            sx={{ mr: 2 }}
          >
            Emergency
          </Button>
          <Button
            variant="outlined"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Resolved Cases" 
            value={stats.resolvedCases} 
            icon={<AmbulanceIcon fontSize="large" />} 
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg. Response Time" 
            value={stats.responseTime} 
            icon={<FireIcon fontSize="large" />} 
            color="#ff9800"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Emergencies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box flexGrow={1} display="flex" justifyContent="center" alignItems="center">
              <Typography color="textSecondary">Emergency map and list will appear here</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<ProfileIcon />}
                sx={{ mb: 2 }}
                onClick={() => navigate('/profile')}
              >
                My Profile
              </Button>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<EmergencyIcon />}
                sx={{ mb: 2 }}
                onClick={() => navigate('/emergencies')}
              >
                View All Emergencies
              </Button>
              {user?.role === 'user' && (
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="error"
                  startIcon={<EmergencyIcon />}
                  onClick={handleEmergency}
                >
                  Report Emergency
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
