const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is must!']
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment is must!']
    },
    items: [
      {
        // productId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "Product",
        //     // required: [true, 'ProductId is must!']
        // },
        price: {
          type: Number,
          required: [true, 'Product must have a price!']
        },
        // description: {
        //     type: String,
        //     // required: [true, 'Product must have description!']
        // },
        name: {
          type: String,
          required: [true, 'Product must have name!']
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, 'Quantity can not be less then 1.']
        },
        Subtotal: {
          type: Number,
          min: 0,
          required: [true, 'Price is must!']
        }
      }
    ],
    totalCost: {
      type: Number,
      required: [true, 'total Cost is must!'],
      default: 0
    },
    totalQty: {
      type: Number,
      default: 1,
      required: [true, 'TotalQty is must!'],
      min: [1, 'Quantity can not be less then 1.']
    },
    shippingAddress: {
      line1: {
        type: String,
        required: true
      },
      line2: String,
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      required: [true, 'Delivery status is must!'],
      enum: [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'fulfilled',
        'cancelled'
      ],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
