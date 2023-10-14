const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Review = require('../models/reviewModel');
const Product = require('../models/productModel');

// it will set the userId and productId before creating new a review
exports.setProductUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user.id;
    
    next();
}

// 1) Route Handlers, Get All Reviews, Method GET
exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.productId) filter = { product: req.params.productId }

    // Execute the query
    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

// 2) Route Handlers, Get a Review, Method GET
exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new AppError('No Review found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

// 3) Route Handlers, Create a new Review, Method POST
exports.createReview = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.body.product);

    if (!product) {
        return next(new AppError('Product not found with that ID!', 404));
    }

    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            newReview
        }
    });
})

// 4) Route Handlers, Update a Review, Method PATCH
exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!review) {
        return next(new AppError('No Review found with that ID', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            review
        }
    });
})

// 5) Route Handlers, Delete a Review, Method DETELE
exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
        return next(new AppError('No Review found with that ID', 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});
