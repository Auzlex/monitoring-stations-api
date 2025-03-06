const loadEnv = require('../../loadEnv');
loadEnv(); // Load and process environment variables

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Station = require("../models/station");

// get all records across all stations
// Description: Retrieve pollution records for all monitoring stations. This endpoint should be publicly accessible.
// query parameters: from, to timestamps, limit, and pollutant type
router.get("/", (req, res, next) => {
    // ARRANGE
    const from = req.query.from ? parseInt(req.query.from) : null;
    const to = req.query.to ? parseInt(req.query.to) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const pollutant = req.query.pollutant;

    // Validate query parameters
    // Check if from timestamp is valid
    if (req.query.from && isNaN(from)) {
        return res.status(400).json({
            message: "Invalid 'from' timestamp. Must be a valid number."
        });
    }

    // Check if to timestamp is valid
    if (req.query.to && isNaN(to)) {
        return res.status(400).json({
            message: "Invalid 'to' timestamp. Must be a valid number."
        });
    }

    // Check if from is before to
    if (from && to && from > to) {
        return res.status(400).json({
            message: "'from' timestamp must be before 'to' timestamp."
        });
    }

    // Check if limit is valid
    if (req.query.limit && (isNaN(limit) || limit <= 0)) {
        return res.status(400).json({
            message: "Invalid 'limit'. Must be a positive number."
        });
    }

    // Check if pollutant is valid
    const validPollutants = ['nox', 'no2', 'no', 'pm10', 'co', 'o3', 'so2'];
    if (pollutant && !validPollutants.includes(pollutant)) {
        return res.status(400).json({
            message: "Invalid pollutant type. Must be one of: nox, no2, no, pm10, co, o3, so2"
        });
    }

    // ACT
    Station.find()
        .select('name records')
        .exec()
        .then(stations => {
            // Process records from all stations
            let allRecords = [];
            stations.forEach(station => {
                station.records.forEach(record => {
                    // Create a new record object with station name
                    allRecords.push({
                        stationName: station.name,
                        ts: record.ts,
                        nox: record.nox,
                        no2: record.no2,
                        no: record.no,
                        pm10: record.pm10,
                        co: record.co,
                        o3: record.o3,
                        so2: record.so2
                    });
                });
            });

            // Apply filters if provided
            if (from) {
                allRecords = allRecords.filter(record => record.ts >= from);
            }
            if (to) {
                allRecords = allRecords.filter(record => record.ts <= to);
            }
            if (pollutant) {
                allRecords = allRecords.filter(record => pollutant in record);
            }

            // Sort by timestamp in descending order (newest first)
            allRecords.sort((a, b) => b.ts - a.ts);

            // Apply limit if provided
            if (limit) {
                allRecords = allRecords.slice(0, limit);
            }

            // ASSERT
            res.status(200).json({
                count: allRecords.length,
                records: allRecords
            });
        })
        .catch(err => {
            next(err); // Pass error to error handling middleware
        });
});

module.exports = router; 