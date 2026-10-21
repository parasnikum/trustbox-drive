import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export function handleDatabaseError(err: any): { status: number; message: string } {
  console.error('[Prisma Database Error]:', err.message || err);

  if (err.code === 'P1001' || err.message?.includes('Can\'t reach database server')) {
    return {
      status: 503,
      message: 'Database server unreachable. Please start PostgreSQL (e.g. run "docker-compose up -d postgres") and check DATABASE_URL in backend/.env.',
    };
  }

  if (err.code === 'P1000' || err.message?.includes('Authentication failed')) {
    return {
      status: 401,
      message: 'Database authentication failed. Please update DATABASE_URL in backend/.env with your valid PostgreSQL username and password.',
    };
  }

  if (err.code === 'P2021' || err.message?.includes('does not exist')) {
    return {
      status: 500,
      message: 'Database tables not initialized. Please run "npm run prisma:push" in the backend directory to create database tables.',
    };
  }

  return {
    status: 500,
    message: err.message || 'Database query error occurred.',
  };
}
