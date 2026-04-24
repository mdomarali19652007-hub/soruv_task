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
import { clerkMiddleware } from '@clerk/express';
import apiRoutes from '../src/server/routes.js';
import { corsOptions } from '../src/server/cors-config.js';

const app = express();

// Trust Vercel's proxy so rate-limit sees the real client IP.
app.set('trust proxy', 1);

app.use(cors(corsOptions));

// Clerk webhooks are handled by the Supabase Edge Function at
// `supabase/functions/clerk-webhook` (Deno, Svix-verified). No Express
// route for webhooks here.

app.use(express.json());
app.use(clerkMiddleware());

// Application API routes (registration, admin, etc.)
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
