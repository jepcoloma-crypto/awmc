import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        next(Object.assign(new Error('Validation failed'), { statusCode: 400, details }));
        return;
      }
      next(err);
    }
  };
}
