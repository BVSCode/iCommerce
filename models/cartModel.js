const mongoose = require('mongoose');

const cartSchema = mongoose.Schema(
    {
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: [true, 'ProductId is must!']
                },
                name: String,
                price: {
                    type: Number,
                    required: [true, 'Product price is must!']
                },
                description: String,
                instruction: String,
                cupSize: {
                    type: String,
                    enum: {
                        values: ['L', 'S', 'M'],
                        message: 'Size is either: large, small or medium'
                    }
                },
                Subtotal: {
                    type: Number,
                    required: [true, 'SubTotal is must!']
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is must!'],
                    default: 1,
                    min: [1, 'Quantity can not be less then 1.']
                }
            }
        ],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'user is must!']
        },
        total: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        flag: {
            type: String
        },
        __v: { type: Number, select: false }
    },
    {
        timestamps: true
    }
);

// THIS CREATES A PROBLEM
// Populate: this will invoke every find-query
// cartSchema.pre(/^find/, function (next) {
//     this.populate({
//         path: 'items.product', // field name in Model
//         select: 'name price stock imageCover ratingsAverage'
//     })

//     next();
// })

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
