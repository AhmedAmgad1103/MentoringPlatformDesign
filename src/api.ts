import {
  boostQuestion as boostQuestionApi,
  createAnswer as createAnswerApi,
  createQuestion as createQuestionApi,
  deleteAnswer as deleteAnswerApi,
  getAnswers as getAnswersApi,
  getMentorProfile,
  getMentors as getMentorsApi,
  getMessages as getMessagesApi,
  getQuestion as getQuestionApi,
  getQuestions as getQuestionsApi,
  getMe as getMeApi,
  sendMessage as sendMessageApi,
  unboostQuestion as unboostQuestionApi,
  updateAnswer as updateAnswerApi,
  updateMe as updateMeApi,
  updateQuestionStatus as updateQuestionStatusApi,
  type ApiAnswer,
  type ApiQuestion,
  type ApiUser,
  type QuestionCategory,
} from "./apiClient";

export interface DemoQuestion {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
}

const demoQuestions: DemoQuestion[] = [
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

function mapQuestion(q: ApiQuestion): DemoQuestion {
  return {
    id: q.id,
    title: q.title,
    category: q.category,
    status: q.status,
    createdAt: q.createdAt,
  };
}

function categoryLabel(category: QuestionCategory) {
  const labels: Record<QuestionCategory, string> = {
    BOARD_EXAMS: "Board Exams",
    WELLNESS_BURNOUT: "Wellness & Burnout",
    CLINICAL_ROTATIONS: "Clinical Rotations",
    ACADEMICS: "Academics",
    CAREER: "Career",
    RESEARCH: "Research",
    STUDY_SKILLS: "Study Skills",
    OTHER: "Other",
  };
  return labels[category];
}

function isNetworkOrServerFailure(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("status 500") ||
    error.message.includes("status 502") ||
    error.message.includes("status 503") ||
    error.message.includes("status 504")
  );
}

export async function getQuestions(): Promise<DemoQuestion[]> {
  try {
    const response = await getQuestionsApi({ scope: "mine", limit: 50 });
    return response.items.map(mapQuestion);
  } catch (error) {
    if (isNetworkOrServerFailure(error)) return [...demoQuestions];
    throw error;
  }
}

export async function createQuestion(input: {
  title: string;
  category: string;
  body: string;
  privacy: string;
  askType?: "MY_MENTOR" | "ANY_MENTOR" | "ANONYMOUS";
}): Promise<DemoQuestion> {
  const askType =
    input.askType ??
    (input.privacy === "private"
      ? "MY_MENTOR"
      : input.privacy === "any-mentor"
        ? "ANY_MENTOR"
        : "ANONYMOUS");

  const privacy =
    input.privacy === "anon-public"
      ? "PUBLIC"
      : input.privacy === "anon-private"
        ? "PRIVATE"
        : input.privacy === "private"
          ? "PRIVATE"
          : undefined;

  try {
    const created = await createQuestionApi({
      title: input.title,
      body: input.body,
      category: (input.category || "OTHER") as QuestionCategory,
      askType,
      privacy,
    });
    return mapQuestion(created);
  } catch (error) {
    if (isNetworkOrServerFailure(error)) {
      return {
        id: `demo-${Date.now()}`,
        title: input.title,
        category: input.category || "OTHER",
        status: "AWAITING_RESPONSE",
        createdAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export async function sendMessage(input: {
  recipientId: string | number;
  body: string;
}): Promise<{ success: true }> {
  if (!input.body.trim()) throw new Error("Message cannot be empty.");

  try {
    if (typeof input.recipientId !== "string") {
      return { success: true };
    }

    await sendMessageApi(input.recipientId, input.body.trim());
    return { success: true };
  } catch (error) {
    if (isNetworkOrServerFailure(error)) return { success: true };
    throw error;
  }
}

export async function getFeedQuestions() {
  const response = await getQuestionsApi({
    scope: "public",
    limit: 50,
    sort: "recent",
  });

  return response.items.map((q) => ({
    id: q.id,
    title: q.title,
    preview: q.content,
    full: q.content,
    category: categoryLabel(q.category),
    date: new Date(q.createdAt).toLocaleDateString(),
    responses: q.answerCount,
    helpful: 0,
    boosted: q.boostCount,
    tags: [] as string[],
    boostedByMe: q.boostedByMe,
    isAnonymous: q.isAnonymous,
    student: q.student,
  }));
}

export async function getQuestionDetails(questionId: string) {
  return getQuestionApi(questionId);
}

export async function getMentorQueue() {
  const [assigned, community] = await Promise.all([
    getQuestionsApi({ scope: "assigned", limit: 50, sort: "recent" }),
    getQuestionsApi({ scope: "mentor-community", limit: 50, sort: "recent" }),
  ]);

  return [...assigned.items, ...community.items].map((q) => ({
    id: q.id,
    type:
      q.mentor?.id
        ? q.isAnonymous
          ? q.visibility === "PRIVATE"
            ? "anon-private"
            : "anon-public"
          : "private"
        : "any-mentor",
    question: q.title,
    content: q.content,
    category: categoryLabel(q.category),
    date: new Date(q.createdAt).toLocaleDateString(),
    priority: "normal" as const,
    asker: q.student
      ? {
          name: q.student.name ?? "Student",
        }
      : null,
    responses: q.answerCount,
    isAnonymous: q.isAnonymous,
    status: q.status,
  }));
}

export async function createAnswer(questionId: string, content: string) {
  return createAnswerApi(questionId, content);
}

export async function updateAnswer(
  questionId: string,
  answerId: string,
  content: string
) {
  return updateAnswerApi(questionId, answerId, content);
}

export async function deleteAnswer(questionId: string, answerId: string) {
  return deleteAnswerApi(questionId, answerId);
}

export async function getAnswers(questionId: string) {
  return getAnswersApi(questionId);
}

export async function boostQuestion(questionId: string) {
  return boostQuestionApi(questionId);
}

export async function unboostQuestion(questionId: string) {
  return unboostQuestionApi(questionId);
}

export async function updateQuestionStatus(
  questionId: string,
  status: "CLOSED" | "AWAITING_RESPONSE"
) {
  return updateQuestionStatusApi(questionId, status);
}

export async function getMessages(withUserId: string, before?: string) {
  return getMessagesApi(withUserId, before);
}

export async function getMentors() {
  return getMentorsApi();
}

export async function getMe(): Promise<ApiUser> {
  return getMeApi();
}

export async function updateMe(name: string | null) {
  return updateMeApi({ name });
}

export async function getMentorProfileById(id: string) {
  return getMentorProfile(id);
}

export type { ApiAnswer };
