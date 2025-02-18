const express = require("express");
const app = express();
const morgan = require("morgan");

// import products 
const productRoutes = require("./api/routes/products");
const ordersRoutes = require("./api/routes/orders");

app.use(morgan("dev"));

// register the routes with the app
app.use('/products', productRoutes);
app.use('/orders', ordersRoutes);

// error handling for routes that do not exist
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status(404);
    next(error);
});

// error handling for internal server errors
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;