import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configure Neon to use WebSockets for serverless environments
neonConfig.webSocketConstructor = ws;

// Validate database URL format and use fallback if needed
let databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.startsWith('postgres://')) {
  console.log("Using Neon PostgreSQL database connection");
} else {
  console.log("Using local PostgreSQL database connection");
}

if (!databaseUrl) {
  throw new Error(
    "No database URL available. Please provide NEON_DATABASE_URL or DATABASE_URL environment variable.",
  );
}

console.log("Connecting to database...");
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });