const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

// Admin Routes and Handler functions
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find(req.query);
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'This Route not yet difined'
    });
};

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No Document found with that ID!', 404));
    }

    res.status(200).json({
        status: "success",
        data: user
    });
});

exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!user) {
        return next(new AppError('No documents found with that ID', 404));
    }

    res.status(200).json({
        status: "Success",
        data: {
            user
        }
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new AppError('No Document found with that ID!', 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    })
});