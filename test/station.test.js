const loadEnv = require('../loadEnv');
loadEnv(); // Load and process environment variables

const request = require('supertest');
const server = require('../server'); // Adjust the path as necessary
const mongoose = require('mongoose');
const Station = require('../api/models/station');

describe('Stations', () => {
    // Before all tests, connect to the test database
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to the test database');
    });

    // Before each test, clear the database
    beforeEach(async () => {
        await Station.deleteMany({});
    });

    // Close the database connection after all tests
    afterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    // Test the GET /stations route
    describe('GET /stations', () => {
        it('should GET all the stations', async () => {
            // ARRANGE
            // No specific arrangement needed as we're testing empty state

            // ACT
            const res = await request(server).get('/stations');

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.stations).toBeInstanceOf(Array);
            expect(res.body.stations.length).toBe(0);
        });

        it('should GET a station by the given id', async () => {
            // ARRANGE
            const station = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'AURN London Centre',
                latitude: 51.5074,
                longitude: -0.1278,
                records: []
            });
            await station.save();

            const allStationsRes = await request(server).get('/stations');
            const stationId = allStationsRes.body.stations[0]._id;

            // ACT
            const res = await request(server).get('/stations/' + stationId);

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('_id', station._id.toString());
            expect(res.body).toHaveProperty('name', 'AURN London Centre');
            expect(res.body).toHaveProperty('latitude', 51.5074);
            expect(res.body).toHaveProperty('longitude', -0.1278);
        });

        it('should return 404 for a non-existent station id', async () => {
            // ARRANGE
            const nonExistentId = new mongoose.Types.ObjectId();

            // ACT
            const res = await request(server).get('/stations/' + nonExistentId);

            // ASSERT
            expect(res.status).toBe(404);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station not found');
        });
    });

    // Test the POST /stations route
    describe('POST /stations', () => {
        it('should not POST a station without name field', async () => {
            // ARRANGE
            const station = {
                latitude: 51.5074,
                longitude: -0.1278
            };

            // ACT
            const res = await request(server).post('/stations').send(station);

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: name, latitude, and longitude are required.');
        });

        it('should not POST a station without latitude field', async () => {
            const station = {
                name: 'Test Station',
                longitude: -0.1278
            };
            const res = await request(server).post('/stations').send(station);
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: name, latitude, and longitude are required.');
        });

        it('should not POST a station without longitude field', async () => {
            const station = {
                name: 'Test Station',
                latitude: 51.5074
            };
            const res = await request(server).post('/stations').send(station);
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: name, latitude, and longitude are required.');
        });

        it('should not POST a station with non-numeric latitude', async () => {
            const station = {
                name: 'Test Station',
                latitude: 'invalid',
                longitude: -0.1278
            };
            const res = await request(server).post('/stations').send(station);
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: latitude and longitude must be numbers.');
        });

        it('should not POST a station with non-numeric longitude', async () => {
            // ARRANGE
            const station = {
                name: 'Test Station',
                latitude: 51.5074,
                longitude: 'invalid'
            };

            // ACT
            const res = await request(server).post('/stations').send(station);

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: latitude and longitude must be numbers.');
        });

        it('should POST a station', async () => {
            // ARRANGE
            const station = {
                name: 'Test Station',
                latitude: 51.5074,
                longitude: -0.1278
            };

            // ACT
            const res = await request(server).post('/stations').send(station);

            // ASSERT
            expect(res.status).toBe(201);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station created successfully');
            expect(res.body.createdStation).toHaveProperty('name', 'Test Station');
            expect(res.body.createdStation).toHaveProperty('latitude', 51.5074);
            expect(res.body.createdStation).toHaveProperty('longitude', -0.1278);
        });
    });

    // Test the PATCH /stations/:stationID route
    describe('PATCH /stations/:stationID', () => {
        let testStation;

        beforeEach(async () => {
            // ARRANGE - Set up test data before each test
            testStation = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Original Station Name',
                latitude: 51.5074,
                longitude: -0.1278,
                records: []
            });
            await testStation.save();
        });

        it('should PATCH a station name successfully', async () => {
            // ARRANGE
            const newName = 'Updated Station Name';

            // ACT
            const res = await request(server)
                .patch('/stations/' + testStation._id)
                .send({ name: newName });

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station updated successfully');
            expect(res.body.updatedStation).toBeDefined();
            expect(res.body.updatedStation.matchedCount).toBe(1);
            expect(res.body.updatedStation.modifiedCount).toBe(1);

            // Additional ASSERT to verify database state
            const updatedStation = await Station.findById(testStation._id);
            expect(updatedStation.name).toBe(newName);
            expect(updatedStation._id.toString()).toBe(testStation._id.toString());
        });

        it('should not PATCH a station with invalid name format', async () => {
            // ARRANGE
            const invalidName = 'Invalid@Name!';

            // ACT
            const res = await request(server)
                .patch('/stations/' + testStation._id)
                .send({ name: invalidName });

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Invalid name. Only upper and lower case letters and numbers are allowed.');

            // Additional ASSERT to verify database state
            const unchangedStation = await Station.findById(testStation._id);
            expect(unchangedStation.name).toBe('Original Station Name');
        });

        it('should return 404 when PATCHing a non-existent station', async () => {
            // ARRANGE
            const nonExistentId = new mongoose.Types.ObjectId();

            // ACT
            const res = await request(server)
                .patch('/stations/' + nonExistentId)
                .send({ name: 'New Name' });

            // ASSERT
            expect(res.status).toBe(404);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station not found');
        });
    });
});