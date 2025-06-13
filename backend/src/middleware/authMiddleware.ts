import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

export const protect = (req: any, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
        branch?: string;
      };
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied' });
};