const { RoleLocation, User } = require('../models');

// Update user's location
exports.updateLocation = async (req, res) => {
  try {
    const { role, lat, lng } = req.body;
    const userId = req.user.id;

    // Validate role
    const validRoles = ['police', 'ambulance', 'fire', 'parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Update or create location record
    const [location, created] = await RoleLocation.upsert(
      {
        role_id: userId,
        role_type: role,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        last_updated: new Date(),
        status: 'available'
      },
      {
        where: { role_id: userId, role_type: role }
      }
    );

    res.status(200).json({ message: 'Location updated successfully', location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Get all locations for a specific role
exports.getRoleLocations = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    const validRoles = ['police', 'ambulance', 'fire', 'parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get all active locations for the role (updated in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const locations = await RoleLocation.findAll({
      where: {
        role_type: role,
        last_updated: {
          [Op.gte]: fiveMinutesAgo
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone']
        }
      ]
    });

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};
