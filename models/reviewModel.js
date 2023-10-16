const mongoose = require('mongoose');
const Product = require('./productModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review can not be empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        product: {
            //We do Parent Refferencing, so every review is child of Product
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Review must belong to a Product.']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User', // Refference to Product Model
            required: [true, 'Review must belong to a User.']
        },
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        __v: { type: Number, select: false },
    }
);

// Only user can put on review with a Perticuler Product, not multiple with same Product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Populate: this will invoke every find-query
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'product', // field name in schema which will be replaced
        select: 'name'
    }).populate({
        path: 'user',
        select: 'userName photo'
    })

    // this.populate({
    //     path: 'user',
    //     select: 'userName photo'
    // });

    next();
});

// Calculating Ratings Average--
reviewSchema.statics.calcAverageRatings = async function (productId) {
    const stats = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    // console.log(stats);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            //if there is no ratingsQuantity set default values 4.5
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save', function () {
    // this will invoke while new review being created
    // assume this.constructor is a Review Model
    this.constructor.calcAverageRatings(this.product);
});

// this method will also invoke for updating and deleting, findByIdAndUpdate, findByIdAndDelete.
reviewSchema.pre(/^findOneAnd/, async function (next) {
    // this will work on while a new review being updated or deleted
    // this keyword represents the current document being processing.
    this.r = await this.clone().findOne(); // this will just clone the current quering document and passes it to the next
    console.log(this.r, 'schema');
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    // console.log(this.r, this.r.product, "product id");
    await this.r.constructor.calcAverageRatings(this.r.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
