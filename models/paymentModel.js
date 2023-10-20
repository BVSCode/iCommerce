const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is must!']
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is must!']
    },
    method: {
      type: String,
      required: [true, 'payment must have a method!'],
      enum: ['credit_card', 'debit_card', 'paypal']
    },
    status: {
      type: String,
      required: [true, 'Payment status is must!'],
      enum: ['pending', 'paid', 'failed']
    },
    paymentId: {
      type: String,
      required: [true, 'Payment id is must!']
    },
    gateway: {
      type: String
    },
    amount: {
      type: Number,
      required: [true, 'Amount is must!'],
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
