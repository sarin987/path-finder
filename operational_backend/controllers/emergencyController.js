const Emergency = require('../models/Emergency.js');
const User = require('../models/User.js');
const { io } = require('../server.js');

// @desc    Create a new emergency alert
// @route   POST /api/emergency
// @access  Private
const createEmergency = async (req, res) => {
  try {
    const { type, location, address, description, severity } = req.body;
    
    // Create emergency
    const emergency = await Emergency.create({
      userId: req.user.id,
      type,
      location,
      address,
      description,
      severity,
      status: 'pending'
    });

    // Broadcast to all connected clients
    io.emit('new-emergency', emergency);

    res.status(201).json(emergency);
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({ message: 'Server error while creating emergency' });
  }
};

// @desc    Get all emergencies (with filters)
// @route   GET /api/emergency
// @access  Private
const getEmergencies = async (req, res) => {
  try {
    const { status, type, severity, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (severity) whereClause.severity = severity;

    // For non-admin users, only show their own emergencies
    if (req.user.role === 'user') {
      whereClause.userId = req.user.id;
    } else if (req.user.role === 'responder') {
      // Responders can see all emergencies assigned to them or unassigned ones
      whereClause[Op.or] = [
        { assignedTo: req.user.id },
        { assignedTo: null }
      ];
    }

    const { count, rows } = await Emergency.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: rows
    });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ message: 'Server error while fetching emergencies' });
  }
};

// @desc    Get emergency by ID
// @route   GET /api/emergency/:id
// @access  Private
const getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'responder',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Check if user has permission to view this emergency
    if (
      req.user.role === 'user' && 
      emergency.userId !== req.user.id &&
      emergency.assignedTo !== req.user.id
    ) {
      return res.status(403).json({ 
        message: 'Not authorized to view this emergency' 
      });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({ message: 'Server error while fetching emergency' });
  }
};

// @desc    Update emergency status
// @route   PUT /api/emergency/:id/status
// @access  Private
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    const emergency = await Emergency.findByPk(id);
    
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    // Check if user has permission to update this emergency
    if (
      req.user.role === 'user' && 
      emergency.userId !== req.user.id
    ) {
      return res.status(403).json({ 
        message: 'Not authorized to update this emergency' 
      });
    }

    // Only allow certain status transitions based on user role
    if (req.user.role === 'user' && status !== 'cancelled') {
      return res.status(403).json({ 
        message: 'You can only cancel your own emergencies' 
      });
    }

    // Update status
    emergency.status = status;
    
    // If marking as resolved, set resolvedAt timestamp
    if (status === 'resolved') {
      emergency.resolvedAt = new Date();
    }
    
    await emergency.save();
    
    // Broadcast update to all connected clients
    io.emit('emergency-updated', emergency);
    
    res.json(emergency);
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({ message: 'Server error while updating emergency status' });
  }
};

// @desc    Assign emergency to a responder
// @route   PUT /api/emergency/:id/assign
// @access  Private (Admin/Responder)
const assignEmergency = async (req, res) => {
  try {
    const { responderId } = req.body;
    const { id } = req.params;
    
    // Check if user has permission to assign emergencies
    if (req.user.role !== 'admin' && req.user.role !== 'responder') {
      return res.status(403).json({ 
        message: 'Not authorized to assign emergencies' 
      });
    }
    
    const emergency = await Emergency.findByPk(id);
    
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }
    
    // Check if responder exists and has the correct role
    const responder = await User.findOne({
      where: { 
        id: responderId,
        role: 'responder' 
      }
    });
    
    if (!responder) {
      return res.status(404).json({ 
        message: 'Responder not found or invalid role' 
      });
    }
    
    // Update emergency
    emergency.assignedTo = responderId;
    emergency.status = 'in-progress';
    await emergency.save();
    
    // Notify the assigned responder
    io.to(`user_${responderId}`).emit('assigned-emergency', emergency);
    
    // Broadcast update to all connected clients
    io.emit('emergency-updated', emergency);
    
    res.json(emergency);
  } catch (error) {
    console.error('Assign emergency error:', error);
    res.status(500).json({ message: 'Server error while assigning emergency' });
  }
};

module.exports = {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignEmergency
};
