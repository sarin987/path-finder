const Service = require('../models/Service');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get nearby services within a specified radius
// exports.getNearbyServices = async (req, res) => {
//   try {
//     const { lat, lng, radius = 5, type } = req.query; // radius in kilometers
//     const latitude = parseFloat(lat);
//     const longitude = parseFloat(lng);

//     if (isNaN(latitude) || isNaN(longitude)) {
//       return res.status(400).json({ error: 'Invalid coordinates' });
//     }

//     // Find services within the radius
//     const services = await Service.find({
//       type: type || { $in: ['police', 'hospital', 'ambulance'] },
//       location: {
//         $nearSphere: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: radius * 1000, // Convert km to meters
//         },
//       },
//     }).limit(20);

//     // Add distance to each service
//     const servicesWithDistance = services.map(service => {
//       const distance = calculateDistance(
//         latitude,
//         longitude,
//         service.location.coordinates[1],
//         service.location.coordinates[0]
//       );
//       return {
//         ...service.toObject(),
//         distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
//       };
//     });

//     // Group services by type
//     const groupedServices = servicesWithDistance.reduce((acc, service) => {
//       if (!acc[service.type]) {
//         acc[service.type] = [];
//       }
//       acc[service.type].push(service);
//       return acc;
//     }, {});

//     res.json(groupedServices);
//   } catch (error) {
//     console.error('Error fetching nearby services:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// Update service location
exports.updateServiceLocation = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { latitude, longitude } = req.body;

    if (!serviceId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error updating service location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
