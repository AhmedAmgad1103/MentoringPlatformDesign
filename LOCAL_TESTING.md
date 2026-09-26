# MedMentor Local Full-Stack Test

This branch combines the Vite frontend with a local Next.js backend and a SQLite database.

## Run locally

Use Node.js 20+.

From the repository root:

```bash
npm install
npm run dev
```

The first run automatically installs backend dependencies, generates Prisma Client, creates the local SQLite database, and seeds the three test accounts.

Frontend: http://localhost:8443

Backend: http://localhost:3000

## Test accounts

Student  
student@gmail.com  
student@123

Mentor  
mentor@gmail.com  
mentor@123

Admin  
admin@gmail.com  
admin@123

The role is detected from the account. There is no role selector.

## Database

Notifications, mentor rewards, helpful votes, profile photos, moderation settings, reporting, messaging, and mentor assignment are persisted by the local backend.

The database file is created at:

`backend/data/mentoring.db`

It is intentionally ignored by Git, so posts, answers, boosts, messages, assignments, and other local test data stay on the machine between restarts.

## Suggested test flow

1. Sign in as the student.
2. Create an anonymous public question.
3. Confirm it is not visible in the public feed yet.
4. Sign out and sign in as the admin.
5. Open Moderation and approve the pending question.
6. Sign out and sign in as the mentor.
7. Confirm the approved anonymous question appears in the mentor queue and answer it.
8. Sign in as the student again and confirm the answer is visible.
9. Test closing and reopening the question.
10. Test boost/unboost and verify the count persists after restarting the app.
11. Report the now-approved post from the student or mentor.
12. Sign out and sign in as the admin, then open Reports.
13. Review the report, try Dismiss Report, then repeat the flow and use Remove Post.
14. Confirm that Remove Post hides the reported post and resolves its pending reports.
15. Test mentor-to-student messaging and confirm the student receives a notification.
16. Mark an answer helpful and verify the mentor's reward points increase.
17. Open the mentor leaderboard/reward history and confirm the current monthly cycle is shown.
18. Test the admin Users page, mentor approval, auto-approval setting, and mentor assignment.
19. Edit the student and mentor display name/avatar from Profile and confirm it persists after restarting.
20. Restart both servers and confirm your created data is still present.

## Reset the local database

Delete `backend/data/mentoring.db` and run `npm run dev` again. The setup script will recreate the database and seed the three accounts.

## Local authentication

The frontend uses the local signed-cookie session. Email verification is a development-only flow: any six-digit code is accepted. Role selection is resolved from the account's available roles; there is no role selector on the initial login screen.

## Mentor rewards

Reward points are persisted in SQLite and scoped to the current calendar month. The cycle changes automatically each month; historical point rows remain in the database, while leaderboard/reward-history views show only the current cycle.

## Post reports

Students and mentors can report approved public posts, including posts already approved by an admin. Each user can report a given post once and may optionally add details. Admins can review pending reports, dismiss them, or remove the reported post. Removing a post changes its moderation state to rejected and resolves all pending reports for that post.

Notifications are intentionally not part of this local full-stack test. No notification events are generated or persisted by the local backend.
