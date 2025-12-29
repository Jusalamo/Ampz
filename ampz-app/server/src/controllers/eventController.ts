import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createEvent = async (req: Request, res: Response) => {
    try {
        const { name, description, date, location, radius, organizerId } = req.body;

        const event = await prisma.event.create({
            data: {
                name,
                description,
                date: new Date(date),
                location,
                // In a real app, you might store radius in a separate field or JSON
                // For now we assume the schema supports it or we add it
                // radius: parseInt(radius), 
                // organizerId: parseInt(organizerId),
            },
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create event' });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch events' });
    }
};
