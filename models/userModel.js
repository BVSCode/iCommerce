const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: [true, 'Username is must!'],
            unique: [true, 'This username is already taken!']
        },
        email: {
            type: String,
            // required: [true, 'please provide your email'],
            // unique: true,

            lowercase: true
            // validate: [validator.isEmail, 'please provide a valid Email']
        },
        shippingAddress: {
            line1: {
                type: String
                // required: true
            },
            line2: String,
            city: {
                type: String
                // required: true
            },
            state: {
                type: String
                // required: true
            },
            postalCode: {
                type: String
                // required: true
            },
            country: {
                type: String
                // required: true
            }
        },
        phone: {
            type: String,
            trim: true,
            required: [true, 'Mobile Number is must!'],
            unique: [true, 'Mobile Number must be unique!'],
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v);
                },
                message: '{VALUE} is not a valid 10 digit number!'
            }
        },
        photo: String,
        role: {
            type: String,
            required: [true, 'User role is must!'],
            enum: ['user', 'admin'],
            default: 'user'
        },
        phoneOtp: String,
        active: {
            type: Boolean,
            default: true,
            select: false
        },
        isVerified: {
            type: Boolean,
            default: false,
            select: false
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
