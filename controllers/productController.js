const Product = require('../models/productModel');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find(req.query);
        // const products = await Product.find({price: {$gte: 500}});

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
