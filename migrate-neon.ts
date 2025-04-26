import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';

// Enable WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error('NEON_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log(`Connecting to Neon database and applying migrations...`);
  
  // Connect to database
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Create tables directly based on schema
    console.log('Creating tables in Neon database...');
    
    // Push the schema to the database (manual migration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        password TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS active_users (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        username TEXT NOT NULL,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(room_id, username)
      );
    `);
    
    console.log('Migration complete! Tables created in Neon database.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();