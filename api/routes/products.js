const express = require("express");
const router = express.Router();

// handle get requests to /products
router.get("/", (req, res, next) => {
    res.status(200).json({
        message: "Handling GET requests to /products"
    });
});

// handle post requests to /products
router.post("/", (req, res, next) => {

    // create a product object
    const product = {
        name: req.body.name,
        price: req.body.price
    };

    res.status(201).json({
        message: "Handling POST requests to /products",
        createdProduct: product
    });
});

// get product
router.get("/:productId", (req, res, next) => {
    const id = req.params.productId;
    if (id === "special") {
        res.status(200).json({
            message: "You discovered the special ID",
            id: id
        });
    } else {
        res.status(200).json({
            message: "You passed an ID " + id
        });
    }
});

router.patch("/:productId", (req, res, next) => {
    res.status(200).json({
        message: "Updated product!"
    });
});

router.delete("/:productId", (req, res, next) => {
    res.status(200).json({
        message: "Delete product!"
    });
});


// export the router to be used in app.js
module.exports = router;