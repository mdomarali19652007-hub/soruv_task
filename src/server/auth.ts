import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import dotenv from 'dotenv';

dotenv.config();

// Validate DATABASE_URL before initializing Better Auth
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    '\n[Auth Error] DATABASE_URL environment variable is missing!\n' +
    'Better Auth requires a direct Postgres connection string from Supabase.\n\n' +
    'To fix this:\n' +
    '  1. Go to your Supabase dashboard > Settings > Database\n' +
    '  2. Copy the "Connection string" (URI format)\n' +
    '  3. Add it to your .env file as:\n' +
    '     DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n\n' +
    'Note: This is NOT the same as VITE_SUPABASE_URL (REST API). It is the direct Postgres connection.\n'
  );
  process.exit(1);
}

/**
 * Better Auth server instance.
 *
 * Uses Supabase Postgres as the database backend via the connection string.
 * Tables are prefixed with "ba_" to avoid conflicts with existing app tables.
 *
 * Environment variables required:
 *   BETTER_AUTH_SECRET        - Secret key for signing sessions/tokens
 *   DATABASE_URL              - Supabase Postgres connection string (direct, not REST API)
 *   BETTER_AUTH_URL           - Public URL of the server (e.g. http://localhost:3000)
 *   GOOGLE_CLIENT_ID          - Google OAuth client ID
 *   GOOGLE_CLIENT_SECRET      - Google OAuth client secret
 */
export const auth = betterAuth({
  database: {
    type: 'postgres',
    url: databaseUrl,
  },
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We handle verification in-app for now
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },

  // Session configuration -- DB-backed for instant revocation
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session age every 24 hours
  },

  // Admin plugin for user management
  plugins: [
    admin({
      defaultRole: 'user',
    }),
  ],

  // User model additional fields
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
    },
  },

  // Hooks for user lifecycle events
  databaseHooks: {
    user: {
      create: {
        // After Better Auth creates the user, we'll handle app-specific
        // profile creation in our custom registration endpoint
        after: async (user) => {
          console.log(`[Auth] User created: ${user.id} (${user.email})`);
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          console.log(`[Auth] Session created for user: ${session.userId}`);
        },
      },
    },
  },

  // Trust the proxy headers in production
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ],
});

export type Auth = typeof auth;
