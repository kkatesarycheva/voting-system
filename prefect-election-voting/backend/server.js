const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const path = require("path");
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Photo upload storage configuration
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const photoUpload = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const DB_PATH = path.join(__dirname, "voting.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

app.use(cors());
app.use(express.json());


// Serve uploaded photos as static files
app.use("uploads", express.static(path.join(__dirname, "uploads")));

// ─── Auth Middleware ───────────────────────────────────────────────
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// ─── POST /api/login ──────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, has_voted: !!user.has_voted },
  });
});

// ─── GET /api/candidates ─────────────────────────────────────────
app.get("/api/candidates", authenticate, (req, res) => {
  const election = db.prepare("SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.json([]);

  const candidates = db.prepare("SELECT * FROM candidates WHERE election_id = ? ORDER BY name").all(election.id);
  res.json(candidates);
});

// ─── POST /api/candidates ────────────────────────────────────────
app.post("/api/candidates", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  const { name, photo, year } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const election = db.prepare("SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.status(400).json({ error: "No open election" });

  const result = db.prepare(
    "INSERT INTO candidates (name, photo, year, election_id) VALUES (?, ?, ?, ?)"
  ).run(name, photo || "", year || "", election.id);

  res.status(201).json({ id: result.lastInsertRowid, name, photo: photo || "", year: year || "" });
});

// ─── DELETE /api/candidates/:id ──────────────────────────────────
app.delete("/api/candidates/:id", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  db.prepare("DELETE FROM candidates WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ─── POST /api/vote ──────────────────────────────────────────────
app.post("/api/vote", authenticate, (req, res) => {
  const { headgirl, headboy, prefects } = req.body;
  const userId = req.user.id;

  // Check if already voted
  const user = db.prepare("SELECT has_voted FROM users WHERE id = ?").get(userId);
  if (user.has_voted) return res.status(400).json({ error: "You have already voted" });

  // Check election is open
  const election = db.prepare("SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.status(400).json({ error: "Voting is closed" });

  const insertVote = db.prepare(
    "INSERT INTO votes (teacher_id, candidate_id, position) VALUES (?, ?, ?)"
  );

  const submitAll = db.transaction(() => {
    if (headgirl) insertVote.run(userId, headgirl, "headgirl");
    if (headboy) insertVote.run(userId, headboy, "headboy");
    if (Array.isArray(prefects)) {
      for (const p of prefects) {
        insertVote.run(userId, p, "prefect");
      }
    }
    db.prepare("UPDATE users SET has_voted = 1 WHERE id = ?").run(userId);
  });

  try {
    submitAll();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/results ────────────────────────────────────────────
app.get("/api/results", authenticate, requireRole("admin"), (req, res) => {
  const election = db.prepare("SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.json({ headgirl: [], headboy: [], prefects: [] });

  const query = `
    SELECT c.name, v.position, COUNT(*) as vote_count
    FROM votes v
    JOIN candidates c ON c.id = v.candidate_id
    WHERE c.election_id = ?
    GROUP BY v.candidate_id, v.position
    ORDER BY vote_count DESC
  `;
  const rows = db.prepare(query).all(election.id);

  const results = { headgirl: [], headboy: [], prefects: [] };
  for (const r of rows) {
    const entry = { name: r.name, votes: r.vote_count };
    if (r.position === "headgirl") results.headgirl.push(entry);
    else if (r.position === "headboy") results.headboy.push(entry);
    else if (r.position === "prefect") results.prefects.push(entry);
  }

  // Turnout
  const total = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'teacher'").get().c;
  const voted = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'teacher' AND has_voted = 1").get().c;

  res.json({ ...results, turnout: { total, voted } });
});

// ─── POST /api/election/reset ────────────────────────────────────
app.post("/api/election/reset", authenticate, requireRole("admin"), (req, res) => {
  const { year } = req.body;

  const resetAll = db.transaction(() => {
    // Close current election
    db.prepare("UPDATE elections SET status = 'closed' WHERE status = 'open'").run();
    // Create new election
    const result = db.prepare("INSERT INTO elections (year, status) VALUES (?, 'open')").run(year || "New Election");
    // Reset teacher votes
    db.prepare("UPDATE users SET has_voted = 0 WHERE role = 'teacher'").run();
    // Delete old votes (optional — keeps history in closed elections)
    return result.lastInsertRowid;
  });

  try {
    const newId = resetAll();
    res.json({ success: true, election_id: newId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/election/toggle ───────────────────────────────────
app.post("/api/election/toggle", authenticate, requireRole("admin"), (req, res) => {
  const election = db.prepare("SELECT * FROM elections ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.status(400).json({ error: "No election found" });

  const newStatus = election.status === "open" ? "closed" : "open";
  db.prepare("UPDATE elections SET status = ? WHERE id = ?").run(newStatus, election.id);
  res.json({ status: newStatus });
});

// ─── GET /api/teachers ───────────────────────────────────────────
app.get("/api/teachers", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  const teachers = db.prepare("SELECT id, name, email, has_voted FROM users WHERE role = 'teacher' ORDER BY name").all();
  res.json(teachers);
});

// ─── POST /api/teachers ─────────────────────────────────────────
app.post("/api/teachers", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  const { name, email, password } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const hash = bcrypt.hashSync(password || "teacher123", 10);
  const teacherName = name || email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, l => l.toUpperCase());

  try {
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'teacher')"
    ).run(teacherName, email, hash);
    res.status(201).json({ id: result.lastInsertRowid, name: teacherName, email, has_voted: false });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// ─── DELETE /api/teachers/:id ────────────────────────────────────
app.delete("/api/teachers/:id", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ? AND role = 'teacher'").run(req.params.id);
  res.json({ success: true });
});

// ─── POST /api/candidates/parse-xlsx ─────────────────────────────
app.post("/api/candidates/parse-xlsx", authenticate, requireRole("admin", "it_admin"), upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const candidates = rows
      .map((row) => {
        const firstName = (row["Pupil 1st name"] || row["Pupil 1st Name"] || "").toString().trim();
        const surname = (row[\"Pupil surname"] || row["Pupil Surname"] || "").toString().trim();
        const id = (row["ID"] || row["Id"] || row["id"] || row["Roll number"] || row["Roll No"] || row["Student ID"] || row["Pupil ID"] || "").toString().trim();
        if (!firstName && !surname) return null;
        return { id, name: `${firstName} ${surname}`.trim(), year: "" };
      })
      .filter(Boolean);

    res.json({ candidates, total: rows.length, extracted: candidates.length });
  } catch (err) {
    res.status(400).json({ error: "Failed to parse Excel file: " + err.message });
  }
});

// ─── POST /api/candidates/import ─────────────────────────────────
app.post("/api/candidates/import", authenticate, requireRole("admin", "it_admin"), (req, res) => {
  const { candidates, year } = req.body;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "No candidates provided" });
  }

  const election = db.prepare("SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!election) return res.status(400).json({ error: "No open election" });

  const insert = db.prepare("INSERT INTO candidates (name, photo, year, election_id) VALUES (?, '', ?, ?)");
  const importAll = db.transaction(() => {
    const imported = [];
    for (const c of candidates) {
      const result = insert.run(c.name, year || c.year || "", election.id);
      imported.push({ id: result.lastInsertRowid, name: c.name, year: year || c.year || "" });
    }
    return imported;
  });

  try {
    const imported = importAll();
    res.json({ success: true, imported, count: imported.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ─── POST /api/photos/upload ─────────────────────────────────────────

app.post("/api/photos/upload", (req, res, next) => {
  photoUpload.array("photos", 100)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: \"No files uploaded" });
  }

  const results = [];

  for (const file of req.files) {
    // Extract student ID from filename (e.g., \"4291.jpg\" -> \"4291\")
    const studentId = path.basename(file.originalname, path.extname(file.originalname));
    const photoUrl = `/uploads/${file.originalname}`;

    results.push({ studentId, filename: file.originalname, photoUrl, matched: true });
  }

  res.json({ 
    success: true, 
    uploaded: req.files.length, 
    matched: results.length, 
    unmatched: 0,
    results 
    });    
  });
});

app.listen(PORT, () => {
  console.log(`Voting server running on http://localhost:${PORT}`);
});
