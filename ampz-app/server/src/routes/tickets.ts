import express from 'express';
import { purchaseTicket, getMyTickets } from '../controllers/ticketController';

const router = express.Router();

router.post('/purchase', purchaseTicket);
router.get('/user/:userId', getMyTickets);

export default router;
