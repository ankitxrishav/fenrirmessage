/**
 * This script initializes the Neon PostgreSQL database with the required tables for the chat application.
 * Run this script manually when deploying to a new environment to create the database schema.
 */

const { Pool } = require('@neondatabase/serverless');

async function initializeDatabase() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error('NEON_DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log(`Connecting to Neon database and creating tables...`);
  
  // Connect to database
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
  
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
        user_id INTEGER,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS active_users (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
        user_id INTEGER,
        username TEXT NOT NULL,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(room_id, username)
      );
    `);
    
    console.log('Database initialization complete! Tables created in Neon database.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeDatabase();