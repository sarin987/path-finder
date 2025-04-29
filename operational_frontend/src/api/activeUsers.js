// API utility for fetching active users
import axios from 'axios';

export const fetchActiveUsers = async () => {
  const res = await axios.get('/api/users/active');
  return res.data;
};

// Also export login/logout activity helpers
export const markLoginActivity = async (id) => {
  await axios.post('/api/users/login-activity', { id });
};
export const markLogoutActivity = async (id) => {
  await axios.post('/api/users/logout-activity', { id });
};
