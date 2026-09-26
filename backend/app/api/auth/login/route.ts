import { prisma } from "@/lib/prisma"
import { badRequest, unauthorized } from "@/lib/api"
import { NextResponse } from "next/server"
import { createSessionToken, SESSION_COOKIE } from "@/lib/session"
import { Role } from "@prisma/client"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return badRequest("Body must be valid JSON") }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const rawRole = typeof body.role === "string" ? body.role.toLowerCase() : ""
  const roleMap: Record<string, Role> = { mentee: Role.STUDENT, student: Role.STUDENT, mentor: Role.MENTOR, admin: Role.ADMIN }
  const role = roleMap[rawRole]
  if (!email || !email.includes("@")) return badRequest("Valid email is required")
  if (!role) return badRequest("Valid role is required")

  const user = await prisma.user.findFirst({ where: { email, role }, select: { id:true,email:true,name:true,role:true,assignedMentorId:true,mentorStatus:true } })
  if (!user) return unauthorized()
  if (role === Role.MENTOR && user.mentorStatus !== "APPROVED") return unauthorized()

  const response = NextResponse.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    assignedMentorId: user.assignedMentorId, mentorStatus: user.mentorStatus,
  })
  response.cookies.set({ name: SESSION_COOKIE, value: createSessionToken(user.email, rawRole), httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV==="production", path:"/", maxAge:60*60*24*30 })
  return response
}