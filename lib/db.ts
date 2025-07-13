import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'enrolled.db');

console.log('🗄️ SQLite database path:', dbPath);

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS enrolled_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Database table initialized');

export interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
}

export function getAllUsers(): EnrolledUser[] {
  console.log('📋 Fetching all enrolled users from database');
  const stmt = db.prepare('SELECT * FROM enrolled_users ORDER BY enrolled_at DESC');
  const users = stmt.all() as EnrolledUser[];
  console.log(`✅ Found ${users.length} users`);
  return users;
}

export function getUserByEmail(email: string): EnrolledUser | undefined {
  console.log('🔍 Checking if user exists:', email);
  const stmt = db.prepare('SELECT * FROM enrolled_users WHERE email = ?');
  const user = stmt.get(email) as EnrolledUser | undefined;
  console.log('👤 User found:', !!user);
  return user;
}

export function addUser(user: Omit<EnrolledUser, 'enrolled_at'>): boolean {
  console.log('➕ Adding new user to database:', { name: user.name, email: user.email });
  
  try {
    const stmt = db.prepare(`
      INSERT INTO enrolled_users (id, name, email)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(user.id, user.name, user.email);
    console.log('✅ User added successfully, rows affected:', result.changes);
    return result.changes > 0;
  } catch (error) {
    console.error('❌ Failed to add user:', error);
    return false;
  }
}

export function getUserCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM enrolled_users');
  const result = stmt.get() as { count: number };
  return result.count;
}

export default db;