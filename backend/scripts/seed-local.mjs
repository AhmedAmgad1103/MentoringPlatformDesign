import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { createHash } from "node:crypto"
import { PrismaClient, QuestionCategory, QuestionStatus, QuestionVisibility, ModerationStatus, Role } from "@prisma/client"

const connectionString = process.env.DATABASE_URL || "file:./data/mentoring.db"
const adapter = new PrismaBetterSqlite3({ url: connectionString })
const prisma = new PrismaClient({ adapter })

function hashPassword(password) {
  return createHash("sha256").update(password, "utf8").digest("hex")
}

const accounts = [
  {
    email: "student@gmail.com",
    name: "Alex Johnson",
    role: Role.STUDENT,
    password: "student@123",
  },
  {
    email: "mentor@gmail.com",
    name: "Dr. Mariam Khaled",
    role: Role.MENTOR,
    mentorStatus: "APPROVED",
    password: "mentor@123",
  },
  {
    email: "admin@gmail.com",
    name: "Local Admin",
    role: Role.ADMIN,
    password: "admin@123",
  },
]

async function main() {
  const users = {}

  for (const account of accounts) {
    users[account.email] = await prisma.user.upsert({
      where: { email_role: { email: account.email, role: account.role } },
      update: {
        name: account.name,
        role: account.role,
        mentorStatus: account.role === Role.MENTOR ? "APPROVED" : "NONE",
        passwordHash: hashPassword(account.password),
      },
      create: {
        email: account.email,
        name: account.name,
        role: account.role,
        passwordHash: hashPassword(account.password),
      },
    })
  }

  await prisma.user.update({
    where: { id: users["student@gmail.com"].id },
    data: { assignedMentorId: users["mentor@gmail.com"].id },
  })

  // Legacy local data may contain community/anonymous questions created before
  // moderation was required. Keep only direct private mentee -> assigned mentor
  // questions outside moderation.
  await prisma.question.updateMany({
    where: {
      moderationStatus: ModerationStatus.NOT_REQUIRED,
      OR: [
        { visibility: QuestionVisibility.PUBLIC },
        { isAnonymous: true },
      ],
    },
    data: {
      moderationStatus: ModerationStatus.PENDING,
    },
  })

  const existingSeedQuestion = await prisma.question.findFirst({
    where: {
      studentId: users["student@gmail.com"].id,
      title: "Local test: how does mentoring work?",
    },
    select: { id: true },
  })

  if (!existingSeedQuestion) {
    await prisma.question.create({
      data: {
        title: "Local test: how does mentoring work?",
        content:
          "This is a seeded public question so the local feed is not empty. You can answer it from the mentor account or create your own questions from the student account.",
        category: QuestionCategory.ACADEMICS,
        visibility: QuestionVisibility.PUBLIC,
        isAnonymous: false,
        status: QuestionStatus.AWAITING_RESPONSE,
        moderationStatus: ModerationStatus.APPROVED,
        studentId: users["student@gmail.com"].id,
      },
    })
  }

  console.log("")
  console.log("Local MedMentor accounts:")
  console.log("  student@gmail.com / student@123")
  console.log("  mentor@gmail.com / mentor@123")
  console.log("  admin@gmail.com   / admin@123")
  console.log("")
  console.log("Student is assigned to Dr. Local Mentor.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
