export interface DemoQuestion {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
}

let demoQuestions: DemoQuestion[] = [
  {
    id: "demo-1",
    title: "How did you prepare for Step 2 CK?",
    category: "BOARD_EXAMS",
    status: "AWAITING_RESPONSE",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "How do I manage burnout during rotations?",
    category: "WELLNESS_BURNOUT",
    status: "ANSWERED",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-3",
    title: "How should I balance research with clinical rotations?",
    category: "RESEARCH",
    status: "AWAITING_RESPONSE",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export async function getQuestions(): Promise<DemoQuestion[]> {
  return [...demoQuestions];
}

export async function createQuestion(input: {
  title: string;
  category: string;
  body: string;
  privacy: string;
}): Promise<DemoQuestion> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const question: DemoQuestion = {
    id: `demo-${Date.now()}`,
    title: input.title,
    category: input.category || "OTHER",
    status: "AWAITING_RESPONSE",
    createdAt: new Date().toISOString(),
  };

  demoQuestions = [question, ...demoQuestions];
  return question;
}

export async function sendMessage(input: {
  recipientId: string | number;
  body: string;
}): Promise<{ success: true }> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  if (!input.body.trim()) throw new Error("Message cannot be empty.");
  return { success: true };
}
