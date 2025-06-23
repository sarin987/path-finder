import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Button, TextField, Box, Typography, Container, Paper, Alert } from '@mui/material';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  
  const defaultValues = {
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  } satisfies RegisterFormData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues,
  });

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      setError('');
      setIsLoading(true);
      await registerAuth(
        formData.name,
        formData.phone,
        formData.password
      );
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Create an Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              id="phone"
              autoComplete="tel"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign in
                </Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
