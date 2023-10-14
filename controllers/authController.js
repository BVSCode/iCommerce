const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const verifySid = process.env.TWILIO_VERIFY_SID;

const client = require('twilio')(accountSid, authToken);
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const generateOTP = require('../utils/generateOTP');
const { promisify } = require('util');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    res.cookie('jwt', token, {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const { phone } = req.body;

    // 1) Check if mobile Number Exists
    const mobileExist = await User.findOne({ phone });

    // 2) if exist send generic message
    if (mobileExist) {
        return next(new AppError('You are Already Registered', 400));
    }

    // 3) if everything ok Create a user instance
    await User.create(req.body);

    // 4) Send the message
    res.status(200).json({
        status: 'success',
        message: 'Registered Successfully, Approve Pending!'
    });
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.login = catchAsync(async (req, res, next) => {
    const { phone } = req.body;

    // 1) Check if Mobile Number exists
    if (!phone) {
        return next(new AppError('Please Provide Mobile Number!', 500));
    }

    // 2) Check if user exists and Mobile Number is correct
    const user = await User.findOne({ phone });

    if (!user) {
        return next(new AppError('Please Provide a valid Mobile Number!', 500));
    }

    // 3) if everything ok, send OTP to the client
    // Generate OTP
    const otp = generateOTP(4);

    // 4) Save otp to into Database
    user.phoneOtp = otp;
    await user.save({ validateBeforeSave: false });

    // Send the OTP via SMS
    await client.messages.create({
        body: `Here is the OTP : ${otp} to login to your iCommerce account.
        It is valid for 2 minutes only. Please enter the OTP to proceed futher. Happy Shopping!`,
        from: '+16183563653',
        // to: '+916353213422'
        to: `+91${user.phone}`
    });

    // 5) Send the message
    res.status(200).json({
        status: 'success',
        message: 'The OTP has been sent!',
        data: {
            user: user.id
        }
    });
});

exports.verifyPhoneOtp = catchAsync(async (req, res, next) => {
    const { otp, userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        return next(
            new AppError(
                'You are not Registered yet. Please Registered Your self first!',
                400
            )
        );
    }

    if (!user.correctOTP(otp, user.phoneOtp)) {
        return next(new AppError('Incorrect OTP', 400));
    }

    user.phoneOtp = undefined;
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting the Token and check, if it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please login First to get access.',
                401
            )
        );
    }

    // 2) Verification The Token
    // const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(
            new AppError(
                `The user belonging to this token does no longer exist!`,
                401
            )
        );
    }

    // 4) GRANT ACCESS TO THE PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;

    next();
});

// Restrict The DELETE ROUTE, only allow admin,
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have a permission to perform these kind of action!',
                    403
                )
            );
        }
        next();
    };
};
