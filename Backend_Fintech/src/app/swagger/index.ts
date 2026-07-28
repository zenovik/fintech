import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config';
import { swaggerSpec } from './swagger.config';

export function setupSwagger(app: Application): void {
  if (env.nodeEnv === 'production') {
    return;
  }
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
}
