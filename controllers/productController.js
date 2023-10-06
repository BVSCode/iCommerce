const Product = require('../models/productModel');

exports.aliasTopProducts = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getAllProducts = async (req, res) => {
    try {
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
            if (skip >= numTours) throw new Error('This page does not Exits');
        }

        // Now Execute the query
        const products = await query;

        res.status(200).json({
            status: "success",
            results: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            status: "fails",
            message: error
        })
    }
}

exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        res.status(200).json({
            status: "success",
            data: product
        });
    } catch (error) {
        res.status(400).json({
            status: 'fails',
            message: error
        })
    }
}

exports.createProduct = async (req, res) => {
    try {
        const newProduct = await Product.create(req.body)

        res.status(201).json({
            status: "success",
            data: newProduct
        });
    } catch (error) {
        res.status(400).json({
            status: "fails",
            message: error
        })
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        res.status(201).json({
            status: "success",
            data: updatedProduct
        });
    } catch (error) {
        res.status(400).json({
            status: "fails",
            message: error
        })
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id)

        res.status(204).json({
            status: "success",
            data: null
        });
    } catch (error) {
        res.status(400).json({
            status: "fails",
            message: error
        })
    }
}

// Aggregation Pipeline--
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
        ])

        res.status(200).json({
            status: 'success',
            results: stats.length,
            data: {
                stats
            }
        })

    } catch (err) {
        res.status(400).json({
            status: 'failed',
            message: err
        })
    }
}
