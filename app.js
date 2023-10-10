const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const productRouter = require('./routes/productRoute');
const userRouter = require('./routes/userRoute');

const app = express();

// DEV-MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// PROD-MIDDLEWARES
app.use(express.json());
app.use(cookieParser());


// Availble-Routes || End-Points
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);

// Handling undefined routes
app.all('*', (req, res, next) => {
    // Creating an Error here and passing to Global Error handler
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error and Exception Handling
app.use(globalErrorHandler);

module.exports = app;
