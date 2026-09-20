import { prisma } from "@/lib/prisma"
import { badRequest, unauthorized } from "@/lib/api"
import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { createSessionToken, SESSION_COOKIE } from "@/lib/session"

function hashPassword(password: string) {
  return createHash("sha256").update(password, "utf8").digest("hex")
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Body must be valid JSON")
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!email || !email.includes("@")) return badRequest("Valid email is required")
  if (!password) return badRequest("Password is required")

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      assignedMentorId: true,
      passwordHash: true,
    },
  })

  if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
    return unauthorized()
  }

  const response = NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    assignedMentorId: user.assignedMentorId,
  })

  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user.email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
