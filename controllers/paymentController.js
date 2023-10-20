const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');

// if the payment was successful
exports.makePayment = async (session, orderId) => {
  try {
    // const phone = session.customer_details.phone.slice(3);
    // const userId = (await User.findOne({ phone: phone })).id;

    const userId = (await User.findById(session.client_reference_id))._id;

    const status = session.payment_status;
    const paymentId = session.id;
    const gateway = 'stripe';
    const method = `credit_${session.payment_method_types[0]}`;
    const amount = session.amount_total / 100;

    await Payment.create({
      userId,
      orderId,
      amount,
      status,
      method,
      gateway,
      paymentId
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find(req.query);

  if (!payments) {
    return next(new AppError('No Payment found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payments
    }
  });
});

exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError('No Payment found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payment
    }
  });
});

exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);

  if (!payment) {
    return next(new AppError('No Payment found!', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Your Payment has been successfully Deleted!'
  });
});
