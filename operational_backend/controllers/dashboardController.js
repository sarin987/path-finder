const { sequelize } = require('../config/database');

const dashboardController = {
  // New: Unified role-based dashboard endpoint for police, ambulance, fire, admin
  getDashboardForRole: async (req, res, forcedRole) => {
    try {
      const userRole = forcedRole || req.user?.role || 'user';
      const userId = req.user?.id || 0;
      // Prepare stats for new UI
      let stats = {};
      let activeRequests = [];
      let avgResponseTime = '0m';
      let todayIncidents = 0;
      // Example: Fetch real data from DB here
      switch (userRole) {
        case 'admin':
          stats = {
            totalUsers: await getUserCount(),
            activeSessions: await getActiveSessionsCount(),
            pendingApprovals: await getPendingApprovalsCount()
          };
          break;
        case 'police':
        case 'ambulance':
        case 'fire':
          stats = {
            accepted: await getAcceptedRequestsCount(userId),
            pending: await getPendingRequestsCount(userId),
            resolved: await getResolvedRequestsCount(userId),
          };
          avgResponseTime = await getAverageResponseTime(userId);
          todayIncidents = await getTodayIncidentsCount();
          activeRequests = await getActiveRequests(userId);
          break;
        default:
          stats = {};
      }
      res.json({
        status: 'success',
        data: {
          role: userRole,
          stats,
          avgResponseTime,
          todayIncidents,
          activeRequests
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  }
};

// --- New helper functions for new dashboard ---
async function getAcceptedRequestsCount(userId) {
  // TODO: Replace with real DB query
  return Math.floor(Math.random() * 20);
}
async function getPendingRequestsCount(userId) {
  // TODO: Replace with real DB query
  return Math.floor(Math.random() * 10);
}
async function getResolvedRequestsCount(userId) {
  // TODO: Replace with real DB query
  return Math.floor(Math.random() * 15);
}
async function getAverageResponseTime(userId) {
  // TODO: Replace with real DB query
  return `${Math.floor(Math.random() * 10) + 1} m ${Math.floor(Math.random() * 60)} s`;
}
async function getTodayIncidentsCount() {
  // TODO: Replace with real DB query
  return Math.floor(Math.random() * 10) + 1;
}
async function getActiveRequests(userId) {
  // TODO: Replace with real DB query
  // Example: [{ id, userName, type, timeAgo, status }]
  return [
    { id: 1, userName: 'Emily Davis', type: 'Harassment', timeAgo: '7 min', status: 'pending' },
    { id: 2, userName: 'Michael Brown', type: 'Fire', timeAgo: '12 min', status: 'accepted' },
    { id: 3, userName: 'Sarah Johnson', type: 'Accident', timeAgo: '30 min', status: 'pending' }
  ];
}
// --- End new helpers ---

module.exports = dashboardController;
