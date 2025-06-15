import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { styled } from '@mui/material/styles';

// Components
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

const Main = styled('main')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(7) + 1,
  },
}));

const MainLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Main>
        <Toolbar /> {/* This pushes content down below the app bar */}
        <Box sx={{ mt: 2 }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default MainLayout;
