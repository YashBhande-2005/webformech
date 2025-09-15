const ServiceRequest = require('../models/ServiceRequest');
const Mechanic = require('../models/Mechanic');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all service requests
// @route   GET /api/v1/service-requests
// @route   GET /api/v1/mechanics/:mechanicId/service-requests
// @access  Private
exports.getServiceRequests = asyncHandler(async (req, res, next) => {
  if (req.params.mechanicId) {
    const mechanic = await Mechanic.findById(req.params.mechanicId);
    
    if (!mechanic) {
      return next(
        new ErrorResponse(`No mechanic with the id of ${req.params.mechanicId}`, 404)
      );
    }
    
    const serviceRequests = await ServiceRequest.find({ mechanic: req.params.mechanicId });
    
    return res.status(200).json({
      success: true,
      count: serviceRequests.length,
      data: serviceRequests
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single service request
// @route   GET /api/v1/service-requests/:id
// @access  Private
exports.getServiceRequest = asyncHandler(async (req, res, next) => {
  const serviceRequest = await ServiceRequest.findById(req.params.id)
    .populate({
      path: 'customer',
      select: 'name email'
    })
    .populate({
      path: 'mechanic',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

  if (!serviceRequest) {
    return next(
      new ErrorResponse(`No service request with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is service request owner or the assigned mechanic
  if (
    serviceRequest.customer._id.toString() !== req.user.id &&
    (serviceRequest.mechanic && serviceRequest.mechanic.user._id.toString() !== req.user.id) &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this service request`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: serviceRequest
  });
});

// @desc    Create service request
// @route   POST /api/v1/service-requests
// @access  Private
exports.createServiceRequest = asyncHandler(async (req, res, next) => {
  // Add customer to req.body
  req.body.customer = req.user.id;

  const serviceRequest = await ServiceRequest.create(req.body);

  // If a mechanic is specified, send notification email
  if (req.body.mechanic) {
    const mechanic = await Mechanic.findById(req.body.mechanic).populate({
      path: 'user',
      select: 'email name'
    });

    if (mechanic) {
      // Send email to mechanic
      const message = `You have a new service request from ${req.user.name} for ${req.body.serviceType}. Please check your dashboard for details.`;
      
      await sendEmail({
        email: mechanic.user.email,
        subject: 'New Service Request - Urban Mechanic Partners',
        message
      });
    }
  }

  res.status(201).json({
    success: true,
    data: serviceRequest
  });
});

// @desc    Update service request
// @route   PUT /api/v1/service-requests/:id
// @access  Private
exports.updateServiceRequest = asyncHandler(async (req, res, next) => {
  let serviceRequest = await ServiceRequest.findById(req.params.id);

  if (!serviceRequest) {
    return next(
      new ErrorResponse(`No service request with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is service request owner or the assigned mechanic
  if (
    serviceRequest.customer.toString() !== req.user.id &&
    (serviceRequest.mechanic && serviceRequest.mechanic.toString() !== req.user.id) &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this service request`,
        401
      )
    );
  }

  // Check if status is being updated to 'completed'
  if (req.body.status === 'completed' && serviceRequest.status !== 'completed') {
    req.body.completedAt = Date.now();
  }

  serviceRequest = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // If status is updated, send notification to the customer
  if (req.body.status && req.body.status !== serviceRequest.status) {
    const customer = await User.findById(serviceRequest.customer);
    
    if (customer) {
      const message = `Your service request for ${serviceRequest.serviceType} has been updated to ${req.body.status}.`;
      
      await sendEmail({
        email: customer.email,
        subject: 'Service Request Update - Urban Mechanic Partners',
        message
      });
    }
  }

  res.status(200).json({
    success: true,
    data: serviceRequest
  });
});

// @desc    Delete service request
// @route   DELETE /api/v1/service-requests/:id
// @access  Private
exports.deleteServiceRequest = asyncHandler(async (req, res, next) => {
  const serviceRequest = await ServiceRequest.findById(req.params.id);

  if (!serviceRequest) {
    return next(
      new ErrorResponse(`No service request with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is service request owner or admin
  if (
    serviceRequest.customer.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this service request`,
        401
      )
    );
  }

  await serviceRequest.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Accept service request (for mechanics)
// @route   PUT /api/v1/service-requests/:id/accept
// @access  Private (mechanic only)
exports.acceptServiceRequest = asyncHandler(async (req, res, next) => {
  let serviceRequest = await ServiceRequest.findById(req.params.id);

  if (!serviceRequest) {
    return next(
      new ErrorResponse(`No service request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if user is a mechanic
  if (req.user.role !== 'mechanic') {
    return next(
      new ErrorResponse('Only mechanics can accept service requests', 403)
    );
  }

  // Get mechanic profile
  const mechanic = await Mechanic.findOne({ user: req.user.id });

  if (!mechanic) {
    return next(new ErrorResponse('Mechanic profile not found', 404));
  }

  // Update service request with mechanic and status
  serviceRequest = await ServiceRequest.findByIdAndUpdate(
    req.params.id,
    {
      mechanic: mechanic._id,
      status: 'accepted',
      estimatedCost: req.body.estimatedCost || 0
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Notify customer
  const customer = await User.findById(serviceRequest.customer);
  
  if (customer) {
    const message = `Your service request for ${serviceRequest.serviceType} has been accepted by ${req.user.name}. Estimated cost: $${serviceRequest.estimatedCost}.`;
    
    await sendEmail({
      email: customer.email,
      subject: 'Service Request Accepted - Urban Mechanic Partners',
      message
    });
  }

  res.status(200).json({
    success: true,
    data: serviceRequest
  });
});

// @desc    Create service request and notify nearby mechanics
// @route   POST /api/v1/service-requests/request-help
// @access  Public (for customers without account)
exports.requestHelp = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, serviceType, description, vehicleInfo, customerInfo } = req.body;

  if (!latitude || !longitude || !serviceType || !description) {
    return next(
      new ErrorResponse('Please provide location, service type, and description', 400)
    );
  }

  // Create service request data
  const serviceRequestData = {
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    serviceType,
    description,
    vehicleInfo: vehicleInfo || {},
    status: 'pending'
  };

  // If customer info is provided, try to find or create user
  if (customerInfo && customerInfo.email) {
    let customer = await User.findOne({ email: customerInfo.email });
    
    if (!customer) {
      // Create a temporary customer account
      customer = await User.create({
        name: customerInfo.name || 'Customer',
        email: customerInfo.email,
        phone: customerInfo.phone || '',
        role: 'customer',
        password: 'temp123' // Temporary password
      });
    }
    
    serviceRequestData.customer = customer._id;
  }

  // Create the service request
  const serviceRequest = await ServiceRequest.create(serviceRequestData);

  // Find nearby mechanics and notify them
  const radiusInRadians = 10 / 6371; // 10km radius
  const nearbyMechanics = await Mechanic.find({
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInRadians]
      }
    },
    isAvailable: true,
    servicesOffered: { $in: [serviceType] }
  }).populate({
    path: 'user',
    select: 'email name phone'
  });

  // Send notifications to nearby mechanics
  const notificationPromises = nearbyMechanics.map(async (mechanic) => {
    try {
      const message = `New service request near you!\n\nService: ${serviceType}\nDescription: ${description}\nLocation: ${latitude}, ${longitude}\n\nPlease check your dashboard to accept this request.`;
      
      await sendEmail({
        email: mechanic.user.email,
        subject: 'New Service Request Near You - Urban Mechanic Partners',
        message
      });
    } catch (error) {
      console.error(`Failed to send notification to mechanic ${mechanic._id}:`, error);
    }
  });

  // Wait for all notifications to be sent
  await Promise.all(notificationPromises);

  res.status(201).json({
    success: true,
    data: serviceRequest,
    message: `Service request created and ${nearbyMechanics.length} nearby mechanics have been notified`,
    nearbyMechanics: nearbyMechanics.length
  });
});