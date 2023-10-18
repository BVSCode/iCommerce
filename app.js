const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const compression = require('compression');

// ERROR HANDLING FILES-
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// ROUTERS FILES-
const productRouter = require('./routes/productRoute');
const userRouter = require('./routes/userRoute');
const reviewRouter = require('./routes/reviewRoute');
const cartRouter = require('./routes/cartRoute');

const app = express();

// Enable Proxy for app
app.enable('trust proxy');

// Enable Cors
app.use(cors());
// Access-Control-Allow-Origin *
// api.iCommerce.com, front-end iCommerce.com
// app.use(cors({
//   origin: 'https://www.iCommerce.com'
// }))

// Enable Cors pre-flight for All Request-
app.options('*', cors());
// app.options('/api/v1/products/:id', cors());

// Set Security HTTP headers
app.use(helmet());

// Dev - Loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Requests from same API-
const limiter = rateLimit({
  validate: { trustProxy: false },
  max: 500, // max request
  windowMs: 60 * 60 * 1000, // max request in this time frame
  message: 'Too many requests from this IP, please try again in an hour!' // generic error message
});
app.use('/api', limiter); // Set Limiter to api /api - routes

// Body Parser-
app.use(express.json({ limit: '10kb' })); // limiting 10kb data in req.body

// Parsing the req.body based on urlencoded-
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie Parser-
app.use(cookieParser());

// Data Sanitization Against NoSQL query injection-
app.use(mongoSanitize());

// Data Sanitization Against XSS - cross-side-scripting attacks
app.use(xss()); // remove all the malious html with javascript code at req.body

// Compression the app to better perfomance and optimazation-
app.use(compression());

// Availble-Routes || End-Points
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/mycart', cartRouter);

// Handling undefined routes
app.all('*', (req, res, next) => {
  // Creating an Error here and passing to Global Error handler
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error and Exception Handling
app.use(globalErrorHandler);

module.exports = app;
