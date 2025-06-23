const { sequelize } = require('../config/database');

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      // Get user role from request (assuming it's set by auth middleware)
      const userRole = req.user?.role || 'user';
      
      // Initialize response data
      const responseData = {
        status: 'success',
        message: `Dashboard data for ${userRole}`,
        data: {
          role: userRole,
          stats: {},
          recentActivities: [],
          notifications: []
        }
      };

      // Add role-specific data
      switch (userRole) {
        case 'admin':
          // Admin-specific data
          responseData.data.stats = {
            totalUsers: await getUserCount(),
            activeSessions: await getActiveSessionsCount(),
            pendingApprovals: await getPendingApprovalsCount()
          };
          responseData.data.recentActivities = await getRecentActivities(10);
          break;
          
        case 'responder':
          // Responder-specific data
          responseData.data.stats = {
            assignedCases: await getAssignedCasesCount(req.user.id),
            resolvedCases: await getResolvedCasesCount(req.user.id),
            averageResponseTime: await getAverageResponseTime(req.user.id)
          };
          responseData.data.recentAlerts = await getRecentAlerts(10);
          break;
          
        default:
          // User-specific data
          responseData.data.stats = {
            activeRequests: await getActiveRequestsCount(req.user?.id || 0),
            completedRequests: await getCompletedRequestsCount(req.user?.id || 0),
            responseTime: await getAverageResponseTimeForUser(req.user?.id || 0)
          };
          responseData.data.recentRequests = await getRecentRequests(req.user?.id || 0, 5);
      }

      res.json(responseData);
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

// Mock data functions - replace with actual database queries
async function getUserCount() {
  const [results] = await sequelize.query('SELECT COUNT(*) as count FROM users');
  return results[0].count;
}

async function getActiveSessionsCount() {
  // Implement actual logic to get active sessions
  return Math.floor(Math.random() * 100);
}

async function getPendingApprovalsCount() {
  // Implement actual logic to get pending approvals
  return Math.floor(Math.random() * 10);
}

async function getRecentActivities(limit = 10) {
  // Implement actual logic to get recent activities
  return [];
}

async function getAssignedCasesCount(responderId) {
  // Implement actual logic to get assigned cases count
  return Math.floor(Math.random() * 10);
}

async function getResolvedCasesCount(responderId) {
  // Implement actual logic to get resolved cases count
  return Math.floor(Math.random() * 50);
}

async function getAverageResponseTime(responderId) {
  // Implement actual logic to calculate average response time
  return (Math.random() * 60).toFixed(2);
}

async function getRecentAlerts(limit = 10) {
  // Implement actual logic to get recent alerts
  return [];
}

async function getActiveRequestsCount(userId) {
  // Implement actual logic to get active requests count
  return Math.floor(Math.random() * 5);
}

async function getCompletedRequestsCount(userId) {
  // Implement actual logic to get completed requests count
  return Math.floor(Math.random() * 20);
}

async function getAverageResponseTimeForUser(userId) {
  // Implement actual logic to calculate average response time for user
  return (Math.random() * 30).toFixed(2);
}

async function getRecentRequests(userId, limit = 5) {
  // Implement actual logic to get recent requests
  return [];
}

module.exports = dashboardController;
