import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Card, CardContent, Typography, Divider, Avatar, Chip, Tooltip, Box } from '@mui/material';
import { FaFireExtinguisher, FaPhoneAlt, FaUsers, FaMapMarkerAlt, FaComments, FaUser } from 'react-icons/fa';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const FireDashboard = () => {
  const { user } = useAuth();
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [fireIncidents, setFireIncidents] = useState([]);
  const [resources, setResources] = useState({ trucks: 2, personnel: 8, hoses: 5 });

  // Real-time geolocation and socket emit for firefighters
  useEffect(() => {
    let watchId;
    if (navigator.geolocation && user) {
      const sendLoc = (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation({ lat: loc.latitude, lng: loc.longitude });
        socket.emit('responder_location_update', {
          id: user.id,
          role: 'fire',
          name: user.name,
          contact: user.contact || user.phone || '',
          location: loc
        });
      };
      navigator.geolocation.getCurrentPosition(sendLoc);
      watchId = navigator.geolocation.watchPosition(sendLoc);
    }
    return () => {
      if (navigator.geolocation && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);

  // Demo: Fetch fire incidents (replace with actual API)
  useEffect(() => {
    setFireIncidents([
      { id: 1, location: 'Sector 12', status: 'Active', reportedAt: '17:30', type: 'Building Fire' },
      { id: 2, location: 'Market Road', status: 'Resolved', reportedAt: '16:10', type: 'Vehicle Fire' }
    ]);
  }, []);

  // Add custom features/widgets for firefighters as needed
  // For demo, similar layout to other dashboards
  return (
    <Box sx={{ ml: { xs: 0, md: '260px' }, mt: { xs: 0, md: '20px' }, pr: 2 }}>
      <Container maxWidth="xl" disableGutters sx={{ py: 0, pt: 0, mt: 0 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5} sx={{ mt: 0, pt: 0, minHeight: 0 }}>
          <Avatar sx={{ bgcolor: '#D84315', width: 40, height: 40 }}>
            <FaFireExtinguisher size={22} />
          </Avatar>
          <Box minWidth={120}>
            <Typography variant="h5" fontWeight={700} color="#D84315" sx={{ lineHeight: 1.2 }}>Fire Brigade Dashboard</Typography>
            <Typography variant="caption" color="#FF7043">Live Fire Response & Monitoring</Typography>
          </Box>
          <Box flex={1} />
          <Chip icon={<FaPhoneAlt />} label={`Calls: ${emergencyCalls.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#D84315', fontWeight: 600 }} />
          <Chip icon={<FaUsers />} label={`Active Users: ${activeUsers.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#D84315', fontWeight: 600 }} />
          <Chip icon={<FaComments />} label={`Chat Msgs: ${chatMessages.length}`} size="small" sx={{ mr: 0.5, bgcolor: '#fff', color: '#D84315', fontWeight: 600 }} />
          <Chip icon={<FaMapMarkerAlt />} label={`Locations: ${locations.length}`} size="small" sx={{ bgcolor: '#fff', color: '#D84315', fontWeight: 600 }} />
        </Box>
        {/* Map Banner & Widgets can be added here, similar to other dashboards */}
        {/* Custom Fire Brigade Widgets */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#D84315" mb={1}>Fire Incident Log</Typography>
                <Divider sx={{ mb: 2 }} />
                {fireIncidents.length === 0 ? <Typography color="#888">No incidents.</Typography> : (
                  <Box>
                    {fireIncidents.map(inc => (
                      <Box key={inc.id} mb={1}>
                        <Typography fontWeight={700}>{inc.type} - {inc.location}</Typography>
                        <Typography variant="caption" color="#D84315">{inc.status} | Reported at {inc.reportedAt}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#D84315" mb={1}>Resource Status</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>Trucks: {resources.trucks}</Typography>
                <Typography>Personnel: {resources.personnel}</Typography>
                <Typography>Hoses: {resources.hoses}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={4} sx={{ borderRadius: 3, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} color="#D84315" mb={1}>Quick Actions</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" gap={2}>
                  <Chip color="error" label="Call HQ" onClick={() => window.open('tel:101')}/>
                  <Chip color="warning" label="Broadcast Alert" onClick={() => alert('Alert sent to all fire units!')}/>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FireDashboard;
