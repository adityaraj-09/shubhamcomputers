const User = require('../models/User');

// @desc    Update user address/location
// @route   PUT /api/users/address
exports.updateAddress = async (req, res) => {
  try {
    const { label, full, lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required.' });
    }

    // Check if within service area (3km from store)
    const storeLat = parseFloat(process.env.STORE_LAT);
    const storeLng = parseFloat(process.env.STORE_LNG);
    const maxRadius = parseFloat(process.env.SERVICE_RADIUS_KM) || 3;

    const distance = getDistanceKm(lat, lng, storeLat, storeLng);

    if (distance > maxRadius) {
      return res.status(400).json({ 
        error: `Sorry, we currently serve within ${maxRadius}km of our store in Jhajjar. Your location is ${distance.toFixed(1)}km away.`,
        distance: distance.toFixed(1),
        maxRadius
      });
    }

    const user = await User.findById(req.user._id);
    user.address = { label: label || 'Home', full: full || '', lat, lng };
    await user.save();

    res.json({
      success: true,
      address: user.address,
      distance: distance.toFixed(1)
    });
  } catch (error) {
    console.error('Update Address Error:', error);
    res.status(500).json({ error: 'Failed to update address.' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const updates = {};

    if (name && name.trim().length >= 2) {
      updates.name = name.trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-otp');

    res.json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        numOrders: user.numOrders
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// @desc    Check if location is serviceable
// @route   POST /api/users/check-location
exports.checkLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordinates are required.' });
    }

    const storeLat = parseFloat(process.env.STORE_LAT);
    const storeLng = parseFloat(process.env.STORE_LNG);
    const maxRadius = parseFloat(process.env.SERVICE_RADIUS_KM) || 3;

    const distance = getDistanceKm(lat, lng, storeLat, storeLng);
    const isServiceable = distance <= maxRadius;

    res.json({
      success: true,
      isServiceable,
      distance: distance.toFixed(1),
      maxRadius,
      message: isServiceable 
        ? `Great! You're within our delivery zone (${distance.toFixed(1)}km away).`
        : `Sorry, you're ${distance.toFixed(1)}km away. We serve within ${maxRadius}km of our Jhajjar store.`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check location.' });
  }
};

// Haversine formula to calculate distance between two coordinates
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
