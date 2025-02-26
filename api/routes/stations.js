require("dotenv").config(); // load environment variables

const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Station = require("../models/station");

/* 

    Station Metadata

*/

// handle get requests to /stations
// Description: Retrieve a list of all monitoring stations with basic information (ID, name, location, coordinates). This endpoint should be publicly accessible.
router.get("/", (req, res, next) => {
    Station.find() // find all stations
        .select("_id name latitude longitude") // select only the id, name, latitude, and longitude
        .exec()
        .then(stations => {
            const response = {
                count: stations.length,
                stations: stations.map(station => {
                    return {
                        _id: station._id,
                        name: station.name,
                        latitude: station.latitude,
                        longitude: station.longitude,
                        request: { // add a request object to each station
                            type: "GET",
                            url: "http://localhost:"+ (process.env.SERVER_PORT || 7000) +"/stations/" + station._id
                        }
                    };
                })
            };
            res.status(200).json(response);
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

// get a specific station
// Description: Retrieve detailed information about a specific monitoring station. This endpoint should be publicly accessible.
router.get("/:stationID", (req, res, next) => {
    const id = req.params.stationID;
    Station.findById(id)
        .exec()
        .then(station => {
            if (station) {
                res.status(200).json(station);
            } else {
                res.status(404).json({ message: "Station not found" });
            }
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

// handle post requests to /stations
// Description: Add a new monitoring station to the database. This endpoint should be restricted to admin users only.
router.post("/", (req, res, next) => {

    // create a new instance of the station model
    const station = new Station({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        records: [] // initialize records as an empty array
    });

    // save the station to the database
    station.save()
        .then(result => {
            res.status(201).json({
                message: "Station created successfully",
                createdStation: result
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

// update a station
// Description: Update information about a specific monitoring station. This endpoint should be restricted to admin users only.
router.patch("/:stationID", (req, res, next) => {
    const id = req.params.stationID;
    const updateOps = {};

    // Regular expression to allow only upper and lower case letters and numbers
    const validNameRegex = /^[a-zA-Z0-9 ]+$/;

    // Only allow updating the name field if it matches the regex
    if (req.body.name && validNameRegex.test(req.body.name)) {
        updateOps.name = req.body.name;
    } else {
        return res.status(400).json({
            message: "Invalid name. Only upper and lower case letters and numbers are allowed."
        });
    }

    // update the specific targeted station id
    Station.updateOne({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            if (result.matchedCount > 0) {
                if (result.modifiedCount > 0) {
                    res.status(200).json({
                        message: "Station updated successfully",
                        updatedStation: result,
                        request: { // add a request object to each station
                            type: "GET",
                            url: "http://localhost:"+ (process.env.SERVER_PORT || 7000) +"/stations/" + id
                        }
                    });
                } else {
                    res.status(200).json({
                        message: "Station found but no changes made",
                        updatedStation: result,
                        request: { // add a request object to each station
                            type: "GET",
                            url: "http://localhost:"+ (process.env.SERVER_PORT || 7000) +"/stations/" + id
                        }
                    });
                }
            } else {
                res.status(404).json({
                    message: "Station not found"
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

// delete a station
// Description: Delete a specific monitoring station from the database. This endpoint should be restricted to admin users only.
router.delete("/:stationID", (req, res, next) => {
    const id = req.params.stationID;
    Station.findByIdAndDelete(id)
        .exec()
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Station deleted successfully"
                });
            } else {
                res.status(404).json({
                    message: "Station not found"
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* 

    Pollution Records

*/

// get a target station's pollution records
// Description: Retrieve pollution records for a specific monitoring station. This endpoint should be publicly accessible.
// query parameters: from, to timestamps, limit, and pollutant type
router.get("/:stationID/records", (req, res, next) => {
    const id = req.params.stationID;
    Station.findById(id)
        .select("records") // select only the records field
        .exec()
        .then(station => {
            if (station) {
                res.status(200).json({ 
                    
                    message: "Found " + station.records.length + " records",
                    records: station.records 

                });
            } else {
                res.status(404).json({ message: "Station not found" });
            }
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

// add a new record to a target station
// Description: Add a new pollution record to a specific monitoring station. This endpoint should be restricted to admin users only.
router.post("/:stationID/records", (req, res, next) => {
    const id = req.params.stationID;

    // Validate required fields
    if (!req.body.ts || !req.body.nox || !req.body.no2 || !req.body.no) {
        return res.status(400).json({
            message: "Missing required fields: ts, nox, no2, and no are required."
        });
    }

    // Validate that required fields are numbers
    if (isNaN(req.body.ts) || isNaN(req.body.nox) || isNaN(req.body.no2) || isNaN(req.body.no)) {
        return res.status(400).json({
            message: "Invalid input: ts, nox, no2, and no must be numbers."
        });
    }

    // Validate optional fields if they are provided
    const optionalFields = ['pm10', 'co', 'o3', 'so2'];
    for (const field of optionalFields) {
        if (req.body[field] !== undefined && isNaN(req.body[field])) {
            return res.status(400).json({
                message: `Invalid input: ${field} must be a number if provided.`
            });
        }
    }

    // Create the new record object
    const newRecord = {
        ts: req.body.ts,
        nox: req.body.nox,
        no2: req.body.no2,
        no: req.body.no,
        pm10: req.body.pm10 || null,
        co: req.body.co || null,
        o3: req.body.o3 || null,
        so2: req.body.so2 || null
    };

    // Find the station by ID and add the new record
    Station.findById(id)
        .exec()
        .then(station => {
            if (station) {
                station.records.push(newRecord);
                return station.save();
            } else {
                res.status(404).json({ message: "Station not found" });
            }
        })
        .then(result => {
            res.status(201).json({
                message: "Record added successfully",
                updatedStation: result,
                request: {
                    type: "GET",
                    url: "http://localhost:" + (process.env.SERVER_PORT || 7000) + "/stations/" + id
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

// get all records across all stations
// Description: Retrieve pollution records for all monitoring stations. This endpoint should be publicly accessible.
// query parameters: from, to timestamps, limit, and pollutant type
router.get("/records", (req, res, next) => {
    res.status(200).json({
        message: "Handling GET requests to /stations/records"
    });
});

/* 

    Advanced Queries

*/

// GET /stations/nearest?lat={lat}&lng={lng}&radius={km}
// Description: Retrieve a list of monitoring stations within a certain radius of a given location. This endpoint should be publicly accessible.
router.get("/nearest", (req, res, next) => {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const radius = req.query.radius;
    res.status(200).json({
        message: "Handling GET requests to /stations/nearest",
        lat: lat,
        lng: lng,
        radius: radius
    });
});

// GET /stations/:id/summary
// Description: Retrieve a summary of pollution records for a specific monitoring station. This endpoint should be publicly accessible.
router.get("/:stationID/summary", (req, res, next) => {
    const id = req.params.stationID;
    res.status(200).json({
        message: "Handling GET requests to /stations/" + id + "/summary"
    });
});

// export the router to be used in app.js
module.exports = router;