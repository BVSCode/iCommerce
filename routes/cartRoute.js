const express = require('express');

const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect); // protect the route

router.route('/empty-mycart').get(cartController.emptyCart);

router
  .route('/')
  .get(cartController.getUserCart)
  .post(cartController.addItemToCart)
  .delete(cartController.removeItem);

module.exports = router;
