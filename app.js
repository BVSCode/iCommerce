const express = require('express');
const morgan = require('morgan');

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

module.exports = app;