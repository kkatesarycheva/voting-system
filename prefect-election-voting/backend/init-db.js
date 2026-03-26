const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "voting.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
const schema = `
CREATE TABLE IF NOT EXISTS elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK(role IN ('teacher', 'admin', 'it_admin')),
  has_voted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  photo TEXT DEFAULT '',
  year TEXT DEFAULT '',
  election_id INTEGER,
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  position TEXT NOT NULL CHECK(position IN ('headgirl', 'headboy', 'prefect')),
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
`;

db.exec(schema);

// Seed users with hashed passwords
const users = [
  { name: "Admin", email: "admin@school.com", password: "admin123", role: "admin" },
  { name: "IT Administrator", email: "it@school.com", password: "it123", role: "it_admin" },
  { name: "John Smith", email: "john.smith@school.com", password: "teacher123", role: "teacher" },
  { name: "Jane Doe", email: "jane.doe@school.com", password: "teacher123", role: "teacher" },
];

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.name, u.email, hash, u.role);
}

// Seed election
db.prepare("INSERT OR IGNORE INTO elections (id, year, status) VALUES (1, '2025-2026', 'open')").run();

console.log(`Database initialized at ${DB_PATH}`);
db.close();
