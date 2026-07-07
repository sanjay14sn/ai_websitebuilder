import express from 'express';
import { getAnalytics, recordEvent } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAnalytics);
router.post('/record', recordEvent); // Public endpoint for logging hits/interactions

export default router;
