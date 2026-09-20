import { getCurrentUser } from "@/lib/session"
import { unauthorized } from "@/lib/api"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return unauthorized()

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    assignedMentorId: user.assignedMentorId,
  })
}
