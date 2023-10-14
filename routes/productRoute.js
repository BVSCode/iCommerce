const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoute');

const router = express.Router();

router.use('/:productId/reviews', reviewRouter); // it will use reviewRouter when match the URL

router.route('/top-5-cheap').get(productController.aliasTopProducts, productController.getAllProducts);
router.route('/product-stats').get(productController.getProductStats);

router
    .route('/')
    .get(productController.getAllProducts)
    .post(
        authController.protect,
        authController.restrictTo('admin'),
        productController.createProduct,
    );

router
    .route('/:id')
    .get(productController.getProduct)
    .patch(
        authController.protect,
        authController.restrictTo('admin'),
        productController.updateProduct
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin'),
        productController.deleteProduct
    );

module.exports = router;