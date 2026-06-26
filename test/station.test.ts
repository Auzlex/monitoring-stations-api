import loadEnv from '../src/loadEnv';
loadEnv(); // Load and process environment variables

import request from 'supertest';
import server from '../src/server';
import { prisma } from '../src/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.mock("../src/api/middleware/check-auth", () => {
    return (req: any, res: any, next: any) => {
        req.userData = { id: "testUser", role: "admin" };
        next();
    };
});

describe('Stations', () => {
    let token: string;

    // Before all tests, connect to the test database
    beforeAll(async () => {
        await prisma.$connect();
    });

    // Before each test, clear the database
    beforeEach(async () => {
        await prisma.record.deleteMany({});
        await prisma.station.deleteMany({});
        await prisma.user.deleteMany({});
    });

    // Close the database connection after all tests
    afterAll(async () => {
        await prisma.$disconnect();
        await new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
    });

    // Test the GET /stations route
    describe('GET /stations', () => {
        it('should GET all the stations', async () => {
            const res = await request(server).get('/stations');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.stations).toBeInstanceOf(Array);
            expect(res.body.stations.length).toBe(0);
        });

        it('should GET a station by the given id', async () => {
            const station = await prisma.station.create({
                data: {
                    name: 'AURN London Centre',
                    latitude: 51.5074,
                    longitude: -0.1278
                }
            });

            const allStationsRes = await request(server).get('/stations');
            const stationId = allStationsRes.body.stations[0]._id;

            const res = await request(server).get('/stations/' + stationId);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('_id', station.id);
            expect(res.body).toHaveProperty('name', 'AURN London Centre');
            expect(res.body).toHaveProperty('latitude', 51.5074);
            expect(res.body).toHaveProperty('longitude', -0.1278);
        });

        it('should return 404 for a non-existent station id', async () => {
            const nonExistentId = crypto.randomUUID();

            const res = await request(server).get('/stations/' + nonExistentId);

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
                process.env.JWT_SECRET || 'SECRET',
                { expiresIn: "1h" }
            );
        });

        it('should not POST a station without name field', async () => {
            const station = {
                latitude: 51.5074,
                longitude: -0.1278
            };

            const res = await request(server).post('/stations').send(station);

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
            const station = {
                name: 'Test Station',
                latitude: 51.5074,
                longitude: 'invalid'
            };

            const res = await request(server).post('/stations').send(station);

            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station validation failed: latitude and longitude must be numbers.');
        });

        it('should POST a station', async () => {
            const station = {
                name: 'Test Station',
                latitude: 51.5074,
                longitude: -0.1278
            };

            const res = await request(server).post('/stations').send(station);

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
                process.env.JWT_SECRET || 'SECRET',
                { expiresIn: "1h" }
            );
        });

        let testStation: any;

        beforeEach(async () => {
            testStation = await prisma.station.create({
                data: {
                    name: 'Original Station Name',
                    latitude: 51.5074,
                    longitude: -0.1278
                }
            });
        });

        it('should PATCH a station name successfully', async () => {
            const newName = 'Updated Station Name';

            const res = await request(server)
                .patch('/stations/' + testStation.id)
                .send({ name: newName });

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station updated successfully');
            expect(res.body.updatedStation).toBeDefined();
            expect(res.body.updatedStation.matchedCount).toBe(1);
            expect(res.body.updatedStation.modifiedCount).toBe(1);

            const updatedStation = await prisma.station.findUnique({ where: { id: testStation.id } });
            expect(updatedStation).not.toBeNull();
            expect(updatedStation!.name).toBe(newName);
        });

        it('should not PATCH a station with invalid name format', async () => {
            const invalidName = 'Invalid@Name!';

            const res = await request(server)
                .patch('/stations/' + testStation.id)
                .send({ name: invalidName });

            expect(res.status).toBe(400);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Invalid name. Only upper and lower case letters and numbers are allowed.');

            const unchangedStation = await prisma.station.findUnique({ where: { id: testStation.id } });
            expect(unchangedStation).not.toBeNull();
            expect(unchangedStation!.name).toBe('Original Station Name');
        });

        it('should return 404 when PATCHing a non-existent station', async () => {
            const nonExistentId = crypto.randomUUID();

            const res = await request(server)
                .patch('/stations/' + nonExistentId)
                .send({ name: 'New Name' });

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
                process.env.JWT_SECRET || 'SECRET',
                { expiresIn: "1h" }
            );
        });

        let testStation1: any;
        let testStation2: any;

        beforeEach(async () => {
            testStation1 = await prisma.station.create({
                data: {
                    name: 'Station To Delete',
                    latitude: 51.5074,
                    longitude: -0.1278
                }
            });

            testStation2 = await prisma.station.create({
                data: {
                    name: 'Station To Keep',
                    latitude: 51.5075,
                    longitude: -0.1279
                }
            });
        });

        it('should DELETE only the target station', async () => {
            const res = await request(server)
                .delete('/stations/' + testStation1.id);

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station deleted successfully');

            const deletedStation = await prisma.station.findUnique({ where: { id: testStation1.id } });
            expect(deletedStation).toBeNull();

            const remainingStation = await prisma.station.findUnique({ where: { id: testStation2.id } });
            expect(remainingStation).not.toBeNull();
            expect(remainingStation!.name).toBe('Station To Keep');
        });

        it('should return 404 when deleting a non-existent station', async () => {
            const nonExistentId = crypto.randomUUID();

            const res = await request(server)
                .delete('/stations/' + nonExistentId);

            expect(res.status).toBe(404);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('message', 'Station not found');

            const station1 = await prisma.station.findUnique({ where: { id: testStation1.id } });
            const station2 = await prisma.station.findUnique({ where: { id: testStation2.id } });
            
            expect(station1).not.toBeNull();
            expect(station2).not.toBeNull();
        });
    });

    // Test the GET /records route
    describe('GET /records', () => {
        let testStation1: any;
        let testStation2: any;

        beforeEach(async () => {
            testStation1 = await prisma.station.create({
                data: {
                    name: 'Station One',
                    latitude: 51.5074,
                    longitude: -0.1278,
                    records: {
                        create: [
                            { ts: 1000, nox: 10, no2: 5, no: 3, pm10: 20, co: 0.5, o3: 30, so2: 2 },
                            { ts: 2000, nox: 15, no2: 8, no: 4, pm10: 25, co: 0.7, o3: 35, so2: 3 },
                            { ts: 3000, nox: 12, no2: 6, no: 3.5, pm10: 22, co: 0.6, o3: 32, so2: 2.5 },
                            { ts: 4000, nox: 18, no2: 9, no: 5, pm10: 28, co: 0.8, o3: 38, so2: 4 },
                            { ts: 5000, nox: 14, no2: 7, no: 4.5, pm10: 24, co: 0.65, o3: 34, so2: 3.5 }
                        ]
                    }
                }
            });

            testStation2 = await prisma.station.create({
                data: {
                    name: 'Station Two',
                    latitude: 51.5075,
                    longitude: -0.1279,
                    records: {
                        create: [
                            { ts: 1500, nox: 11, no2: 5.5, no: 3.2, pm10: 21, co: 0.55, o3: 31, so2: 2.2 },
                            { ts: 2500, nox: 16, no2: 8.5, no: 4.2, pm10: 26, co: 0.75, o3: 36, so2: 3.2 },
                            { ts: 3500, nox: 13, no2: 6.5, no: 3.8, pm10: 23, co: 0.65, o3: 33, so2: 2.8 },
                            { ts: 4500, nox: 19, no2: 9.5, no: 5.2, pm10: 29, co: 0.85, o3: 39, so2: 4.2 },
                            { ts: 5500, nox: 15, no2: 7.5, no: 4.8, pm10: 25, co: 0.7, o3: 35, so2: 3.8 }
                        ]
                    }
                }
            });
        });

        it('should GET all records from all stations', async () => {
            const res = await request(server).get('/records');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('count', 10);
            expect(res.body.records).toHaveLength(10);
            
            res.body.records.forEach((record: any) => {
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

            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should filter records by timestamp range', async () => {
            const res = await request(server)
                .get('/records')
                .query({ from: 2000, to: 4000 });

            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(5);
            expect(res.body.records.every((record: any) => 
                record.ts >= 2000 && record.ts <= 4000
            )).toBe(true);
            
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should filter records by pollutant type', async () => {
            const res = await request(server)
                .get('/records')
                .query({ pollutant: 'o3' });

            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(10);
            expect(res.body.records.every((record: any) => 
                'o3' in record && typeof record.o3 === 'number'
            )).toBe(true);
            
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should limit the number of records returned', async () => {
            const res = await request(server)
                .get('/records')
                .query({ limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(5);
            
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
            
            expect(res.body.records[0].ts).toBe(5500);
            expect(res.body.records[4].ts).toBe(3500);
        });

        it('should combine multiple filters', async () => {
            const res = await request(server)
                .get('/records')
                .query({ 
                    from: 2000, 
                    to: 4000,
                    pollutant: 'no2',
                    limit: 3
                });

            expect(res.status).toBe(200);
            expect(res.body.records).toHaveLength(3);
            expect(res.body.records.every((record: any) => 
                record.ts >= 2000 && 
                record.ts <= 4000 && 
                'no2' in record
            )).toBe(true);
            
            for (let i = 1; i < res.body.records.length; i++) {
                expect(res.body.records[i-1].ts).toBeGreaterThan(res.body.records[i].ts);
            }
        });

        it('should return 400 for invalid timestamp format', async () => {
            const res = await request(server)
                .get('/records')
                .query({ from: 'invalid' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid 'from' timestamp. Must be a valid number.");
        });

        it('should return 400 for invalid timestamp range', async () => {
            const res = await request(server)
                .get('/records')
                .query({ from: 4000, to: 2000 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "'from' timestamp must be before 'to' timestamp.");
        });

        it('should return 400 for invalid limit', async () => {
            const res = await request(server)
                .get('/records')
                .query({ limit: -1 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid 'limit'. Must be a positive number.");
        });

        it('should return 400 for invalid pollutant type', async () => {
            const res = await request(server)
                .get('/records')
                .query({ pollutant: 'invalid' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', "Invalid pollutant type. Must be one of: nox, no2, no, pm10, co, o3, so2");
        });

        it('should handle empty records', async () => {
            await prisma.station.create({
                data: {
                    name: 'Empty Station',
                    latitude: 51.5076,
                    longitude: -0.1280
                }
            });

            const res = await request(server).get('/records');

            expect(res.status).toBe(200);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body).toHaveProperty('count', 10);
            expect(res.body.records).toHaveLength(10);
        });
    });

    // Test the GET /stations/nearest route
    describe('GET /stations/nearest', () => {
        it('should GET stations within a specified radius', async () => {
            const st1 = await prisma.station.create({
                data: { name: 'London Station', latitude: 51.5074, longitude: -0.1278 }
            });
            const st2 = await prisma.station.create({
                data: { name: 'Watford Station', latitude: 51.6565, longitude: -0.3903 }
            });

            const res1 = await request(server)
                .get('/stations/nearest')
                .query({ lat: 51.5074, lng: -0.1278, radius: 10 });

            expect(res1.status).toBe(200);
            expect(res1.body.count).toBe(1);
            expect(res1.body.stations[0]).toHaveProperty('name', 'London Station');

            const res2 = await request(server)
                .get('/stations/nearest')
                .query({ lat: 51.5074, lng: -0.1278, radius: 30 });

            expect(res2.status).toBe(200);
            expect(res2.body.count).toBe(2);
        });

        it('should return 400 for missing query parameters', async () => {
            const res = await request(server)
                .get('/stations/nearest')
                .query({ lat: 51.5074 });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Missing required query parameters: lat, lng, and radius are required.');
        });
    });

    // Test the GET /stations/:stationID/summary route
    describe('GET /stations/:stationID/summary', () => {
        it('should GET a summary of pollution records for a station', async () => {
            const station = await prisma.station.create({
                data: {
                    name: 'Summary Station',
                    latitude: 51.5074,
                    longitude: -0.1278,
                    records: {
                        create: [
                            { ts: 1000, nox: 10, no2: 5, no: 3, pm10: 20 },
                            { ts: 2000, nox: 20, no2: 15, no: 7 }
                        ]
                    }
                }
            });

            const res = await request(server).get(`/stations/${station.id}/summary`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('stationId', station.id);
            expect(res.body).toHaveProperty('name', 'Summary Station');
            expect(res.body).toHaveProperty('totalRecords', 2);
            expect(res.body.summary).toHaveProperty('nox');
            expect(res.body.summary.nox).toEqual({
                count: 2,
                avg: 15,
                min: 10,
                max: 20
            });
            expect(res.body.summary.pm10).toEqual({
                count: 1,
                avg: 20,
                min: 20,
                max: 20
            });
            expect(res.body.summary.co).toBeNull();
        });

        it('should return 404 for a non-existent station', async () => {
            const nonExistentId = crypto.randomUUID();
            const res = await request(server).get(`/stations/${nonExistentId}/summary`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Station not found');
        });
    });
});
