-- Example: Insert candidates for a new election year
-- First, create the election:
-- INSERT INTO elections (year, status) VALUES ('2026-2027', 'open');
-- Then use the election id (e.g. 2) below.

-- To get the current election id:
-- SELECT id FROM elections WHERE status = 'open' ORDER BY id DESC LIMIT 1;

-- Insert candidates (replace election_id with actual value)
INSERT INTO candidates (name, photo, year, election_id) VALUES
  ('Aaiez Afzal', '', 'Year 12', 1),
  ('Zere Aldabergenova', '', 'Year 12', 1),
  ('Can Alemdar', '', 'Year 12', 1),
  ('Ela Suna Aydeniz', '', 'Year 12', 1),
  ('Dincsen Bilal Bakay', '', 'Year 12', 1),
  ('Deniz Ai Lin Baki', '', 'Year 12', 1),
  ('Bersun Başar', '', 'Year 12', 1),
  ('Melisa Başlılar', '', 'Year 12', 1),
  ('Timur Başlılar', '', 'Year 12', 1),
  ('Yasmin Başlılar', '', 'Year 12', 1);

-- Add more candidates as needed following the same pattern.

-- To reset for a new year:
-- 1. Close current election:
--    UPDATE elections SET status = 'closed' WHERE id = 1;
-- 2. Create new election:
--    INSERT INTO elections (year, status) VALUES ('2026-2027', 'open');
-- 3. Reset teacher voting status:
--    UPDATE users SET has_voted = 0 WHERE role = 'teacher';
-- 4. Insert new candidates with the new election_id.
