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
    res.status(201).json({
        message: "Order was created"
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