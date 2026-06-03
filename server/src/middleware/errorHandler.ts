import { type Request, type Response, type NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err.statusCode) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error('[UNHANDLED ERROR]', err);

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}
