import express from 'express';
import * as tarotController from '../controllers/tarot.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/cards', tarotController.listCards);
router.get('/cards/:slug', tarotController.getCard);
router.get('/topics', tarotController.listTopics);

router.post('/draw', tarotController.draw);

// The one route that spends model tokens, so the one that must know
// whose allowance they come out of. Draws stay open to guests.
router.post('/interpret', requireAuth, tarotController.interpret);

export default router;
