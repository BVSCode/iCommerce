const AppError = require('../utils/appError');

// Modified The Mongoose-error to Operational errors
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    // Programming or other unknown error: don't leak error details
    else {
        // 1) Log error first
        console.error('ERROR 🔥', err);

        // 2) send the generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        //(A) mark the mongoose error to Operatinonal
        if (err.name === 'CastError') err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

        // (B) and Then Send the Production error to the Client
        sendErrorProd(err, res);
    }
};

// -------------------------------------------
// module.exports = (err, req, res, next) => {
//     console.log(err.stack);
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';
//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message
//     });
// };