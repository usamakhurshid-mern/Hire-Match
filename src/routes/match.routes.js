import { Router } from 'express';
import { scoreMatch, getUsage } from '../controllers/match.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { quotaMiddleware } from '../middleware/quota.middleware.js';
import { matchScoreSchema } from '../validators/match.validator.js';

const router = Router();

router.post('/match/score', quotaMiddleware, validateBody(matchScoreSchema), scoreMatch);
router.get('/usage', getUsage);

export default router;
