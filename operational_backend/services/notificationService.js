const { admin } = require('../config/firebase-admin');
const db = require('../models');

class NotificationService {
  static async saveFCMToken(userId, token) {
    try {
      await db.User.update(
        { fcmToken: token },
        { where: { id: userId } }
      );
      return { success: true, message: 'FCM token saved successfully' };
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw new Error('Failed to save FCM token');
    }
  }

  static async sendNotification(userId, title, body, data = {}) {
    try {
      // Get user's FCM token from database
      const user = await db.User.findByPk(userId);
      if (!user || !user.fcmToken) {
        console.log('User or FCM token not found');
        return false;
      }

      const message = {
        notification: { title, body },
        data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        token: user.fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  static async sendBulkNotifications(userIds, title, body, data = {}) {
    try {
      const users = await db.User.findAll({
        where: {
          id: userIds,
          fcmToken: { [db.Sequelize.Op.ne]: null }
        }
      });

      if (users.length === 0) {
        console.log('No users with FCM tokens found');
        return [];
      }

      const messages = users.map(user => ({
        notification: { title, body },
        data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        token: user.fcmToken,
      }));

      const response = await admin.messaging().sendAll(messages);
      console.log('Successfully sent bulk messages:', response);
      return response.responses;
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
