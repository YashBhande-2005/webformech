const express = require('express');
const {
  getServiceRequests,
  getServiceRequest,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest,
  acceptServiceRequest,
  requestHelp
} = require('../controllers/serviceRequests');

const ServiceRequest = require('../models/ServiceRequest');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(
    protect,
    advancedResults(ServiceRequest, [
      { path: 'customer', select: 'name email' },
      { 
        path: 'mechanic', 
        populate: { path: 'user', select: 'name email' } 
      }
    ]),
    getServiceRequests
  )
  .post(protect, authorize('customer', 'admin'), createServiceRequest);

router
  .route('/request-help')
  .post(requestHelp);

router
  .route('/:id')
  .get(protect, getServiceRequest)
  .put(protect, updateServiceRequest)
  .delete(protect, authorize('customer', 'admin'), deleteServiceRequest);

router
  .route('/:id/accept')
  .put(protect, authorize('mechanic'), acceptServiceRequest);

module.exports = router;