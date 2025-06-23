import React, { useEffect, useState, useRef } from 'react';
import { Box, Container, Grid, Paper, Typography, Avatar, Button, CircularProgress, Badge } from '@mui/material';
import { CheckCircle, Person, ListAlt, Notifications, Map as MapIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  // Fetch initial data and subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/emergencies`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/alerts`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/requests`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/responders`).then(r => r.json()),
    ]).then(([em, al, req, res]) => {
      setEmergencies(em);
      setAlerts(al);
      setRequests(req);
      setResponders(res);
      setLoading(false);
    }).catch(() => setLoading(false));

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('emergency_update', (data: any) => setEmergencies(data));
    socket.on('alert_update', (data: any) => setAlerts(data));
    socket.on('request_update', (data: any) => setRequests(data));
    socket.on('responder_update', (data: any) => setResponders(data));
    return () => { socket.disconnect(); };
  }, []);

  // Stat counts
  const emergenciesToday = emergencies.filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString()).length;
  const activeResponders = responders.filter((r: any) => r.status === 'active').length;
  const openRequests = requests.filter((r: any) => r.status === 'open').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="subtitle1">Emergencies Today</Typography>
            <Typography variant="h3" color="primary.main">{emergenciesToday}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Person color="info" sx={{ fontSize: 48 }} />
            <Typography variant="subtitle1">Active Responders</Typography>
            <Typography variant="h3" color="info.main">{activeResponders}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ListAlt color="warning" sx={{ fontSize: 48 }} />
            <Typography variant="subtitle1">Open Requests</Typography>
            <Typography variant="h3" color="warning.main">{openRequests}</Typography>
          </Paper>
        </Grid>

        {/* Recent Emergencies */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Recent Emergencies</Typography>
            {loading ? <CircularProgress /> : (
              emergencies.length === 0 ? <Typography color="text.secondary">No emergencies.</Typography> :
                emergencies.slice(0, 5).map((e, i) => (
                  <Box key={e.id || i} sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: '#f5f6fa' }}>
                    <Typography variant="subtitle2">{e.type} - {e.userName} <span style={{ color: '#888', fontSize: 12 }}>({new Date(e.createdAt).toLocaleString()})</span></Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>{e.description}</Typography>
                  </Box>
                ))
            )}
          </Paper>
        </Grid>
        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Alerts</Typography>
            {loading ? <CircularProgress /> : (
              alerts.length === 0 ? <Typography color="text.secondary">No alerts.</Typography> :
                alerts.slice(0, 5).map((a, i) => (
                  <Box key={a.id || i} sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: a.unread ? '#fff3e0' : '#f5f6fa' }}>
                    <Typography variant="subtitle2">{a.title} <span style={{ color: '#888', fontSize: 12 }}>({new Date(a.createdAt).toLocaleString()})</span></Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>{a.message}</Typography>
                  </Box>
                ))
            )}
          </Paper>
        </Grid>
        {/* Requests */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Requests</Typography>
            {loading ? <CircularProgress /> : (
              requests.length === 0 ? <Typography color="text.secondary">No requests.</Typography> :
                requests.slice(0, 5).map((r, i) => (
                  <Box key={r.id || i} sx={{ mb: 1, p: 1, borderRadius: 2, bgcolor: r.status === 'open' ? '#e3f2fd' : '#f5f6fa' }}>
                    <Typography variant="subtitle2">{r.title} <span style={{ color: '#888', fontSize: 12 }}>({new Date(r.createdAt).toLocaleString()})</span></Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>Status: {r.status}</Typography>
                  </Box>
                ))
            )}
          </Paper>
        </Grid>
        {/* Active Responders */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Active Responders</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {responders.length === 0 ? <Typography color="text.secondary">No responders.</Typography> :
                responders.slice(0, 6).map((r, i) => (
                  <Badge key={r.id || i} color={r.status === 'active' ? 'success' : 'default'} variant="dot" overlap="circular">
                    <Avatar sx={{ bgcolor: r.role === 'police' ? 'primary.main' : r.role === 'ambulance' ? 'info.main' : 'error.main', width: 48, height: 48 }}>
                      {r.name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  </Badge>
                ))
              }
            </Box>
          </Paper>
        </Grid>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 3 }}>
            <Button variant="contained" color="primary" size="large" startIcon={<MapIcon />} onClick={() => navigate('/map')}>Go to Map</Button>
            <Button variant="outlined" color="info" size="large" startIcon={<ChatIcon />} onClick={() => navigate('/chat')}>Open Chat</Button>
            <Button variant="outlined" color="warning" size="large" startIcon={<Notifications />} onClick={() => navigate('/alerts')}>View Alerts</Button>
            <Button variant="outlined" color="secondary" size="large" startIcon={<ListAlt />} onClick={() => navigate('/requests')}>View Requests</Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
