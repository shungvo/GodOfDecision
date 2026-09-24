import express from 'express';
import * as decisionController from '../controllers/decision.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/draw', decisionController.draw);

// The one route that spends model tokens, so the one that must know
// whose allowance they come out of. Draws stay open to guests.
router.post('/interpret', requireAuth, decisionController.interpret);

export default router;
