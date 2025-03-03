const mongoose = require("mongoose");

// create a schema for the station
const stationSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // the id is an object id
    name: { type: String, required: true }, // the name of th station
    latitude: { type: Number, required: true }, // the latitude of the station
    longitude: { type: Number, required: true }, // the longitude of the station

    // the records is an array of objects
    // each object has a timestamp, nox, no2, no, pm10, co, o3, so2
    records: [{ 
        ts: { type: Number, required: true },
        nox: { type: Number, required: true },
        no2: { type: Number, required: true },
        no: { type: Number, required: true },
        pm10: { type: Number, required: true },
        co: { type: Number, required: true },
        o3: { type: Number, required: true },
        so2: { type: Number, required: true }
    }]
});

module.exports = mongoose.model('Station', stationSchema);