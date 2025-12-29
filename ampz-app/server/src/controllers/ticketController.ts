import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to generate a unique QR string
const generateUniqueQR = () => {
    // Generates a random string like "AMPZ-8a7b9c-1234567890"
    const randomPart = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    return `AMPZ-${randomPart}-${timestamp}`;
};

export const purchaseTicket = async (req: Request, res: Response) => {
    try {
        const { userId, eventId, price } = req.body;

        // Generate a unique QR code
        let qrCode = generateUniqueQR();

        // Ensure uniqueness (double check against DB)
        let isUnique = false;
        while (!isUnique) {
            const existing = await prisma.ticket.findUnique({ where: { qrCode } });
            if (!existing) {
                isUnique = true;
            } else {
                qrCode = generateUniqueQR();
            }
        }

        const ticket = await prisma.ticket.create({
            data: {
                userId,
                eventId,
                price,
                qrCode, // This is the unique code
                status: 'active',
            },
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to purchase ticket' });
    }
};

export const getMyTickets = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const tickets = await prisma.ticket.findMany({
            where: { userId: parseInt(userId) },
            include: { event: true },
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};
