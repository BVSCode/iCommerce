const express = require('express');

const productRouter = require('./routes/productRoute');

const app = express();

app.use(express.json());

// Availble-Routes || End-Points
app.use('/api/v1/products', productRouter);

module.exports = app;