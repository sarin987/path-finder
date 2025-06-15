import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Button, Grid, Divider, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { emergencyService } from '@/services/emergencyService';
import type { Emergency } from '@/types/emergency';

const EmergencyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: emergency, isLoading, error } = useQuery<Emergency, Error>({
    queryKey: ['emergency', id],
    queryFn: () => emergencyService.getEmergency(id!)
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!emergency) {
    return <div>Emergency not found</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Emergency Details</Typography>
        <Chip 
          label={emergency.status} 
          color={
            emergency.status === 'resolved' ? 'success' : 
            emergency.status === 'in-progress' ? 'warning' : 'error'
          }
        />
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">Type</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {emergency.type.charAt(0).toUpperCase() + emergency.type.slice(1)}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">Severity</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {emergency.severity}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">Reported At</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {new Date(emergency.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">Location</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {emergency.address || 'Location not specified'}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary">Coordinates</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {emergency.location.coordinates[1]}, {emergency.location.coordinates[0]}
            </Typography>
            
            {emergency.resolvedAt && (
              <>
                <Typography variant="subtitle1" color="textSecondary">Resolved At</Typography>
                <Typography variant="body1">
                  {new Date(emergency.resolvedAt).toLocaleString()}
                </Typography>
              </>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" color="textSecondary">Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {emergency.description || 'No description provided.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => window.history.back()}>
          Back to List
        </Button>
        {/* Add more actions as needed */}
      </Box>
    </Box>
  );
};

export default EmergencyDetailsPage;
