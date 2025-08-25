const loadEnv = require('../loadEnv');
loadEnv(); // Load and process environment variables

const request = require('supertest');
const server = require('../server'); // Adjust the path as necessary
const mongoose = require('mongoose');
const Station = require('../api/models/station');

const jwt = require("jsonwebtoken");

jest.mock("../api/middleware/check-auth", () => {
    return (req, res, next) => {
        req.userData = { id: "testUser", role: "admin" };
        next();
    };
});

describe('Stations', () => {
    // Before all tests, connect to the test database
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGODB_URI);
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

        beforeAll(() => {
            token = jwt.sign(
                { id: "testUser", role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
        });

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

        beforeAll(() => {
            token = jwt.sign(
                { id: "testUser", role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
        });

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

    // Test the DELETE /stations/:stationID route
    describe('DELETE /stations/:stationID', () => {

        beforeAll(() => {
            token = jwt.sign(
                { id: "testUser", role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
        });

        let testStation1;
        let testStation2;

        beforeEach(async () => {
            // ARRANGE - Set up test data before each test
            testStation1 = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Station To Delete',
                latitude: 51.5074,
                longitude: -0.1278,
                records: []
            });
            await testStation1.save();

            testStation2 = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Station To Keep',
                latitude: 51.5075,
                longitude: -0.1279,
                records: []
            });
            await testStation2.save();
        });

        it('should DELETE only the target station', async () => {
            // ACT
            const res = await request(server)
                .delete('/stations/' + testStation1._id);

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station deleted successfully');

            // Additional ASSERT to verify database state
            const deletedStation = await Station.findById(testStation1._id);
            expect(deletedStation).toBeNull();

            // Verify other station still exists
            const remainingStation = await Station.findById(testStation2._id);
            expect(remainingStation).not.toBeNull();
            expect(remainingStation._id.toString()).toBe(testStation2._id.toString());
            expect(remainingStation.name).toBe('Station To Keep');
        });

        it('should return 404 when deleting a non-existent station', async () => {
            // ARRANGE
            const nonExistentId = new mongoose.Types.ObjectId();

            // ACT
            const res = await request(server)
                .delete('/stations/' + nonExistentId);

            // ASSERT
            expect(res.status).toBe(404);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station not found');

            // Additional ASSERT to verify database state
            const station1 = await Station.findById(testStation1._id);
            const station2 = await Station.findById(testStation2._id);
            
            // Verify both stations still exist
            expect(station1).not.toBeNull();
            expect(station2).not.toBeNull();
            expect(station1._id.toString()).toBe(testStation1._id.toString());
            expect(station2._id.toString()).toBe(testStation2._id.toString());
        });
    });

    // Test the GET /records route
    describe('GET /records', () => {
        let testStation1;
        let testStation2;

        beforeEach(async () => {
            // ARRANGE - Set up test data before each test
            testStation1 = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Station One',
                latitude: 51.5074,
                longitude: -0.1278,
                records: [
                    {
                        ts: 1000,
                        nox: 10,
                        no2: 5,
                        no: 3,
                        pm10: 20,
                        co: 0.5,
                        o3: 30,
                        so2: 2
                    },
                    {
                        ts: 2000,
                        nox: 15,
                        no2: 8,
                        no: 4,
                        pm10: 25,
                        co: 0.7,
                        o3: 35,
                        so2: 3
                    },
                    {
                        ts: 3000,
                        nox: 12,
                        no2: 6,
                        no: 3.5,
                        pm10: 22,
                        co: 0.6,
                        o3: 32,
                        so2: 2.5
                    },
                    {
                        ts: 4000,
                        nox: 18,
                        no2: 9,
                        no: 5,
                        pm10: 28,
                        co: 0.8,
                        o3: 38,
                        so2: 4
                    },
                    {
                        ts: 5000,
                        nox: 14,
                        no2: 7,
                        no: 4.5,
                        pm10: 24,
                        co: 0.65,
                        o3: 34,
                        so2: 3.5
                    }
                ]
            });
            await testStation1.save();

            testStation2 = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Station Two',
                latitude: 51.5075,
                longitude: -0.1279,
                records: [
                    {
                        ts: 1500,
                        nox: 11,
                        no2: 5.5,
                        no: 3.2,
                        pm10: 21,
                        co: 0.55,
                        o3: 31,
                        so2: 2.2
                    },
                    {
                        ts: 2500,
                        nox: 16,
                        no2: 8.5,
                        no: 4.2,
                        pm10: 26,
                        co: 0.75,
                        o3: 36,
                        so2: 3.2
                    },
                    {
                        ts: 3500,
                        nox: 13,
                        no2: 6.5,
                        no: 3.8,
                        pm10: 23,
                        co: 0.65,
                        o3: 33,
                        so2: 2.8
                    },
                    {
                        ts: 4500,
                        nox: 19,
                        no2: 9.5,
                        no: 5.2,
                        pm10: 29,
                        co: 0.85,
                        o3: 39,
                        so2: 4.2
                    },
                    {
                        ts: 5500,
                        nox: 15,
                        no2: 7.5,
                        no: 4.8,
                        pm10: 25,
                        co: 0.7,
                        o3: 35,
                        so2: 3.8
                    }
                ]
            });
            await testStation2.save();
        });

        it('should GET all records from all stations', async () => {
            // ACT
            const res = await request(server).get('/records');

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('count', 10);
            expect(res.body.records).toHaveLength(10);
            
            // Verify all records have required fields
            res.body.records.forEach(record => {
                expect(record).toHaveProperty('stationName');
                expect(record).toHaveProperty('ts');
                expect(record).toHaveProperty('nox');
                expect(record).toHaveProperty('no2');
                expect(record).toHaveProperty('no');
                expect(record).toHaveProperty('pm10');
                expect(record).toHaveProperty('co');
                expect(record).toHaveProperty('o3');
                expect(record).toHaveProperty('so2');
            });

            // Verify records are sorted by timestamp (newest first)
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should filter records by timestamp range', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ from: 2000, to: 4000 });

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(5);
            expect(res.body.records.every(record => 
                record.ts >= 2000 && record.ts <= 4000
            )).toBe(true);
            
            // Verify records are sorted by timestamp (newest first)
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should filter records by pollutant type', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ pollutant: 'o3' });

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(10);
            expect(res.body.records.every(record => 
                'o3' in record && typeof record.o3 === 'number'
            )).toBe(true);
            
            // Verify records are sorted by timestamp (newest first)
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should limit the number of records returned', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ limit: 5 });

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(5);
            
            // Verify records are sorted by timestamp (newest first)
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
            
            // Verify we got the 5 most recent records
            expect(res.body.records[0].ts).toBe(5500);
            expect(res.body.records[4].ts).toBe(3500);
        });

        it('should combine multiple filters', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ 
                    from: 2000, 
                    to: 4000,
                    pollutant: 'no2',
                    limit: 3
                });

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(3);
            expect(res.body.records.every(record => 
                record.ts >= 2000 && 
                record.ts <= 4000 && 
                'no2' in record
            )).toBe(true);
            
            // Verify records are sorted by timestamp (newest first)
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should return 400 for invalid timestamp format', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ from: 'invalid' });

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid 'from' timestamp. Must be a valid number.");
        });

        it('should return 400 for invalid timestamp range', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ from: 4000, to: 2000 });

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "'from' timestamp must be before 'to' timestamp.");
        });

        it('should return 400 for invalid limit', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ limit: -1 });

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid 'limit'. Must be a positive number.");
        });

        it('should return 400 for invalid pollutant type', async () => {
            // ACT
            const res = await request(server)
                .get('/records')
                .query({ pollutant: 'invalid' });

            // ASSERT
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid pollutant type. Must be one of: nox, no2, no, pm10, co, o3, so2");
        });

        it('should handle empty records', async () => {
            // ARRANGE
            const emptyStation = new Station({
                _id: new mongoose.Types.ObjectId(),
                name: 'Empty Station',
                latitude: 51.5076,
                longitude: -0.1280,
                records: []
            });
            await emptyStation.save();

            // ACT
            const res = await request(server).get('/records');

            // ASSERT
            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('count', 10); // Should still return records from other stations
            expect(res.body.records).toHaveLength(10);
        });
    });
});