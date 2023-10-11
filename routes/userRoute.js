const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// FREE FOR EVERYONE ON THE APPLICATION-
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verifyOTP', authController.verifyPhoneOtp);
router.get('/logout', authController.logout);

// AUTH-MIDDLEWARE, PROJECT EVERY ROUTES FROM HERE-
router.use(authController.protect);

// AUTHENTICATE USER, NEEDS TO BE LOGIN FOR USE THESE ROUTES
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// AUTHENTICATE WITH ADMIN, AFTER THIS MIDDLEWARE, EVERY ROUTE IS PROTECTED
router.use(authController.restrictTo('admin'));

// THE ADMIN ROUTES-
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
