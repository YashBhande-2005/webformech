const Mechanic = require('../models/Mechanic');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all mechanics
// @route   GET /api/v1/mechanics
// @access  Public
exports.getMechanics = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single mechanic
// @route   GET /api/v1/mechanics/:id
// @access  Public
exports.getMechanic = asyncHandler(async (req, res, next) => {
  const mechanic = await Mechanic.findById(req.params.id).populate({
    path: 'user',
    select: 'name email'
  });

  if (!mechanic) {
    return next(
      new ErrorResponse(`Mechanic not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: mechanic
  });
});

// @desc    Create new mechanic profile
// @route   POST /api/v1/mechanics
// @access  Private
exports.createMechanic = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if mechanic profile already exists for this user
  const existingMechanic = await Mechanic.findOne({ user: req.user.id });

  if (existingMechanic) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} already has a mechanic profile`,
        400
      )
    );
  }

  // Update user role to mechanic
  await User.findByIdAndUpdate(req.user.id, { role: 'mechanic' });

  const mechanic = await Mechanic.create(req.body);

  res.status(201).json({
    success: true,
    data: mechanic
  });
});

// @desc    Update mechanic profile
// @route   PUT /api/v1/mechanics/:id
// @access  Private
exports.updateMechanic = asyncHandler(async (req, res, next) => {
  let mechanic = await Mechanic.findById(req.params.id);

  if (!mechanic) {
    return next(
      new ErrorResponse(`Mechanic not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is mechanic owner
  if (mechanic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this mechanic profile`,
        401
      )
    );
  }

  mechanic = await Mechanic.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: mechanic
  });
});

// @desc    Delete mechanic profile
// @route   DELETE /api/v1/mechanics/:id
// @access  Private
exports.deleteMechanic = asyncHandler(async (req, res, next) => {
  const mechanic = await Mechanic.findById(req.params.id);

  if (!mechanic) {
    return next(
      new ErrorResponse(`Mechanic not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is mechanic owner
  if (mechanic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this mechanic profile`,
        401
      )
    );
  }

  // Update user role back to customer
  await User.findByIdAndUpdate(mechanic.user, { role: 'customer' });

  await mechanic.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get mechanics within a radius
// @route   GET /api/v1/mechanics/radius/:zipcode/:distance
// @access  Public
exports.getMechanicsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide distance by radius of Earth
  // Earth Radius = 3,963 miles / 6,378 km
  const radius = distance / 3963;

  const mechanics = await Mechanic.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    success: true,
    count: mechanics.length,
    data: mechanics
  });
});

// @desc    Update mechanic availability
// @route   PUT /api/v1/mechanics/:id/availability
// @access  Private
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  let mechanic = await Mechanic.findById(req.params.id);

  if (!mechanic) {
    return next(
      new ErrorResponse(`Mechanic not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is mechanic owner
  if (mechanic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this mechanic's availability`,
        401
      )
    );
  }

  // Update only the availability field
  mechanic = await Mechanic.findByIdAndUpdate(
    req.params.id,
    { availability: req.body.availability, isAvailable: req.body.isAvailable },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: mechanic
  });
});

// @desc    Find nearby mechanics by coordinates
// @route   POST /api/v1/mechanics/nearby
// @access  Public
exports.findNearbyMechanics = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, radius = 10, serviceType } = req.body;

  if (!latitude || !longitude) {
    return next(
      new ErrorResponse('Please provide latitude and longitude', 400)
    );
  }

  // Convert radius from km to radians (Earth's radius is approximately 6371 km)
  const radiusInRadians = radius / 6371;

  // Build query
  let query = {
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInRadians]
      }
    },
    isAvailable: true
  };

  // Add service type filter if provided
  if (serviceType) {
    query.services = { $in: [serviceType] };
  }

  const mechanics = await Mechanic.find(query)
    .populate({
      path: 'user',
      select: 'name email phone'
    })
    .sort({ rating: -1, reviewCount: -1 });

  res.status(200).json({
    success: true,
    count: mechanics.length,
    data: mechanics
  });
});

// @desc    Get mechanic notifications (for mechanic dashboard)
// @route   GET /api/v1/mechanics/:id/notifications
// @access  Private
exports.getMechanicNotifications = asyncHandler(async (req, res, next) => {
  const mechanic = await Mechanic.findById(req.params.id);

  if (!mechanic) {
    return next(
      new ErrorResponse(`Mechanic not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is mechanic owner
  if (mechanic.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view these notifications`,
        401
      )
    );
  }

  // Get recent service requests near this mechanic
  const ServiceRequest = require('../models/ServiceRequest');
  const radiusInRadians = 10 / 6371; // 10km radius

  const nearbyRequests = await ServiceRequest.find({
    location: {
      $geoWithin: {
        $centerSphere: [mechanic.location.coordinates, radiusInRadians]
      }
    },
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  })
    .populate({
      path: 'customer',
      select: 'name email phone'
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: nearbyRequests.length,
    data: nearbyRequests
  });
});