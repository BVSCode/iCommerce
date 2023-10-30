const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Reservation = require('../models/reservationModel');
const Product = require('../models/productModel');

// const RESERVATION_EXPIRY_TIME = 60000; // 10 minutes
// const RESERVATION_EXPIRY_TIME = 300000; // 5 minutes
const RESERVATION_EXPIRY_TIME = 60000; // 1 minutes
// const RESERVATION_EXPIRY_TIME = 180000; // 3 minutes

exports.reserveTheItem = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const productId = req.params.productId;
  const quantity = req.body.quantity;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError(`Product not found for ID: ${productId}!`, 404));
  }

  if (product.stock < quantity) {
    return next(new AppError(`Insufficient product quantity for ID: ${productId}`, 400));
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    const existingReservation = await Reservation.findOne({
      productId,
      userId,
      status: 'pending'
    });

    if (existingReservation) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError(`Product already reserved for ID: ${productId}`, 400));
    }

    const reservation = new Reservation({
      productId,
      userId,
      quantity
    });

    // Reduce the Stock
    product.stock -= quantity;

    await product.save({ session });
    await reservation.save({ session });

    // Schedule Reservation Expiration---
    console.log(`The Product is Reserved for ${RESERVATION_EXPIRY_TIME} Minutes only!`);
    reservation.timeout = setTimeout(async () => {
      // const expiredReservation = await Reservation.findById(
      //   reservation._id
      // );
      const expiredReservation = reservation;
      if (expiredReservation && expiredReservation.status === 'pending') {
        expiredReservation.status = 'expired';
        expiredReservation.timeout = undefined;
        await expiredReservation.save();
        product.stock += expiredReservation.quantity;
        await product.save();
        console.log('Reservation Expired Successfully!');
      }
    }, RESERVATION_EXPIRY_TIME);
    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  next(); // calling add to cart
});

exports.releaseTheItem = async (req, res, next) => {
  const { reservationId } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId).populate(
      'productId'
    );

    if (!reservation) {
      return next(new AppError('Reservation not found', 404));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (reservation.status !== 'pending') {
        // if both operand equals return false, if not return true
        await session.abortTransaction();
        session.endSession();
        return next(
          new AppError('The Reservation is not at Pending State', 400)
        );
      }

      reservation.status = 'released';
      await reservation.save({ session });

      const product = reservation.productId; // it's actual find the product by it's Id and below will update
      // console.log(product);
      product.stock += reservation.quantity;
      await product.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({ message: 'Reservation released successfully' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.confirmTheItem = async userId => {
  // const { userId } = req.body;
  // const userId = req.user.id;
  console.log(userId);

  // try {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get all pending reservations for the user
    const reservations = await Reservation.find({ userId, status: 'pending' });

    // console.log(reservations);
    // reservations.forEach(element => {
    //     console.log(element.createdAt.getTime())
    //     const isExpired = Date.now() - element.createdAt.getTime() > RESERVATION_EXPIRY_TIME;
    //     console.log(isExpired);
    //     // clearTimeout(element.timeout);
    //     element.timeout = undefined;
    //     element.status = "confirmed";
    //     element.save();
    // });

    if (reservations.length <= 0) {
      return next(
        new AppError('No Pending Reservation found for this user!', 400)
      );
    }

    // Check if any of the reserved products are no longer available
    const unavailableProducts = [];
    for (const reservation of reservations) {
      const product = await Product.findById(reservation.productId);
      // if (!product || product.stock < reservation.quantity) {
      if (!product) {
        unavailableProducts.push(reservation.productId);
      }
    }

    if (unavailableProducts.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: 'Some reserved products are no longer available',
        unavailableProducts
      });
    }

    // Confirm the reservations
    for (const reservation of reservations) {
      reservation.status = 'confirmed';
      clearTimeout(reservation.timeout);
      reservation.timeout = undefined;
      await reservation.save({ session });
    }

    res.json({
      message: 'Reservations confirmed and order placed successfully'
    });

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    // throw error;
    console.log(error);
  }
  // } catch (error) {
  //     console.log(error);
  //     res.status(500).json({ error: 'Internal server error' });
  // }
};
