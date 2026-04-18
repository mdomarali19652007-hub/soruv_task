import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins/admin';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// Environment validation
// ============================================================

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
    'Note: This is NOT the same as VITE_SUPABASE_URL (REST API). It is the direct Postgres connection.\n' +
    'Important: If your password contains special characters (%, @, #), URL-encode them.\n' +
    '           For example: % becomes %25, @ becomes %40\n'
  );
  process.exit(1);
}

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  console.error(
    '\n[Auth Error] BETTER_AUTH_SECRET must be at least 32 characters.\n' +
    'Generate one with: openssl rand -base64 32\n' +
    `Current length: ${authSecret?.length || 0}\n`
  );
  process.exit(1);
}

// ============================================================
// Better Auth server instance
//
// Uses Supabase Postgres via the `pg` Pool adapter.
// Docs: https://better-auth.com/docs/adapters/postgresql
//
// After modifying this config or adding plugins, run:
//   npx @better-auth/cli@latest migrate
//
// Verify setup with: GET /api/auth/ok -> { status: "ok" }
//
// Environment variables required:
//   BETTER_AUTH_SECRET        - Min 32 chars. Generate: openssl rand -base64 32
//   DATABASE_URL              - Supabase Postgres connection string (direct, not REST)
//   BETTER_AUTH_URL           - Public URL (e.g. http://localhost:3000)
//   GOOGLE_CLIENT_ID          - Google OAuth client ID
//   GOOGLE_CLIENT_SECRET      - Google OAuth client secret
// ============================================================

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
  }),

  // Only define secret/baseURL if env vars are NOT set (per best practices skill)
  // Since we validated above, we can pass them directly
  secret: authSecret,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',

  // Email + password authentication
  emailAndPassword: {
    enabled: true,
  },

  // Google OAuth -- warn at startup if credentials are missing
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : (() => {
          console.warn(
            '\n[Auth Warning] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.\n' +
            'Google OAuth sign-in will be unavailable.\n' +
            'Set both environment variables to enable Google login.\n'
          );
          return {};
        })()),
  },

  // Session configuration -- DB-backed for instant revocation
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache before re-validating from DB
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh session age every 24 hours
  },

  // Admin plugin for user management (ban, revoke sessions, etc.)
  // Import from dedicated path for tree-shaking per best practices
  plugins: [
    admin({
      defaultRole: 'user',
    }),
  ],

  // User model additional fields tracked by Better Auth
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false,
      },
    },
  },

  // Database hooks for lifecycle events
  databaseHooks: {
    user: {
      create: {
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

  // CSRF trusted origins
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  ],
});

export type Auth = typeof auth;
