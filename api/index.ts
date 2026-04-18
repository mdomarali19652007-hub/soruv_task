/**
 * Vercel Serverless Function entry point.
 *
 * Wraps the Express app so all /api/* routes work as a single
 * serverless function on Vercel.  The static frontend is served
 * by Vercel's CDN from the Vite build output (dist/).
 *
 * NOTE: Socket.io (WebSockets) is NOT supported on Vercel serverless.
 * The Ludo game multiplayer features require a persistent server
 * (e.g. Railway, Render, Fly.io) or a separate WebSocket service.
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../src/server/auth.js';
import apiRoutes from '../src/server/routes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Better Auth handler -- handles all /api/auth/* routes
app.all('/api/auth/*', toNodeHandler(auth));

// Application API routes (registration, admin, etc.)
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
