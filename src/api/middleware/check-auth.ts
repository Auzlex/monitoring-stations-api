import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthRequest extends Request {
    userData?: JwtPayload;
}

export default (req: AuthRequest, res: Response, next: NextFunction): void => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ message: 'Server misconfiguration: JWT secret not set.' });
        return;
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Not authed.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.userData = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Not authed.' });
    }
};
