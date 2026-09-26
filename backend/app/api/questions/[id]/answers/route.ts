import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/session"
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api"
import { visibleWhere } from "@/lib/questions"
import { QuestionStatus, Role } from "@prisma/client"
import { awardMentorPoints, REWARD_POINTS, getRewardCycle } from "@/lib/rewards"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  const { id } = await params
  const question = await prisma.question.findFirst({
    where: { AND: [{ id }, visibleWhere(user)] },
    select: { id: true },
  })
  if (!question) return notFound("Question not found")

  const items = await prisma.answer.findMany({
    where: { questionId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      mentor: { select: { id: true, name: true } },
      helpfulVotes: { select: { userId: true } },
    },
  })
  return Response.json({
    items: items.map(({ helpfulVotes, ...item }) => ({
      ...item,
      helpfulCount: helpfulVotes.length,
      helpfulByMe: helpfulVotes.some((vote) => vote.userId === user.id),
    })),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  if (user.role !== Role.MENTOR) return forbidden("Only mentors can answer questions")

  const { id } = await params
  const question = await prisma.question.findFirst({
    where: { AND: [{ id }, visibleWhere(user)] },
    select: { id: true, studentId: true, mentorId: true, isAnonymous: true, visibility: true, createdAt: true },
  })
  if (!question) return notFound("Question not found")

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return badRequest("Body must be valid JSON") }
  const answerContent = typeof body.content === "string" ? body.content.trim() : ""
  if (answerContent.length < 1 || answerContent.length > 5000) {
    return badRequest("content must be 1-5000 characters")
  }

  const answer = await prisma.$transaction(async (tx) => {
    const created = await tx.answer.create({
      data: { content: answerContent, questionId: id, mentorId: user.id },
      select: { id: true, content: true, createdAt: true, updatedAt: true, mentor: { select: { id: true, name: true } } },
    })
    await tx.question.update({ where: { id }, data: { status: QuestionStatus.ANSWERED } })

    const cycle = getRewardCycle()
    await awardMentorPoints(tx, { mentorId: user.id, points: REWARD_POINTS.ANSWER, reason: "ANSWER", eventKey: `answer:${cycle}:${created.id}`, answerId: created.id })
    if (Date.now() - question.createdAt.getTime() <= 24 * 60 * 60 * 1000) {
      await awardMentorPoints(tx, { mentorId: user.id, points: REWARD_POINTS.FAST_RESPONSE, reason: "FAST_RESPONSE", eventKey: `fast-answer:${cycle}:${created.id}`, answerId: created.id })
    }
    if (question.mentorId === null && question.isAnonymous === false && question.visibility === "PUBLIC") {
      await awardMentorPoints(tx, { mentorId: user.id, points: REWARD_POINTS.ANY_MENTOR_RESPONSE, reason: "ANY_MENTOR_RESPONSE", eventKey: `any-mentor-answer:${cycle}:${created.id}`, answerId: created.id })
    }
    await tx.notification.create({
      data: { userId: question.studentId, title: "Your question was answered", message: "A mentor has answered your question." },
    })
    return created
  })
  return Response.json(answer, { status: 201 })
}