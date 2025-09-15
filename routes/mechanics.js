const express = require('express');
const {
  getMechanics,
  getMechanic,
  createMechanic,
  updateMechanic,
  deleteMechanic,
  getMechanicsInRadius,
  updateAvailability,
  findNearbyMechanics,
  getMechanicNotifications
} = require('../controllers/mechanics');

const Mechanic = require('../models/Mechanic');

// Include other resource routers
const serviceRequestRouter = require('./serviceRequests');
const reviewRouter = require('./reviews');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:mechanicId/service-requests', serviceRequestRouter);
router.use('/:mechanicId/reviews', reviewRouter);

router.route('/radius/:zipcode/:distance').get(getMechanicsInRadius);
router.route('/nearby').post(findNearbyMechanics);

router
  .route('/')
  .get(advancedResults(Mechanic, 'user'), getMechanics)
  .post(protect, authorize('mechanic', 'admin'), createMechanic);

router
  .route('/:id')
  .get(getMechanic)
  .put(protect, authorize('mechanic', 'admin'), updateMechanic)
  .delete(protect, authorize('mechanic', 'admin'), deleteMechanic);

router
  .route('/:id/availability')
  .put(protect, authorize('mechanic', 'admin'), updateAvailability);

router
  .route('/:id/notifications')
  .get(protect, getMechanicNotifications);

module.exports = router;