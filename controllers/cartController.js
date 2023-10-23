const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

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
    // const productId = req.params.productId;
    const { productId, quantity, cupSize, instruction } = req.body;
    // const { quantity, cupSize, instruction } = req.body;

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

    // STEP 2 IF CART EXISTS
    if (cart) {
        // if cart does not exists else code create a new cart for user
        let itemIndex = cart.items.findIndex(p => p.productId == productId);

        // if the Product found in the cart update the quantity
        if (itemIndex > -1) {
            let productItem = cart.items[itemIndex];
            productItem.quantity = quantity;

            if (product.stock < productItem.quantity) {
                return res.status(400).json({
                    error: `Insufficient product quantity for ID: ${productItem.productId}`
                });
            }

            productItem.Subtotal = product.price * productItem.quantity;
            cart.items[itemIndex] = productItem; // save the updated products in to cart products
        } else {
            //STEP 3 Product does not Exists in Cart, Add new item
            if (product.stock < quantity) {
                return res.status(400).json({
                    error: `Insufficient product quantity for ID: ${product._id}`
                });
            }

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
        }

        cart.total = cart.items
            .map(productItem => productItem.Subtotal)
            .reduce((acc, curr) => acc + curr);

        cart = await cart.save();
        return res.status(200).json({
            status: 'success',
            data: cart
        });
    } else {
        //STEP 4 if No cart for User, Create new Cart
        if (product.stock < quantity) {
            return res.status(400).json({
                error: `Insufficient product quantity for ID: ${product._id}`
            });
        }

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

        return res.status(201).json({
            status: 'success',
            data: newCart
        });
    }
});

// 4- Remove a Product From the Cart--
exports.removeItem = catchAsync(async (req, res, next) => {
    const { productId } = req.body;

    let cart = await Cart.findOne({
        userId: req.user.id,
        isActive: { $ne: false }
    });

    if (!cart) {
        return next(new AppError('Cart Not Found For This User!', 404));
    }

    let itemIndex = cart.items.findIndex(p => p.productId == productId);

    if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);

        if (cart.items.length < 1) {
            cart.total = 0;
            cart.items = [];
            cart = await cart.save({ validateBeforeSave: false });

            return res.status(200).json({
                status: 'success',
                message: 'Your Cart is Empty now!'
            });
        } else {
            cart.total = cart.items
                .map(productItem => productItem.Subtotal)
                .reduce((acc, curr) => acc + curr);
            cart = await cart.save({ validateBeforeSave: false });
        }

        return res.status(200).json({
            status: 'success',
            data: cart
        });
    } else {
        return next(new AppError('Item does not exist in The Cart', 404));
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
