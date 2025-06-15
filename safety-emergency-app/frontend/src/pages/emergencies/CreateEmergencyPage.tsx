import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Typography, Paper, Button, Grid, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '@/services/emergencyService';
import type { Emergency, EmergencyStatus } from '@/types/emergency';

// Form validation schema
const emergencySchema = z.object({
  type: z.enum(['medical', 'fire', 'police', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5, 'Address is required'),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

const CreateEmergencyPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      type: 'medical',
      severity: 'medium',
      description: '',
      latitude: 0,
      longitude: 0,
      address: '',
    },
  });

  const mutation = useMutation<Emergency, Error, EmergencyFormData>({
    mutationFn: (data: EmergencyFormData) => emergencyService.createEmergency({
      ...data,
      status: 'pending' as EmergencyStatus,
      userId: 'current-user-id', // This should be replaced with the actual user ID from auth context
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude]
      },
      address: data.address,
      description: data.description,
      severity: data.severity,
      type: data.type
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      navigate('/emergencies');
    },
    onError: (error: Error) => {
      console.error('Error creating emergency:', error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: EmergencyFormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Update form values with current location
          // Note: In a real app, you would update the form values here
          console.log('Current position:', position.coords);
          // This is a simplified example - in a real app, you would update the form fields
          // with position.coords.latitude and position.coords.longitude
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Report New Emergency
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!!errors.type}>
                <InputLabel id="emergency-type-label">Emergency Type</InputLabel>
                <Select
                  labelId="emergency-type-label"
                  label="Emergency Type"
                  defaultValue="medical"
                  {...register('type')}
                >
                  <MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="fire">Fire</MenuItem>
                  <MenuItem value="police">Police</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" error={!!errors.severity}>
                <InputLabel id="severity-label">Severity</InputLabel>
                <Select
                  labelId="severity-label"
                  label="Severity"
                  defaultValue="medium"
                  {...register('severity')}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="Address"
                variant="outlined"
                error={!!errors.address}
                helperText={errors.address?.message}
                {...register('address')}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Latitude"
                  type="number"
                  variant="outlined"
                  error={!!errors.latitude}
                  helperText={errors.latitude?.message}
                  {...register('latitude', { valueAsNumber: true })}
                />
                <TextField
                  fullWidth
                  label="Longitude"
                  type="number"
                  variant="outlined"
                  error={!!errors.longitude}
                  helperText={errors.longitude?.message}
                  {...register('longitude', { valueAsNumber: true })}
                />
              </Box>
              
              <Button 
                variant="outlined" 
                onClick={getCurrentLocation}
                sx={{ mt: 2 }}
                fullWidth
              >
                Use Current Location
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                margin="normal"
                label="Description"
                variant="outlined"
                error={!!errors.description}
                helperText={errors.description?.message || 'Please provide a detailed description of the emergency'}
                {...register('description')}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Report Emergency'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateEmergencyPage;
