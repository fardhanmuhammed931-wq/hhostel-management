import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitRecord>();

export function rateLimiter(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-ip';
    const now = Date.now();

    const record = ipMap.get(ip);

    if (!record || now > record.resetTime) {
      ipMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retrySec = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: `Too many requests from this IP. Please try again after ${retrySec} seconds.`,
      });
      return;
    }

    record.count++;
    next();
  };
}
