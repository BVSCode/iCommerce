const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');

const paymentController = require('./paymentController');

const createOrder = async session => {
  try {
    const totalQty = session.line_items.data
      .map(productItem => productItem.quantity)
      .reduce((acc, curr) => acc + curr);

    const newOrder = await Order.create({
      userId: session.client_reference_id,
      totalCost: session.amount_total / 100,
      totalQty: totalQty,
      shippingAddress: {
        line1: session.shipping_details.address.line1,
        line2: session.shipping_details.address.line2,
        city: session.shipping_details.address.city,
        state: session.shipping_details.address.state,
        postalCode: session.shipping_details.address.postal_code,
        country: session.shipping_details.address.country
      },
      items: session.line_items.data.map(item => {
        return {
          // productId: item.id,
          name: item.description,
          quantity: item.quantity,
          price: item.price.unit_amount / 100,
          // description: item.description,
          Subtotal: item.amount_total / 100
        };
      })
    });

    if (newOrder.items.length > 0) {
      const Items = newOrder.items;
      for (const item of Items) {
        const product = await Product.findOne({ name: item.name });
        product.stock -= item.quantity;
        await product.save();
      }

      const cart = await Cart.findOne({
        userId: session.client_reference_id,
        isActive: { $ne: false }
      });

      cart.isActive = false;
      cart.flag = 'archived';
      await cart.save();
      // reservation.confirmTheItem(session.client_reference_id);
      paymentController.makePayment(session, newOrder._id);
    }
  } catch (error) {
    console.log(error);
  }
};

// const emailCustomerAboutFailedPayment = session => {
//   // TODO: fill me in
//   console.log('Emailing customer', session);
// };

// Create Session solution---
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Getting the cart
  const cart = await Cart.findOne({
    userId: req.user.id,
    isActive: { $ne: false }
  });

  if (!cart) {
    return next(new AppError('Cart not found for this user to checkout!', 404));
  }

  // 2) Create a Checkout Session
  const session = await stripe.checkout.sessions.create({
    // payment_method_types: ['card'],
    // billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ['IN']
    },
    success_url: `${req.protocol}://${req.get('host')}`,
    // success_url: `${req.protocol}://${req.get('host')}/my-payment/?products=${req.params.productId}&user=${req.user.id}&price=${product.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
    mode: 'payment',
    // customer: 'cus_NcwxWksTGHcjZu',
    phone_number_collection: {
      enabled: true
    },
    client_reference_id: `${cart.userId}`,
    line_items: cart.items.map(item => {
      return {
        price_data: {
          currency: 'INR',
          product_data: {
            id: item.productId,
            name: item.name,
            description: item.description,
            images: [
              `${req.protocol}://${req.get('host')}/img/products/${item.imageCover
              }`
            ]
          },
          unit_amount: item.price * 100
        },
        quantity: item.quantity
      };
    })
  });

  // 3) Create a Session as Response
  res.status(200).json({
    status: 'success',
    session
  });

  // Redirecting to the stripe payment form
  // res.redirect(session.url);
});

// Listening for Checkout Event---
exports.webhookCheckout = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log(error);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      {
        expand: ['line_items']
      }
    );

    const session = sessionWithLineItems;

    // Fulfill the purchase...
    // fulfillOrder(session);
    createOrder(session);
    // emailCustomerAboutFailedPayment(session);
  }

  // console.log(event.type);

  // ---------------------------------------------------
  // // Handle the checkout.session.completed event
  // if (event.type === 'checkout.session.completed') {
  //     const session = event.data.object;

  //     // Fulfill the purchase...
  //     fulfillOrder(session);
  // }

  // switch (event.type) {
  //     case 'checkout.session.completed': {
  //         const session = event.data.object;
  //         // Save an order in your database, marked as 'awaiting payment'
  //         createOrder(session);

  //         // Check if the order is paid (for example, from a card payment)
  //         //
  //         // A delayed notification payment will have an `unpaid` status, as
  //         // you're still waiting for funds to be transferred from the customer's
  //         // account.
  //         if (session.payment_status === 'paid') {
  //             fulfillOrder(session);
  //         }
  //         break;
  //     }

  //     case 'checkout.session.async_payment_succeeded': {
  //         const session = event.data.object;

  //         // Fulfill the purchase...
  //         fulfillOrder(session);

  //         break;
  //     }

  //     case 'checkout.session.async_payment_failed': {
  //         const session = event.data.object;

  //         // Send an email to the customer asking them to retry their order
  //         emailCustomerAboutFailedPayment(session);

  //         break;
  //     }
  // }

  res.status(200).json({ recieved: true });
};

// 1) ROUTE GET-ALL-ORDERS | GET API, END-POINTS /api/v1/orders
exports.getAllOrders = catchAsync(async (req, res, next) => {
  let filterOBJ = {};
  if (req.body.userId) filterOBJ = { userId: req.user.id }
  const allOrders = await Order.find(filterOBJ);

  if (allOrders.length <= 0) {
    return next(new AppError('No Order Found For This User!', 404));
  }

  res.status(200).json({
    status: 'success',
    results: allOrders.length,
    data: {
      allOrders
    }
  });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('The Order not found for this user', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new AppError('The Order not found for this user', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Your Order has been successfully deleted!'
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const orderToBeApdate = req.body;

  // const updatedOrder = await Order.findByIdAndUpdate(req.params.id, orderToBeApdate, { new: true }, { validateBeforeSave: true });
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    orderToBeApdate,
    { new: true }
  );

  if (!updatedOrder) {
    return next(new AppError('Order not found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedOrder
    }
  });
});
