import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Card, CardContent, Typography, Divider, Avatar, Chip, Tooltip, Box } from '@mui/material';
import EmergencyCalls from './PoliceDashboard/EmergencyCalls';
import ActiveCases from './PoliceDashboard/ActiveCases';
import Chat from './PoliceDashboard/Chat';
import Map from './PoliceDashboard/Map';
import { FaPhoneAlt, FaUsers, FaMapMarkerAlt, FaComments, FaUserShield, FaAmbulance, FaUser } from 'react-icons/fa';

const PoliceDashboard = () => {
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }
  }, []);

  // Fetch data functions (omitted for brevity, keep your current logic)

  return (
    <Box sx={{ ml: { xs: 0, md: '260px' }, mt: { xs: 0, md: '20px' }, pr: 2 }}>
      <Container maxWidth="xl" disableGutters sx={{ py: 0, pt: 0, mt: 0 }}>
        {/* Compact Dashboard Header */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5} sx={{ mt: 0, pt: 0, minHeight: 0 }}>
          <Avatar sx={{ bgcolor: '#24346D', width: 40, height: 40 }}>
            <FaUserShield size={22} />
          </Avatar>
          <Box minWidth={120}>
            <Typography variant="h5" fontWeight={700} color="#24346D" sx={{ lineHeight: 1.2 }}>Police Dashboard</Typography>
            <Typography variant="caption" color="#4A90E2">Live Emergency Response & Monitoring</Typography>
          </Box>
          <Box flex={1} />
          <Chip icon={<FaPhoneAlt />} label={`Calls: ${emergencyCalls.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#24346D', fontWeight: 600 }} />
          <Chip icon={<FaUsers />} label={`Active Users: ${activeUsers.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#24346D', fontWeight: 600 }} />
          <Chip icon={<FaComments />} label={`Chat Msgs: ${chatMessages.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#24346D', fontWeight: 600 }} />
          <Chip icon={<FaMapMarkerAlt />} label={`Locations: ${locations.length}`} size="small" sx={{ bgcolor: '#fff', color: '#24346D', fontWeight: 600 }} />
        </Box>
        {/* Map Banner */}
        <Card elevation={4} sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box p={1.5} pb={0}>
              <Typography variant="subtitle1" fontWeight={700} color="#24346D">Live Map</Typography>
            </Box>
            <Divider />
            <Box sx={{ width: '100%', height: { xs: 220, sm: 280, md: 340, lg: 380 }, minHeight: 180 }}>
              <Map locations={locations} activeUsers={activeUsers} userLocation={userLocation} height={320} />
            </Box>
          </CardContent>
        </Card>
        {/* Widgets Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#24346D" mb={1}>Emergency Calls</Typography>
                <Divider sx={{ mb: 2 }} />
                <EmergencyCalls calls={emergencyCalls} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#24346D" mb={1}>Active Cases</Typography>
                <Divider sx={{ mb: 2 }} />
                <ActiveCases cases={activeCases} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight={700} color="#24346D" mb={1} p={2}>Police Chat</Typography>
                <Divider sx={{ mb: 2 }} />
                <Chat messages={chatMessages} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#24346D" mb={1}>Active Users & Services</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {activeUsers.length === 0 && <Typography color="#888">No users online.</Typography>}
                  {activeUsers.map((user, idx) => {
                    let icon = <FaUser />;
                    let color = '#1976d2';
                    if (user.role === 'police') { icon = <FaUserShield />; color = '#24346D'; }
                    if (user.role === 'ambulance') { icon = <FaAmbulance />; color = '#E53935'; }
                    return (
                      <Tooltip key={idx} title={user.name || `User ${user.id}`} placement="top">
                        <Avatar sx={{ bgcolor: color, color: '#fff', width: 44, height: 44, fontWeight: 700 }}>
                          {icon}
                        </Avatar>
                      </Tooltip>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PoliceDashboard;