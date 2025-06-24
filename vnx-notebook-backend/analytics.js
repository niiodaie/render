import express from 'express';
import { analyticsController } from '../controllers/analyticsController.js';

const router = express.Router();

// POST /api/analytics/track - Track an analytics event
router.post('/track', analyticsController.trackEvent);

// GET /api/analytics/summary - Get analytics summary
router.get('/summary', analyticsController.getAnalyticsSummary);

// GET /api/analytics/tags - Get popular tags
router.get('/tags', analyticsController.getPopularTags);

// GET /api/analytics/stats - Get usage statistics
router.get('/stats', analyticsController.getUsageStats);

export default router;

