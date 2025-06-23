import { useState, useCallback, memo, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { TextField, Box, Typography, Container, Paper, Alert, Button } from '@mui/material';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    register: formRegister,
    handleSubmit: formHandleSubmit,
    formState: { errors: formErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleFormSubmit = useCallback(
    async (data: LoginFormData) => {
      console.log('LoginPage: Form submitted with data:', data);
      setError('');
      setIsLoading(true);
      
      try {
        console.log('LoginPage: Attempting to login...');
        
        const user = await login(data.phone, data.password);
        
        if (!user) {
          console.log('LoginPage: Login was aborted');
          setIsLoading(false);
          return;
        }
        
        console.log('LoginPage: Login successful, user:', user);
        
        // Navigate based on user role or to a default route
        const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
        console.log('LoginPage: Navigating to', redirectPath);
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('LoginPage: Login error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate]
  );

  // Memoize form styles to prevent recreation on every render
  const formContainerStyles = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }), []);

  const formStyles = useMemo(() => ({
    mt: 1,
    width: '100%'
  }), []);

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={formContainerStyles}>
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box 
            component="form" 
            onSubmit={formHandleSubmit(handleFormSubmit)} 
            sx={formStyles}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              autoFocus
              {...formRegister('phone')}
              error={!!formErrors.phone}
              helperText={formErrors.phone?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              {...formRegister('password')}
              error={!!formErrors.password}
              helperText={formErrors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <RouterLink to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot Password?
                </Typography>
              </RouterLink>
              <RouterLink to="/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Don't have an account? Sign Up
                </Typography>
              </RouterLink>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// Only re-render if props change (none in this case, so it will never re-render)
const areEqual = () => true;

export default memo(LoginPage, areEqual);
