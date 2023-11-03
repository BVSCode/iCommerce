const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Reservation = require('../models/reservationModel');

// 1- Finds User Cart--
exports.getUserCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({
        userId: req.user.id,
        isActive: { $ne: false }
    });

    if (!cart) {
        return next(new AppError('Cart Not Found For This User!', 404));
    }

    if (cart.items.length < 1) {
        return res.status(200).json({
            status: 'success',
            message: 'Your Cart is Empty now!'
        });
    }

    const data = await Cart.aggregate([
        {
            $match: { user: cart.user, isActive: { $ne: false } }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'items.productId',
                foreignField: '_id',
                as: 'products_detail'
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data
    });
});

// 2- Add Product to Cart, Increase the quantity of Product, and Create new Cart--
exports.addItemToCart = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { productId, quantity, cupSize, instruction } = req.body;

    // STEP 1: FIND THE USER'S CART
    let cart = await Cart.findOne({
        userId: req.user.id,
        isActive: { $ne: false }
    });

    const product = await Product.findById(productId);

    if (!product) {
        return next(new AppError(`Product not found for ID: ${productId}!`, 404));
    }

    const price = product.price;
    let Subtotal = product.price;
    let total = product.price;
    const name = product.name;
    const description = product.summary;

    const session = await mongoose.startSession();
    session.startTransaction();

    // STEP 2 IF CART EXISTS
    if (cart) {
        // if cart does not exists else code create a new cart for user
        let itemIndex = cart.items.findIndex(p => p.productId == productId);

        // If The Product Found in The Cart Update The Quantity
        if (itemIndex > -1) {
            let productItem = cart.items[itemIndex];
            productItem.quantity = quantity;

            try {
                if (product.stock < productItem.quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return next(new AppError(`Insufficient product quantity for ID: ${productId}`, 400));
                }

                let reservation = await Reservation.findOne({
                    productId,
                    userId,
                    status: 'pending'
                });

                if (!reservation) {
                    await session.abortTransaction();
                    session.endSession();
                    return next(new AppError(`Reservation not found for Product: ${productId}!`, 404));
                }

                const quantityLeft = reservation.quantity - quantity;
                reservation.quantity = quantity;

                // Increase The Stock
                product.stock += quantityLeft;

                await product.save({ session });
                await reservation.save({ session });
                // await product.save();
                // await reservation.save();

                // Update The Cart
                productItem.Subtotal = product.price * productItem.quantity;
                cart.items[itemIndex] = productItem; // save the updated products in to cart products
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        } else {
            try {
                //STEP 3 Product does not Exists in Cart, Add new item
                if (product.stock < quantity) {
                    await session.abortTransaction();
                    session.endSession();
                    return next(new AppError(`Insufficient product quantity for ID: ${productId}`, 400));
                }

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
                // await product.save();
                // await reservation.save();

                // Schedule Reservation Expiration---
                console.log(`The Product is Reserved for ${process.env.RESERVATION_EXPIRY_TIME / 60000} Minutes only!`);
                reservation.timeout = setTimeout(async () => {
                    const expiredReservation = await Reservation.findById(
                        reservation._id
                    );
                    if (expiredReservation && expiredReservation.status === 'pending') {
                        expiredReservation.status = 'expired';
                        expiredReservation.timeout = undefined;
                        await expiredReservation.save();
                        console.log(product.stock);
                        product.stock += expiredReservation.quantity;
                        console.log(product.stock);
                        await product.save();
                        console.log('Reservation Expired Successfully!');
                    }
                }, process.env.RESERVATION_EXPIRY_TIME);

                await reservation.save({ session });
                // await reservation.save();

                Subtotal = product.price * quantity;
                cart.items.push({
                    productId,
                    quantity,
                    price,
                    Subtotal,
                    name,
                    description,
                    cupSize,
                    instruction
                });
            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                throw error;
            }
        }

        cart.total = cart.items
            .map(productItem => productItem.Subtotal)
            .reduce((acc, curr) => acc + curr);

        cart = await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        // cart = await cart.save();
        return res.status(200).json({
            status: 'success',
            data: cart
        });
    } else {
        try {
            //STEP 4 if No cart for User, Create new Cart and add The Item to cart
            if (product.stock < quantity) {
                await session.abortTransaction();
                session.endSession();
                return next(new AppError(`Insufficient product quantity for ID: ${productId}`, 400));
            }

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

            // await product.save();
            // await reservation.save();
            await product.save({ session });
            await reservation.save({ session });

            // Schedule Reservation Expiration---
            console.log(`The Product is Reserved for ${process.env.RESERVATION_EXPIRY_TIME / 60000} Minutes only!`);
            reservation.timeout = setTimeout(async () => {
                const expiredReservation = await Reservation.findById(
                    reservation._id
                );
                console.log(expiredReservation);
                if (expiredReservation && expiredReservation.status === 'pending') {
                    expiredReservation.status = 'expired';
                    expiredReservation.timeout = undefined;
                    await expiredReservation.save();
                    product.stock += expiredReservation.quantity;
                    await product.save();
                    console.log('Reservation Expired Successfully!');
                }
            }, process.env.RESERVATION_EXPIRY_TIME);

            await reservation.save({ session });
            // await reservation.save();

            Subtotal = product.price * quantity;
            total = product.price * quantity;
            const newCart = await Cart.create({
                userId,
                total,
                items: [
                    {
                        productId,
                        quantity,
                        price,
                        Subtotal,
                        name,
                        description,
                        cupSize,
                        instruction
                    }
                ]
            });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                status: 'success',
                data: newCart
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
});

// 4- Remove a Product From the Cart--
exports.removeItem = catchAsync(async (req, res, next) => {
    const { productId } = req.body;

    let cart = await Cart.findOne({
        userId: req.user.id,
        isActive: { $ne: false }
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!cart) {
            await session.abortTransaction();
            session.endSession();
            return next(new AppError('Cart Not Found For This User!', 404));
        }

        let itemIndex = cart.items.findIndex(p => p.productId == productId);

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);

            const product = await Product.findById(productId);
            let existingReservation = await Reservation.findOne({
                productId,
                userId: req.user.id,
                status: 'pending'
            });

            if (!existingReservation) {
                await session.abortTransaction();
                session.endSession();
                return next(new AppError(`Reservation not found for Product: ${productId}!`, 404));
            }

            product.stock += existingReservation.quantity;
            existingReservation.status = 'released';
            clearTimeout(existingReservation.timeout);
            existingReservation.timeout = undefined;

            // await product.save({ session });
            // await existingReservation.save({ session });
            // await product.save();
            // await existingReservation.save();

            if (cart.items.length < 1) {
                cart.total = 0;
                // cart.items = [];
                // cart = await cart.save({ validateBeforeSave: false }, { session });

                // await session.commitTransaction();
                // session.endSession();

                // return res.status(200).json({
                //     status: 'success',
                //     message: 'Your Cart is Empty now!'
                // });
            } else {
                cart.total = cart.items
                    .map(productItem => productItem.Subtotal)
                    .reduce((acc, curr) => acc + curr);
            }

            await product.save({ session });
            await existingReservation.save({ session });
            cart = await cart.save({ session }, { validateBeforeSave: false });

            // clearTimeout(existingReservation.timeout);
            // existingReservation.timeout = undefined;
            // console.log("Reservation released Successfully!");
            // await existingReservation.save({ session });
            // x
            await session.commitTransaction();
            session.endSession();

            if (cart.items.length < 1) {
                return res.status(200).json({
                    status: 'success',
                    message: 'Your Cart is Empty now!'
                });
            }

            return res.status(200).json({
                status: 'success',
                data: cart
            });
        }
        else {
            await session.abortTransaction();
            session.endSession();
            return next(new AppError('Item does not exist in The Cart', 404));
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// Remove all items from the Cart it self--
exports.emptyCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({
        userId: req.user.id,
        isActive: { $ne: false }
    });

    if (!cart) {
        return next(new AppError('Cart Not Found For This User!', 404));
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Your Cart is Empty now!'
    });
});
