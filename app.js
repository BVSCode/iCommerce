const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const productRouter = require('./routes/productRoute');

const app = express();

// DEV-MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// PROD-MIDDLEWARES
app.use(express.json());

// Availble-Routes || End-Points
app.use('/api/v1/products', productRouter);

app.all('*', (req, res, next) => {
    // Creating an Error and pass it to the global error handler
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fails';
    // err.statusCode = 404;
    // next(err);

    // Creating an Error here and passing to Global Error handler
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
});

module.exports = app;
