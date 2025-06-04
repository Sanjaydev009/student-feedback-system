// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { IUser } from '../interfaces/User';
// import Student from '../models/User';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: IUser;
//     }
//   }
// }

// export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   let token;

//   // Get token from header
//   token = req.headers.authorization?.split(' ')[1];

//   if (!token) {
//     res.status(401).json({ message: 'Not authorized, no token' });
//     return;
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

//     // Get user from DB
//     const user = await Student.findById(decoded.id);

//     if (!user) {
//       res.status(404).json({ message: 'User not found' });
//       return;
//     }

//     // Attach user to request
//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Not authorized, token failed' });
//     return;
//   }
// };

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    res.status(401).json({ message: 'No token, not authorized' });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};