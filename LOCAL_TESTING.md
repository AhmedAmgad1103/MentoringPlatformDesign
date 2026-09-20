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
11. Test mentor-to-student messaging.
12. Restart both servers and confirm your created data is still present.

## Reset the local database

Delete `backend/data/mentoring.db` and run `npm run dev` again. The setup script will recreate the database and seed the three accounts.
