const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");

// import products 
const productRoutes = require("./api/routes/products"); // import the products routes
const ordersRoutes = require("./api/routes/orders"); // import the orders routes

// load middleware
app.use(morgan("dev")); // log requests
app.use(bodyParser.urlencoded({ extended: false })); // true allows for rich data
app.use(bodyParser.json()); // parse json data

// CORS handling
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // allow all domains
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

// register the routes with the app
app.use('/products', productRoutes); // use the productRoutes
app.use('/orders', ordersRoutes); // use the ordersRoutes

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