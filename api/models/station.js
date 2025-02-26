const mongoose = require("mongoose");

// create a schema for the station
const stationSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // the id is an object id
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
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