import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../infrastructure/database/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    sessionId?: string;
  };
  sessionId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_TrustBox_2026';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      role: string;
      sessionId?: string;
    };

    if (decoded.sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return res.status(401).json({ error: 'Session revoked or expired. Please log in again.', code: 'SESSION_EXPIRED' });
      }

      req.sessionId = session.id;
    }

    req.user = decoded;
    next();
  } catch (err: any) {

    return res.status(401).json({ error: 'Access token expired or invalid.', code: 'TOKEN_EXPIRED' });
  }
}
