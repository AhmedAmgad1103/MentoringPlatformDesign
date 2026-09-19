export type Question = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  isAnonymous: boolean;
  status: string;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
  studentId?: string;
  mentorId?: string | null;
  student?: { id: string; name: string | null; role: string } | null;
  mentor?: { id: string; name: string | null; role: string } | null;
  answers?: Array<{
    id: string;
    content: string;
    createdAt: string;
    mentor: { id: string; name: string | null; role: string };
  }>;
  boostCount: number;
  answerCount: number;
  boostedByMe: boolean;
  isMine: boolean;
};

export type QuestionListResponse = {
  items: Question[];
  page: number;
  limit: number;
  total: number;
};

export type CreateQuestionPayload = {
  title: string;
  category: string;
  body: string;
  privacy: "private" | "any-mentor" | "anon-public" | "anon-private";
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getQuestions(params: {
  scope?: "mine" | "assigned" | "mentor-community" | "public" | "all";
  sort?: "recent" | "boosted";
  page?: number;
  limit?: number;
} = {}): Promise<Question[]> {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  const result = await request<QuestionListResponse>(`/api/questions${suffix}`);
  return result.items;
}

export function createQuestion(payload: CreateQuestionPayload) {
  return request<Question>("/api/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getQuestion(id: string | number) {
  return request<Question>(`/api/questions/${id}`);
}

export function boostQuestion(id: string | number) {
  return request<{ boosted: true; boostCount: number }>(
    `/api/questions/${id}/boost`,
    { method: "POST" },
  );
}

export function unboostQuestion(id: string | number) {
  return request<{ boosted: false; boostCount: number }>(
    `/api/questions/${id}/boost`,
    { method: "DELETE" },
  );
}

export function answerQuestion(id: string | number, content: string) {
  return request<Question["answers"] extends Array<infer A> ? A : never>(
    `/api/questions/${id}/answers`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}

export function getMentors() {
  return request<Array<{
    id: string;
    name: string | null;
    role: string;
    isMyMentor: boolean;
  }>>("/api/mentors");
}

// Messaging is intentionally kept behind this helper until the Message model/API
// is added on the backend. Keeping the call shape here lets the UI integration
// land without reintroducing mock data.
export function sendMessage(payload: {
  recipientId: string;
  body: string;
}) {
  return request<{ id: string; recipientId: string; body: string }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, role: "mentee" | "mentor" | "admin" = "mentee") {
  const csrf = await request<{ csrfToken: string }>("/api/auth/csrf", {
    method: "GET",
  });

  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email,
    role,
    callbackUrl: "http://localhost:8443/",
    redirect: "false",
    json: "true",
  });

  const response = await fetch(`${API_BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    redirect: "manual",
    body,
  });

  if (!response.ok && response.status !== 302 && response.status !== 303) {
    throw new Error("Unable to sign in");
  }

  return { ok: true };
}

export function logout() {
  return request<void>("/api/auth/signout", { method: "POST" });
}
