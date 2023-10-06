const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.route('/top-5-cheap').get(productController.aliasTopProducts, productController.getAllProducts);
router.route('/product-stats').get(productController.getProductStats);

router
    .route('/')
    .get(productController.getAllProducts)
    .post(productController.createProduct);


router
    .route('/:id')
    .get(productController.getProduct)
    .patch(productController.updateProduct)
    .delete(productController.deleteProduct);

module.exports = router;