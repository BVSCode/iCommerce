const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

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

// Handling undefined routes
app.all('*', (req, res, next) => {
    // Creating an Error here and passing to Global Error handler
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error and Exception Handling
app.use(globalErrorHandler);

module.exports = app;
