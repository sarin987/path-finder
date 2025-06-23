import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Avatar, 
  Divider, 
  Alert, 
  CircularProgress,
  IconButton,
  InputAdornment,
  Grid
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  LockReset as ResetPasswordIcon
} from '@mui/icons-material';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user, reset]);

  const handleClickShowPassword = (field: keyof typeof showPassword) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!user) return;
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      
      // Prepare update data
      const { currentPassword, newPassword, confirmPassword, ...profileData } = data;
      
      // Only include password fields if they are provided
      const updateData: any = { 
        ...profileData,
        ...(currentPassword && newPassword && { currentPassword, newPassword })
      };
      
      await updateProfile(updateData);
      setSuccess('Profile updated successfully');
      
      // Reset form to clear password fields
      reset({
        ...updateData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }, { keepValues: false });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            width={{ xs: '100%', md: 200 }}
            flexShrink={0}
          >
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h6" align="center">
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Typography>
          </Box>
          
          <Box flexGrow={1}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            
            <Box component="form" onSubmit={(e) => {
              e.preventDefault();
              void onSubmit(e);
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    {...register('phoneNumber')}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ResetPasswordIcon color="action" />
                      <Typography variant="body2" color="textSecondary">
                        Change Password
                      </Typography>
                    </Box>
                  </Divider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showPassword.current ? 'text' : 'password'}
                    {...register('currentPassword')}
                    error={!!errors.currentPassword}
                    helperText={errors.currentPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword('current')}
                            edge="end"
                          >
                            {showPassword.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showPassword.new ? 'text' : 'password'}
                    {...register('newPassword')}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword('new')}
                            edge="end"
                          >
                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => handleClickShowPassword('confirm')}
                            edge="end"
                          >
                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        if (user) {
                          reset({
                            name: user.name,
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                          setError('');
                          setSuccess('');
                        }
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={!isDirty || isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
