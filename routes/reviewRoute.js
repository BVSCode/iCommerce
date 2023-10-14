const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// we allow to mergeParameters, it because by default a specific route to allow only his parameters
const router = express.Router({ mergeParams: true });

router.use(authController.protect); // protect the route

// POST /products/123fdsea/reviews
// GET  /products/123fdsea/reviews
// GET  /products/123fdsea/reviews/123hfsde
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setProductUserIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewController.deleteReview
    );

module.exports = router;
