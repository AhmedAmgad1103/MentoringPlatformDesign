import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role, MentorStatus } from "@prisma/client"
import { getCurrentUser } from "@/lib/session"
import { forbidden, unauthorized } from "@/lib/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body.email ?? "").trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role === Role.MENTOR) {
      return NextResponse.json({ status: existing.mentorStatus }, { status: existing.mentorStatus === MentorStatus.APPROVED ? 200 : 409 })
    }
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 })
  }

  const mentor = await prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      role: Role.MENTOR,
      mentorStatus: MentorStatus.PENDING,
    },
    select: { id: true, email: true, mentorStatus: true },
  })
  return NextResponse.json({ status: mentor.mentorStatus }, { status: 201 })
}

export async function PATCH(request: Request) {
  const admin = await getCurrentUser()
  if (!admin) return unauthorized()
  if (admin.role !== Role.ADMIN) return forbidden("Admin access required")
  const body = await request.json().catch(() => ({}))
  const id = String(body.id ?? "")
  const status = String(body.status ?? "")
  if (!id || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
  const mentor = await prisma.user.update({
    where: { id },
    data: { mentorStatus: status as MentorStatus },
    select: { id: true, email: true, mentorStatus: true },
  })
  return NextResponse.json(mentor)
}