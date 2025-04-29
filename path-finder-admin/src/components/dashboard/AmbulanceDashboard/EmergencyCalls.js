import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Box, 
  Stack, 
  CircularProgress
} from '@mui/material';
import { FaPhone, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import axios from 'axios';

const EmergencyCalls = ({ calls: propCalls = [] }) => {
  const [calls, setCalls] = useState(propCalls);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/emergency-calls');
        setCalls(res.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch emergency calls');
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Emergency Calls
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Stack spacing={2}>
            {calls.length === 0 ? (
              <Typography>No emergency calls found.</Typography>
            ) : (
              calls.map((call, index) => (
                <Box 
                  key={call.id || index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 2, 
                    borderBottom: '1px solid rgba(0,0,0,0.12)' 
                  }}
                >
                  <IconButton color="error">
                    <FaPhone />
                  </IconButton>
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography variant="body1">
                      {call.user?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                      <FaMapMarkerAlt style={{ marginRight: 4 }} />
                      {call.location?.address || 'Location not available'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                      <FaUser style={{ marginRight: 4 }} />
                      {call.user?.phone || 'No phone'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {call.timestamp ? new Date(call.timestamp).toLocaleString() : ''}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyCalls;
