import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users, passes, notifications } from '@shared/schema';

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool);

// Test database connection on startup
export async function testConnection() {
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export { users, passes, notifications };