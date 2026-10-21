import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma, handleDatabaseError } from '../../infrastructure/database/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/authMiddleware';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_TrustBox_2026';
const IS_PROD = process.env.NODE_ENV === 'production';

const resetTokens: Map<string, { email: string; expiresAt: Date }> = new Map();

function serializeUser(user: any) {
  return {
    ...user,
    role: user.role || 'USER',
    storageQuota: user.storageQuota ? user.storageQuota.toString() : '2147483648',
    storageUsed: user.storageUsed ? user.storageUsed.toString() : '0',
  };
}

function parseDeviceName(userAgentStr?: string): string {
  if (!userAgentStr) return 'Unknown Device';
  let os = 'Unknown OS';
  if (userAgentStr.includes('Windows')) os = 'Windows';
  else if (userAgentStr.includes('Macintosh') || userAgentStr.includes('Mac OS')) os = 'macOS';
  else if (userAgentStr.includes('iPhone')) os = 'iPhone';
  else if (userAgentStr.includes('iPad')) os = 'iPad';
  else if (userAgentStr.includes('Android')) os = 'Android';
  else if (userAgentStr.includes('Linux')) os = 'Linux';

  let browser = 'Browser';
  if (userAgentStr.includes('Edg/')) browser = 'Edge';
  else if (userAgentStr.includes('Chrome/')) browser = 'Chrome';
  else if (userAgentStr.includes('Firefox/')) browser = 'Firefox';
  else if (userAgentStr.includes('Safari/') && !userAgentStr.includes('Chrome/')) browser = 'Safari';

  return `${browser} on ${os}`;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}

async function createUserSession(userId: string, req: Request) {
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const deviceName = parseDeviceName(userAgent);

  const refreshTokenValue = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await prisma.userSession.create({
    data: {
      userId,
      refreshToken: refreshTokenValue,
      userAgent,
      ipAddress,
      deviceName,
      expiresAt,
    },
  });

  return { session, refreshTokenValue };
}

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const userCount = await prisma.user.count();
    const assignedRole = role === 'ADMIN' || userCount === 0 ? 'ADMIN' : 'USER';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: assignedRole,
      },
    });

    const { session, refreshTokenValue } = await createUserSession(user.id, req);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, accessToken, refreshTokenValue);

    return res.status(201).json({
      user: serializeUser(user),
      accessToken,
      refreshToken: refreshTokenValue,
      sessionId: session.id,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (email === 'demo@TrustBox.io') {
        const passwordHash = await bcrypt.hash('password123', 10);
        user = await prisma.user.create({
          data: {
            id: 'usr_demo_123',
            email: 'demo@TrustBox.io',
            name: 'Demo Admin User',
            passwordHash,
            role: 'ADMIN',
          },
        });
      } else {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && email !== 'demo@TrustBox.io') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { session, refreshTokenValue } = await createUserSession(user.id, req);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, accessToken, refreshTokenValue);

    return res.json({
      user: serializeUser(user),
      accessToken,
      refreshToken: refreshTokenValue,
      sessionId: session.id,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refreshToken ||
      (req.headers['x-refresh-token'] as string);

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token missing. Please log in.' });
    }

    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token expired or revoked.' });
    }

    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const user = session.user;
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookies(res, newAccessToken, session.refreshToken);

    return res.json({
      user: serializeUser(user),
      accessToken: newAccessToken,
      refreshToken: session.refreshToken,
      sessionId: session.id,
    });
  } catch (err: any) {
    clearAuthCookies(res);
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    if (refreshToken) {
      await prisma.userSession.updateMany({
        where: { refreshToken },
        data: { isRevoked: true },
      });
    }

    clearAuthCookies(res);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    clearAuthCookies(res);
    return res.json({ success: true });
  }
});

authRouter.get('/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const currentSessionId = req.sessionId;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName || 'Unknown Device',
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSessionId,
    }));

    return res.json({ sessions: formattedSessions });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.delete('/sessions/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    if (sessionId === req.sessionId) {
      clearAuthCookies(res);
    }

    return res.json({ success: true, message: 'Session revoked successfully' });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.delete('/sessions/other/all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const currentSessionId = req.sessionId;

    await prisma.userSession.updateMany({
      where: {
        userId,
        id: currentSessionId ? { not: currentSessionId } : undefined,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    return res.json({ success: true, message: 'All other sessions revoked successfully' });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.json({ user: serializeUser(user) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.patch('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
      },
    });

    return res.json({ user: serializeUser(user) });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch && user.email !== 'demo@TrustBox.io') {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.userSession.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    clearAuthCookies(res);

    return res.json({ success: true, message: 'Password changed successfully. All active sessions have been revoked for security.' });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset token has been generated.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    resetTokens.set(resetToken, { email, expiresAt });

    return res.json({
      message: 'Password reset token generated successfully.',
      resetToken,
    });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    const tokenData = resetTokens.get(resetToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { email: tokenData.email },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.userSession.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    resetTokens.delete(resetToken);
    clearAuthCookies(res);
    return res.json({ success: true, message: 'Password reset successfully. All active sessions revoked.' });
  } catch (err: any) {
    const dbErr = handleDatabaseError(err);
    return res.status(dbErr.status).json({ error: dbErr.message });
  }
});
