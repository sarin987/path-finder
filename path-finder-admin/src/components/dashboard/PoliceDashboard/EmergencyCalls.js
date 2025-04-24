import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Box, 
  Stack, 
  Grid 
} from '@mui/material';
import { FaPhone, FaMapMarkerAlt, FaUser } from 'react-icons/fa';

const EmergencyCalls = ({ calls }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Emergency Calls
        </Typography>
        <Stack spacing={2}>
          {calls.map((call, index) => (
            <Box 
              key={call.id} 
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
                  <FaMapMarkerAlt sx={{ mr: 1 }} />
                  {call.location?.address || 'Location not available'}
                </Typography>
                <Typography variant="body2" color="text.secondary" display="flex" alignItems="center">
                  <FaUser sx={{ mr: 1 }} />
                  {call.user?.phone || 'No phone'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {new Date(call.timestamp).toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EmergencyCalls;