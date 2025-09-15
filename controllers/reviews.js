const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const ServiceRequest = require('../models/ServiceRequest');

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/mechanics/:mechanicId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.mechanicId) {
    const reviews = await ServiceRequest.find({
      acceptedBy: req.params.mechanicId,
      status: 'completed',
      rating: { $exists: true }
    }).populate({
      path: 'customer',
      select: 'name'
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await ServiceRequest.findById(req.params.id).populate({
    path: 'acceptedBy',
    select: 'businessName'
  });

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/v1/mechanics/:mechanicId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.acceptedBy = req.params.mechanicId;
  req.body.customer = req.user.id;

  const serviceRequest = await ServiceRequest.findById(req.body.serviceRequestId);

  if (!serviceRequest) {
    return next(
      new ErrorResponse(
        `No service request with the id of ${req.body.serviceRequestId}`,
        404
      )
    );
  }

  // Make sure user is service request customer
  if (serviceRequest.customer.email !== req.user.email) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a review to this service request`,
        401
      )
    );
  }

  // Check if already reviewed
  if (serviceRequest.rating) {
    return next(
      new ErrorResponse(
        `Service request ${req.body.serviceRequestId} already reviewed`,
        400
      )
    );
  }

  const review = await ServiceRequest.findByIdAndUpdate(
    req.body.serviceRequestId,
    {
      rating: req.body.rating,
      review: req.body.review
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await ServiceRequest.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.customer.email !== req.user.email && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this review`,
        401
      )
    );
  }

  review = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await ServiceRequest.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.customer.email !== req.user.email && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this review`,
        401
      )
    );
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});






