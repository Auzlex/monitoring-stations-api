import express, { Request, Response } from 'express';
import { prisma } from '../../db';
import checkAuth from '../middleware/check-auth';

const router = express.Router();

/* 
    Station Metadata
*/

// GET /stations
router.get("/", async (req: Request, res: Response) => {
    try {
        const stations = await prisma.station.findMany({
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true
            }
        });

        const port = process.env.SERVER_PORT || process.env.PORT || 7000;
        const response = {
            count: stations.length,
            stations: stations.map(station => ({
                _id: station.id,
                name: station.name,
                latitude: station.latitude,
                longitude: station.longitude,
                request: {
                    type: "GET",
                    url: `http://localhost:${port}/stations/${station.id}`
                }
            }))
        };
        return res.status(200).json(response);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// GET /stations/nearest (Define BEFORE :stationID route to prevent conflicts)
router.get("/nearest", async (req: Request, res: Response) => {
    const { lat, lng, radius } = req.query;

    if (lat === undefined || lng === undefined || radius === undefined) {
        return res.status(400).json({
            message: "Missing required query parameters: lat, lng, and radius are required."
        });
    }

    const latVal = Number(lat);
    const lngVal = Number(lng);
    const radiusVal = Number(radius);

    if (isNaN(latVal) || isNaN(lngVal) || isNaN(radiusVal)) {
        return res.status(400).json({
            message: "Invalid query parameters: lat, lng, and radius must be valid numbers."
        });
    }

    if (radiusVal <= 0) {
        return res.status(400).json({
            message: "Invalid query parameter: radius must be a positive number."
        });
    }

    try {
        const stations = await prisma.station.findMany();

        const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const matchingStations = stations
            .map(station => {
                const distance = getDistance(latVal, lngVal, station.latitude, station.longitude);
                return {
                    _id: station.id,
                    name: station.name,
                    latitude: station.latitude,
                    longitude: station.longitude,
                    distance: Number(distance.toFixed(2))
                };
            })
            .filter(station => station.distance <= radiusVal)
            .sort((a, b) => a.distance - b.distance);

        return res.status(200).json({
            count: matchingStations.length,
            stations: matchingStations
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// GET /stations/:stationID
router.get("/:stationID", async (req: Request, res: Response) => {
    const id = req.params.stationID;
    try {
        const station = await prisma.station.findUnique({
            where: { id },
            include: { records: true }
        });

        if (station) {
            return res.status(200).json({
                _id: station.id,
                name: station.name,
                latitude: station.latitude,
                longitude: station.longitude,
                records: station.records.map(record => ({
                    _id: record.id,
                    ts: record.ts,
                    nox: record.nox,
                    no2: record.no2,
                    no: record.no,
                    pm10: record.pm10,
                    co: record.co,
                    o3: record.o3,
                    so2: record.so2
                }))
            });
        } else {
            return res.status(404).json({ message: "Station not found" });
        }
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// POST /stations
router.post("/", checkAuth, async (req: Request, res: Response) => {
    const { name, latitude, longitude } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            message: "Station validation failed: name, latitude, and longitude are required."
        });
    }

    if (isNaN(Number(latitude)) || isNaN(Number(longitude))) {
        return res.status(400).json({
            message: "Station validation failed: latitude and longitude must be numbers."
        });
    }

    try {
        const result = await prisma.station.create({
            data: {
                name,
                latitude: Number(latitude),
                longitude: Number(longitude)
            }
        });

        return res.status(201).json({
            message: "Station created successfully",
            createdStation: {
                _id: result.id,
                name: result.name,
                latitude: result.latitude,
                longitude: result.longitude,
                records: []
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// PATCH /stations/:stationID
router.patch("/:stationID", checkAuth, async (req: Request, res: Response) => {
    const id = req.params.stationID;
    const { name } = req.body;

    const validNameRegex = /^[a-zA-Z0-9 ]+$/;

    if (!name || !validNameRegex.test(name)) {
        return res.status(400).json({
            message: "Invalid name. Only upper and lower case letters and numbers are allowed."
        });
    }

    try {
        const stationExists = await prisma.station.findUnique({ where: { id } });
        if (!stationExists) {
            return res.status(404).json({ message: "Station not found" });
        }

        await prisma.station.update({
            where: { id },
            data: { name }
        });

        const port = process.env.SERVER_PORT || process.env.PORT || 7000;
        return res.status(200).json({
            message: "Station updated successfully",
            updatedStation: {
                matchedCount: 1,
                modifiedCount: 1
            },
            request: {
                type: "GET",
                url: `http://localhost:${port}/stations/${id}`
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// DELETE /stations/:stationID
router.delete("/:stationID", checkAuth, async (req: Request, res: Response) => {
    const id = req.params.stationID;

    try {
        const stationExists = await prisma.station.findUnique({ where: { id } });
        if (!stationExists) {
            return res.status(404).json({ message: "Station not found" });
        }

        await prisma.station.delete({ where: { id } });

        return res.status(200).json({
            message: "Station deleted successfully"
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

/* 
    Pollution Records
*/

// GET /stations/:stationID/records
router.get("/:stationID/records", async (req: Request, res: Response) => {
    const id = req.params.stationID;

    try {
        const station = await prisma.station.findUnique({
            where: { id },
            select: { records: true }
        });

        if (station) {
            return res.status(200).json({
                message: `Found ${station.records.length} records`,
                records: station.records.map(record => ({
                    _id: record.id,
                    ts: record.ts,
                    nox: record.nox,
                    no2: record.no2,
                    no: record.no,
                    pm10: record.pm10,
                    co: record.co,
                    o3: record.o3,
                    so2: record.so2
                }))
            });
        } else {
            return res.status(404).json({ message: "Station not found" });
        }
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// POST /stations/:stationID/records
router.post("/:stationID/records", checkAuth, async (req: Request, res: Response) => {
    const id = req.params.stationID;
    const { ts, nox, no2, no, pm10, co, o3, so2 } = req.body;

    // Validate required fields
    if (ts === undefined || nox === undefined || no2 === undefined || no === undefined) {
        return res.status(400).json({
            message: "Missing required fields: ts, nox, no2, and no are required."
        });
    }

    // Validate that required fields are numbers
    if (isNaN(Number(ts)) || isNaN(Number(nox)) || isNaN(Number(no2)) || isNaN(Number(no))) {
        return res.status(400).json({
            message: "Invalid input: ts, nox, no2, and no must be numbers."
        });
    }

    // Validate optional fields if they are provided
    const optionalFields = ['pm10', 'co', 'o3', 'so2'];
    for (const field of optionalFields) {
        if (req.body[field] !== undefined && isNaN(Number(req.body[field]))) {
            return res.status(400).json({
                message: `Invalid input: ${field} must be a number if provided.`
            });
        }
    }

    try {
        const station = await prisma.station.findUnique({ where: { id } });
        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        await prisma.record.create({
            data: {
                ts: Number(ts),
                nox: Number(nox),
                no2: Number(no2),
                no: Number(no),
                pm10: pm10 !== undefined ? Number(pm10) : null,
                co: co !== undefined ? Number(co) : null,
                o3: o3 !== undefined ? Number(o3) : null,
                so2: so2 !== undefined ? Number(so2) : null,
                stationId: id
            }
        });

        const updatedStation = await prisma.station.findUnique({
            where: { id },
            include: { records: true }
        });

        if (!updatedStation) {
            return res.status(500).json({ message: "Error retrieving updated station records" });
        }

        const port = process.env.PORT || 7000;
        return res.status(201).json({
            message: "Record added successfully",
            updatedStation: {
                _id: updatedStation.id,
                name: updatedStation.name,
                latitude: updatedStation.latitude,
                longitude: updatedStation.longitude,
                records: updatedStation.records.map(record => ({
                    _id: record.id,
                    ts: record.ts,
                    nox: record.nox,
                    no2: record.no2,
                    no: record.no,
                    pm10: record.pm10,
                    co: record.co,
                    o3: record.o3,
                    so2: record.so2
                }))
            },
            request: {
                type: "GET",
                url: `http://localhost:${port}/stations/${id}`
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

// GET /stations/:id/summary
router.get("/:stationID/summary", async (req: Request, res: Response) => {
    const id = req.params.stationID;

    try {
        const station = await prisma.station.findUnique({
            where: { id },
            include: { records: true }
        });

        if (!station) {
            return res.status(404).json({ message: "Station not found" });
        }

        const totalRecords = station.records.length;
        const summary: Record<string, any> = {};

        const pollutants = ['nox', 'no2', 'no', 'pm10', 'co', 'o3', 'so2'];

        pollutants.forEach(p => {
            const values = station.records
                .map(r => r[p as keyof typeof r])
                .filter(v => v !== null && v !== undefined) as number[];

            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);

                summary[p] = {
                    count: values.length,
                    avg: Number(avg.toFixed(2)),
                    min: Number(min.toFixed(2)),
                    max: Number(max.toFixed(2))
                };
            } else {
                summary[p] = null;
            }
        });

        return res.status(200).json({
            stationId: station.id,
            name: station.name,
            totalRecords,
            summary
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || err });
    }
});

export default router;
