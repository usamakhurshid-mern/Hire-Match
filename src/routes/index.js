import { Router } from 'express';
import healthRoutes from './health.routes.js';
import matchRoutes from './match.routes.js';
import { rapidApiAuth } from '../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use('/v1', healthRoutes);

router.use('/v1', rapidApiAuth, rateLimitMiddleware, matchRoutes);

export default router;
