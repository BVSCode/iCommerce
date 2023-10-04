const fs = require('fs');

const products = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/products.json`));
// console.log(products)

exports.getAllProducts = (req, res) => {
    res.status(200).json({
        status: "success",
        results: products.length,
        data: products
    });
}

exports.getProduct = (req, res) => {
    const id = req.params.id * 1;
    const product = products.find(el => el.id === id);

    if (product === undefined) {
        return res.status(404).json({
            status: "fails",
            msg: "The Product Not Found!"
        });
    }

    res.status(200).json({
        status: "success",
        data: product
    });
}

exports.createProduct = (req, res) => {
    const newId = products[products.length - 1].id + 1;
    const newProduct = Object.assign({ id: newId }, req.body);

    products.push(newProduct);

    fs.writeFile(`${__dirname}/../dev-data/data/products.json`, JSON.stringify(products), err => {
        if (err)
            throw err

        res.status(201).json({
            status: "success",
            data: newProduct
        });
    })

}

exports.updateProduct = (req, res) => {
    const id = req.params.id
    const product = products.find(el => el.id === id);

    if (product === undefined) {
        return res.status(404).json({
            status: "fails",
            msg: "The Product Not Found!"
        });
    }

    let updatedProduct = products[id - 1];
    products[id - 1] = updatedProduct = Object.assign({ id: id }, req.body);

    // console.log(products)
    fs.writeFile(`${__dirname}/../dev-data/data/products.json`, JSON.stringify(products), err => {
        if (err)
            throw err

        res.status(200).json({
            status: "success",
            data: updatedProduct
        });
    });
}

exports.deleteProduct = (req, res) => {
    const id = req.params.id
    const product = products.find(el => el.id === id);

    if (product === undefined) {
        return res.status(404).json({
            status: "fails",
            msg: "The Product Not Found!"
        });
    }

    products[id - 1] = null;
    const updatedProducts = products.filter(p => p !== null);

    fs.writeFile(`${__dirname}/../dev-data/data/products.json`, JSON.stringify(updatedProducts), err => {
        if (err)
            throw err

        res.status(204).json({
            status: "success",
            data: null
        });
    });
}
