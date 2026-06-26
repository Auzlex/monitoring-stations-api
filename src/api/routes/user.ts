import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';

const router = express.Router();

// Fetch admin email from environment variables (fallback to default)
const getAdminEmail = (): string => {
    return process.env.ENDPOINT_ADMIN_ACCESS_EMAIL || 'admin@example.com';
};

export const ensureAdmin = async (): Promise<void> => {
    try {
        const adminEmail = getAdminEmail();
        const adminPassword = process.env.ENDPOINT_ADMIN_ACCESS_PASSWORD;

        if (!adminPassword) {
            console.warn('Admin password not set in environment variable.');
            return;
        }

        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (!existingAdmin) {
            await prisma.user.create({ data: { email: adminEmail, password: hashedPassword } });
            console.log('Admin user created.');
        } else {
            const passwordMatches = await bcrypt.compare(adminPassword, existingAdmin.password);
            if (!passwordMatches) {
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { password: hashedPassword }
                });
                console.log('Admin password updated.');
            }
        }
    } catch (err) {
        console.error('Error creating/updating admin user:', err);
    }
};

// Call on startup
ensureAdmin();

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ message: 'Server misconfiguration: JWT secret not set.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const adminEmail = getAdminEmail();
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.email === adminEmail ? 'admin' : 'user' },
            secret,
            { expiresIn: '1h' }
        );

        return res.json({ token });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return res.status(500).json({ error: message });
    }
});

export default router;
