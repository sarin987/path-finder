// API Route configuration
export const API_ROUTES = {
  base: process.env.API_URL || 'http://localhost:5000/api',
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    verifyOtp: '/auth/verify-otp',
    googleAuth: '/auth/google',
  },
  user: {
    profile: '/users/profile',
    update: '/users/update',
  },
  incidents: {
    create: '/incidents',
    getAll: '/incidents',
    getById: (id) => `/incidents/${id}`,
    update: (id) => `/incidents/${id}`,
    delete: (id) => `/incidents/${id}`,
  },
  // Add more routes as needed
};

export default API_ROUTES;
