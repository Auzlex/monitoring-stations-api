import express, { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db';

const router = express.Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    const fromQuery = req.query.from;
    const toQuery = req.query.to;
    const limitQuery = req.query.limit;
    const pollutant = req.query.pollutant as string | undefined;

    const from = fromQuery ? parseInt(fromQuery as string, 10) : null;
    const to = toQuery ? parseInt(toQuery as string, 10) : null;
    const limit = limitQuery ? parseInt(limitQuery as string, 10) : null;

    // Validate query parameters
    if (fromQuery && isNaN(from as number)) {
        return res.status(400).json({
            message: "Invalid 'from' timestamp. Must be a valid number."
        });
    }

    if (toQuery && isNaN(to as number)) {
        return res.status(400).json({
            message: "Invalid 'to' timestamp. Must be a valid number."
        });
    }

    if (from !== null && to !== null && from > to) {
        return res.status(400).json({
            message: "'from' timestamp must be before 'to' timestamp."
        });
    }

    if (limitQuery && (isNaN(limit as number) || (limit as number) <= 0)) {
        return res.status(400).json({
            message: "Invalid 'limit'. Must be a positive number."
        });
    }

    const validPollutants = ['nox', 'no2', 'no', 'pm10', 'co', 'o3', 'so2'];
    if (pollutant && !validPollutants.includes(pollutant)) {
        return res.status(400).json({
            message: "Invalid pollutant type. Must be one of: nox, no2, no, pm10, co, o3, so2"
        });
    }

    try {
        const stations = await prisma.station.findMany({
            include: {
                records: true
            }
        });

        let allRecords: any[] = [];
        stations.forEach(station => {
            station.records.forEach(record => {
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
        if (from !== null) {
            allRecords = allRecords.filter(record => record.ts >= from);
        }
        if (to !== null) {
            allRecords = allRecords.filter(record => record.ts <= to);
        }
        if (pollutant) {
            allRecords = allRecords.filter(record => pollutant in record);
        }

        // Sort by timestamp in descending order (newest first)
        allRecords.sort((a, b) => b.ts - a.ts);

        // Apply limit if provided
        if (limit !== null) {
            allRecords = allRecords.slice(0, limit);
        }

        return res.status(200).json({
            count: allRecords.length,
            records: allRecords
        });
    } catch (err: any) {
        return next(err);
    }
});

export default router;
