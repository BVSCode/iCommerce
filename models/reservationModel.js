const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      require: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      require: true
    },
    quantity: {
      type: Number,
      require: true,
      min: 1
    },
    status: {
      type: String,
      default: 'pending'
    },
    timeout: Number
  },
  {
    timestamps: true
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
