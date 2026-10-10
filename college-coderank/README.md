# College CodeRank

A red-themed college coding leaderboard with student profiles, LeetCode/GitHub
stats, student roster imports, and an admin dashboard.

## Requirements

- Node.js 18.18 or newer
- MongoDB (local or Atlas)

## Run locally

1. Configure the backend:

   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

   Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and the
   initial admin credentials in `backend/.env`.

2. Install dependencies and start the API:

   ```powershell
   npm install
   npm run dev
   ```

3. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. Open <http://localhost:5173>. Sign in to the admin dashboard with
   `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the backend environment. Students
   can register themselves, including students already in an imported roster.

## Excel roster format

Download the template from the admin dashboard. Required headers are `name`,
`email`, `branch`, `section`, and `year` (1–8). Optional headers are
`studentId`, `leetcodeUsername`, `githubUsername`, and `hackerrankUsername`.
Supported uploads are `.xlsx` and `.csv` files up to 5 MB. A roster
upload matches existing profiles by email; importing an email does not reveal
or set a usable student password, so the student creates their account with
that email.

## Score

The current score formula is:

`easy + (medium × 3) + (hard × 5) + (public GitHub repositories × 2) + floor(HackerRank points / 10)`

LeetCode, GitHub, and HackerRank profile stats can be synchronized from a student's profile or via admin panel.
Platform profiles refresh automatically via the background poller, and instant updates trigger across connected Admin and Student panels in real time via Server-Sent Events (SSE).

## Real-Time Auto-Updates & Webhooks

1. **Server-Sent Events (SSE)**: Connected Admin and Student dashboards receive live push updates instantly when any student solves problems or updates platforms (`/api/realtime/events`).
2. **GitHub Webhook (`POST /api/webhooks/github`)**: Set up a repository webhook in GitHub. Whenever a student pushes code, their GitHub statistics, repository count, and campus score automatically recalculate in real time.
3. **Instant Sync Ping (`POST /api/webhooks/ping`)**: Supports on-demand webhook triggers via student scripts or browser extensions (`?username=<handle>`).

## Leaderboard Custom Limit & Filters

- Filter by Branch, Section, Year, and Search query.
- Custom student limit: Admins and users can enter any number (e.g. 20, 50, 100, custom) or click quick limit chips to display exactly that many top ranking students.

## Excel Spreadsheet Export (.xlsx)

- **Leaderboard Export**: Download filtered or top N student rankings directly as a formatted `.xlsx` workbook with data and summary statistics (`GET /api/leaderboard/export`).
- **Full Roster Export**: Admin can export the complete student database with all platform scores in one click (`GET /api/admin/students/export`).
- **Student Dossier Export**: Download an individual student's complete profile and list of recently solved LeetCode questions in Excel (`GET /api/students/:id/export`).

For backend route and environment details, see [backend/README.md](./backend/README.md).
