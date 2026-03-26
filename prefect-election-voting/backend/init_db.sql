-- School Prefect Voting System - SQLite Schema

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

-- Prevent duplicate votes per teacher per position
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_vote_position
  ON votes(teacher_id, position)
  WHERE position IN ('headgirl', 'headboy');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_votes_teacher ON votes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);

-- Seed default admin users (passwords: admin123, it123, teacher123 - bcrypt hashed)
-- NOTE: Generate real hashes with bcrypt before production use.
-- These are placeholders; the server hashes on startup if needed.
INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@school.com', '$HASH_admin123', 'admin'),
  ('IT Administrator', 'it@school.com', '$HASH_it123', 'it_admin'),
  ('John Smith', 'john.smith@school.com', '$HASH_teacher123', 'teacher'),
  ('Jane Doe', 'jane.doe@school.com', '$HASH_teacher123', 'teacher');

-- Seed a default election
INSERT OR IGNORE INTO elections (year, status) VALUES ('2025-2026', 'open');
