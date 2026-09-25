export type AssignedMentee = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  questionCount: number;
};

export type Question = {
  id: number;
  title: string;
  category: string;
  status: string;
  body?: string;
  privacy?: string;
  authorEmail?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function getQuestions() {
  return request<Question[]>("/api/questions");
}

export function createQuestion(payload: {
  title: string;
  category: string;
  body: string;
  privacy: string;
}) {
  return request<Question>("/api/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendMessage(payload: {
  recipientId: string;
  body: string;
}) {
  return request<{ id: number; recipientId: number; body: string }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function getAssignedMentees() {
  return request<{ items: AssignedMentee[] }>("/api/mentors/me/mentees");
}
