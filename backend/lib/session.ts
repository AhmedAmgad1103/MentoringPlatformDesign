import { cookies } from "next/headers"
import { createHmac } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  role: Role
  assignedMentorId: string | null
}

export const SESSION_COOKIE = "medmentor_local_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  assignedMentorId: true,
} as const

function secret() {
  return process.env.LOCAL_AUTH_SECRET || "medmentor-local-development-secret"
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(input: string) {
  return createHmac("sha256", secret()).update(input).digest("base64url")
}

export function createSessionToken(email: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${encode(email.toLowerCase())}.${exp}`
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string) {
  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [encodedEmail, expRaw, signature] = parts
  const payload = `${encodedEmail}.${expRaw}`
  if (sign(payload) !== signature) return null

  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return null

  try {
    return decode(encodedEmail).trim().toLowerCase()
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const email = verifySessionToken(token)
  if (!email) return null

  return prisma.user.findUnique({
    where: { email },
    select: userSelect,
  })
}
