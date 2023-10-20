const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect the route with User-Authentication
router.use(authController.protect);

router.get('/checkout-session', orderController.getCheckoutSession);

router.route('/').get(orderController.getAllOrders);
// .post(orderController.createNewOrder);

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(
    authController.restrictTo('user', 'admin'),
    orderController.updateOrder
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    orderController.deleteOrder
  );

module.exports = router;
