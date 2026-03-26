# School Prefect Voting System - Backend

## Setup

```bash
cd backend
npm install
npm run init-db   # Creates voting.db with tables and seed data
npm start         # Starts server on port 3001
```

## Default Accounts

| Role     | Email               | Password   |
|----------|---------------------|------------|
| Admin    | admin@school.com    | admin123   |
| IT Admin | it@school.com       | it123      |
| Teacher  | john.smith@school.com | teacher123 |
| Teacher  | jane.doe@school.com | teacher123 |

## API Endpoints

| Method | Endpoint               | Auth     | Description            |
|--------|------------------------|----------|------------------------|
| POST   | /api/login             | Public   | Login, returns JWT     |
| GET    | /api/candidates        | Any user | List candidates        |
| POST   | /api/candidates        | Admin/IT | Add candidate          |
| DELETE | /api/candidates/:id    | Admin/IT | Remove candidate       |
| POST   | /api/vote              | Teacher  | Submit vote            |
| GET    | /api/results           | Admin    | Get vote results       |
| POST   | /api/election/toggle   | Admin    | Open/close voting      |
| POST   | /api/election/reset    | Admin    | Reset for new election |
| GET    | /api/teachers          | Admin/IT | List teachers          |
| POST   | /api/teachers          | Admin/IT | Add teacher            |
| DELETE | /api/teachers/:id      | Admin/IT | Remove teacher         |

## Adding Candidates via SQL

See `seed_candidates.sql` for examples.
