# College CodeRank API

## Configuration

Copy `.env.example` to `.env`, then set:

- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DNS_SERVERS`: optional comma-separated DNS resolver IPs; set this
  only if your Node.js process cannot resolve an Atlas `mongodb+srv` hostname.
- `JWT_SECRET`: random secret of at least 32 characters.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: credentials for the first admin account.
- `CLIENT_URL`: frontend origin (defaults to `http://localhost:5173`).
- `GITHUB_TOKEN`: optional token to increase GitHub API rate limits.
- `SYNC_CRON`: optional cron expression; defaults to midnight server time.
- `LEETCODE_SYNC_CRON`: optional cron expression; defaults to every five minutes
  to refresh linked students' accepted LeetCode totals and recent solved problems.

The first admin is created on startup only when that email does not already
exist. Changing the environment password does not reset an existing admin.

## Start

```powershell
npm install
npm run dev
```

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/leaderboard?branch=&section=&year=&search=`
- `GET /api/students/me`, `PATCH /api/students/me`, `POST /api/students/me/sync`
- `GET /api/admin/overview`, `GET /api/admin/departments`
- `POST /api/admin/departments`, `DELETE /api/admin/departments/:branch/sections/:section`
- `GET /api/students/:id`, `POST /api/students/:id/leetcode/sync` (admin only)
- `POST /api/admin/students/import` with multipart field `file`
- `GET /api/health`

Admin endpoints require an admin JWT; student endpoints require a student JWT.
LeetCode profile details include up to 50 distinct recent accepted problems.
LeetCode does not provide a webhook for public profiles, so automatic updates
are polling-based and may take up to five minutes; admins can also refresh a
student's public profile from the admin student-details page.