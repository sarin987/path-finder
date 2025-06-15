import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.palette.grey[100],
  padding: theme.spacing(3),
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 480,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
}));

const Logo = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  '& img': {
    width: 64,
    height: 64,
    marginBottom: theme.spacing(2),
  },
}));

interface AuthLayoutProps {
  children?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <AuthContainer>
      <CssBaseline />
      <AuthPaper elevation={3}>
        <Logo>
          <img src="/logo.svg" alt="Safety Emergency App" />
          <Typography component="h1" variant="h5">
            Safety Emergency App
          </Typography>
        </Logo>
        {children || <Outlet />}
      </AuthPaper>
    </AuthContainer>
  );
};

export default AuthLayout;
