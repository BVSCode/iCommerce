const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopProducts = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getAllProducts = catchAsync(async (req, res, next) => {
    // Build the query
    // 1A) Filtering
    const queryObj = { ...req.query }; //creating a copy of query obj and exclude fields
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr)); //save the mongoose query to chain sort limit etc methods after

    // 2) Sorting 
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }
    else {
        query = query.sort('-createdAt'); // sort by newest
    }

    // Fields Limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
    }
    else {
        query = query.select('-__v');
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    console.log(skip, limit);

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
        const numTours = await Product.countDocuments();
        if (skip >= numTours) return next(new AppError('Page not found!', 404));
    }

    // Now Execute the query
    const products = query;

    res.status(200).json({
        status: "success",
        results: products.length,
        data: products
    });
});

exports.getProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new AppError('Product not found with that ID!', 404));
    }

    res.status(200).json({
        status: "success",
        data: product
    });
});

exports.createProduct = catchAsync(async (req, res, next) => {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
        status: "success",
        data: newProduct
    });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updatedProduct) {
        return next(new AppError('Product not found with that ID!', 404));
    }

    res.status(201).json({
        status: "success",
        data: updatedProduct
    });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        return next(new AppError('Product not found with that ID', 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});

// Aggregation Pipeline-- Product Stastics--
exports.getProductStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $match: { ratingsAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    _id: '$ratingsAverage',
                    numProducts: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 } // assending order: start with low and ends high
                // $sort: { avgPrice: -1} // dessending order: start with high and ends low
            }
        ]);
        res.status(200).json({
            status: 'success',
            results: stats.length,
            data: {
                stats
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err
        })
    }
}
