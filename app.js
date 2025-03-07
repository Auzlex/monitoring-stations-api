const loadEnv = require('./loadEnv');
loadEnv(); // Load and process environment variables

const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");

// import routes
const stationRoutes = require("./api/routes/stations");
const recordRoutes = require("./api/routes/records");

// check if the environment variable is set for MONGODB_PASSWORD
if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI environment variable not set");
    process.exit(1);
}

// attempt to connect to the database
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }); // connect to the database

// load middleware
app.use(morgan("dev")); // log requests
app.use(express.urlencoded({ extended: false })); // true allows for rich data
app.use(express.json()); // parse json data

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
app.use('/stations', stationRoutes);
app.use('/records', recordRoutes);

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