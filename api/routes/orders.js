const express = require("express");
const router = express.Router();

// handle get requests to /orders
router.get("/", (req, res, next) => {
    res.status(200).json({
        message: "Orders were fetched"
    });
});

// handle post requests to /orders
router.post("/", (req, res, next) => {

    const order = {
        productId: req.body.productId,
        quantity: req.body.quantity
    };

    res.status(201).json({
        message: "Order was created",
        order: order
    });
});

// get order
router.get("/:orderId", (req, res, next) => {
    res.status(200).json({
        message: "Order details",
        orderId: req.params.orderId
    });
});

// delete
router.delete("/:orderId", (req, res, next) => {
    res.status(200).json({
        message: "Order deleted",
        orderId: req.params.orderId
    });
});

module.exports = router;