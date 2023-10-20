const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect); // protect the route

router
  .route('/')
  .get(authController.restrictTo('admin'), paymentController.getAllPayments);
// .post(authController.restrictTo('admin'), paymentController.createPayment);

router
  .route('/:id')
  .get(authController.restrictTo('admin'), paymentController.getPayment)
  // .patch(authController.restrictTo('admin'), paymentController.updatePayment)
  .delete(authController.restrictTo('admin'), paymentController.deletePayment);

module.exports = router;
