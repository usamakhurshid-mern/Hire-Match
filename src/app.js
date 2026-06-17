import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';
import * as usageRepo from './repositories/usage.repository.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.locals.logRequest && res.locals.user) {
      usageRepo
        .logRequest({
          userId: res.locals.user.id,
          endpoint: res.locals.logRequest.endpoint,
          method: req.method,
          statusCode: res.locals.logRequest.statusCode,
          latencyMs: res.locals.logRequest.latencyMs,
          requestId: res.locals.requestId,
          planName: res.locals.plan?.name,
        })
        .catch(() => {});
    }
  });
  next();
});

app.use(routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'HireMatch API',
      version: '1.0.0',
      docs: '/v1/health',
    },
    requestId: res.locals.requestId,
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
