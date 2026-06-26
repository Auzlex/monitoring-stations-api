import loadEnv from './loadEnv';
loadEnv(); // Load and process environment variables

import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import stationRoutes from './api/routes/stations';
import recordRoutes from './api/routes/records';
import userRoutes from './api/routes/user';

const app = express();

// Guard: fail fast if critical environment variables are absent
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable not set');
    process.exit(1);
}

// Use 'combined' format in production for structured logs, 'dev' otherwise
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS — lock down to a configured origin in production
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    return next();
});

// Routes
app.use('/stations', stationRoutes);
app.use('/records', recordRoutes);
app.use('/user', userRoutes);

// 404 handler
app.use((_req: Request, res: Response, next: NextFunction) => {
    const error: any = new Error('Not found');
    error.status = 404;
    next(error);
});

// Global error handler
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(error.status || 500).json({
        error: { message: error.message }
    });
});

export default app;
