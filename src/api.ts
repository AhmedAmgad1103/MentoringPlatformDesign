import {
  boostQuestion as boostQuestionApi,
  createAnswer as createAnswerApi,
  createQuestion as createQuestionApi,
  deleteAnswer as deleteAnswerApi,
  getAnswers as getAnswersApi,
  getMentorProfile,
  getMentors as getMentorsApi,
  getAdminUsers as getAdminUsersApi,
  getAdminStats as getAdminStatsApi,
  getAdminMentors as getAdminMentorsApi,
  assignMentor as assignMentorApi,
  unassignMentor as unassignMentorApi,
  getModerationQueue as getModerationQueueApi,
  approveQuestion as approveQuestionApi,
  rejectQuestion as rejectQuestionApi,
  getMentorMentees as getMentorMenteesApi,
  getMessages as getMessagesApi,
  getAdminReports as getAdminReportsApi,
  reportQuestion as reportQuestionApi,
  updateAdminReport as updateAdminReportApi,
  getQuestion as getQuestionApi,
  getQuestions as getQuestionsApi,
  getMe as getMeApi,
  localLogin as localLoginApi,
  localLogout as localLogoutApi,
  sendMessage as sendMessageApi,
  unboostQuestion as unboostQuestionApi,
  updateAnswer as updateAnswerApi,
  updateMe as updateMeApi,
  updateQuestionStatus as updateQuestionStatusApi,
  type ApiAnswer,
  type ApiQuestion,
  type ApiUser,
  type QuestionCategory,
  type ReportReason,
  type ReportStatus,
} from "./apiClient";

export interface DemoQuestion {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  visibility: ApiQuestion["visibility"];
  isAnonymous: boolean;
  responses: number;
}

function mapQuestion(q: ApiQuestion): DemoQuestion {
  return {
    id: q.id,
    title: q.title,
    category: categoryLabel(q.category),
    status: q.status,
    createdAt: q.createdAt,
    visibility: q.visibility,
    isAnonymous: q.isAnonymous,
    responses: q.answerCount,
  };
}

function categoryValue(category: string): QuestionCategory {
  const values: Record<string, QuestionCategory> = {
    "Board Exams": "BOARD_EXAMS",
    "Wellness & Burnout": "WELLNESS_BURNOUT",
    "Clinical Rotations": "CLINICAL_ROTATIONS",
    "Clinical Skills": "CLINICAL_SKILLS",
    "Residency Match": "RESIDENCY_MATCH",
    Academics: "ACADEMICS",
    Career: "CAREER",
    Research: "RESEARCH",
    "Study Skills": "STUDY_SKILLS",
    Other: "OTHER",
  };
  return values[category] ?? (category as QuestionCategory) ?? "OTHER";
}

function categoryLabel(category: QuestionCategory) {
  const labels: Record<QuestionCategory, string> = {
    BOARD_EXAMS: "Board Exams",
    WELLNESS_BURNOUT: "Wellness & Burnout",
    CLINICAL_ROTATIONS: "Clinical Rotations",
    CLINICAL_SKILLS: "Clinical Skills",
    RESIDENCY_MATCH: "Residency Match",
    ACADEMICS: "Academics",
    CAREER: "Career",
    RESEARCH: "Research",
    STUDY_SKILLS: "Study Skills",
    OTHER: "Other",
  };
  return labels[category];
}

export async function getQuestions(): Promise<DemoQuestion[]> {
  const response = await getQuestionsApi({ scope: "mine", limit: 50 });
  return response.items.map(mapQuestion);
}

export async function getAdminStats() {
  return getAdminStatsApi();
}

export async function getAdminQuestions() {
  return getQuestionsApi({ scope: "all", limit: 50, sort: "recent" });
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

  const created = await createQuestionApi({
    title: input.title,
    body: input.body,
    category: categoryValue(input.category || "Other"),
    askType,
    privacy,
  });
  return mapQuestion(created);
}

export async function sendMessage(input: {
  recipientId: string | number;
  body: string;
}): Promise<{ success: true }> {
  if (!input.body.trim()) throw new Error("Message cannot be empty.");

  if (typeof input.recipientId !== "string") {
    throw new Error("A persisted user id is required.");
  }

  await sendMessageApi(input.recipientId, input.body.trim());
  return { success: true };
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
    createdAtMs: new Date(q.createdAt).getTime(),
    responses: q.answerCount,
    helpful: 0,
    boosted: q.boostCount,
    tags: [] as string[],
    boostedByMe: q.boostedByMe,
    reportedByMe: q.reportedByMe,
    isMine: q.isMine,
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
    type: q.isAnonymous
      ? q.visibility === "PRIVATE"
        ? "anon-private"
        : "anon-public"
      : q.mentor?.id
        ? "private"
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
    reportedByMe: q.reportedByMe,
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

export async function reportQuestion(
  questionId: string,
  input: { reason: ReportReason; details?: string }
) {
  return reportQuestionApi(questionId, input);
}

export async function getAdminReports(
  options: { status?: ReportStatus | "all"; page?: number; limit?: number } = {}
) {
  return getAdminReportsApi(options);
}

export async function updateAdminReport(
  reportId: string,
  action: "DISMISS" | "REMOVE_POST"
) {
  return updateAdminReportApi(reportId, action);
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

export async function getAdminUsers(
  options: {
    role?: "STUDENT" | "MENTOR" | "ADMIN";
    q?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  return getAdminUsersApi(options);
}

export async function getAdminMentors() {
  return getAdminMentorsApi();
}

export async function assignMentor(studentId: string, mentorId: string) {
  return assignMentorApi(studentId, mentorId);
}

export async function unassignMentor(studentId: string) {
  return unassignMentorApi(studentId);
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

export async function getMentorMentees() {
  return getMentorMenteesApi();
}

export async function getModerationQueue(options: { page?: number; limit?: number } = {}) {
  return getModerationQueueApi(options);
}

export async function approveQuestion(questionId: string) {
  return approveQuestionApi(questionId);
}

export async function rejectQuestion(questionId: string) {
  return rejectQuestionApi(questionId);
}

export async function localLogin(email: string, password: string) {
  return localLoginApi(email, password);
}

export async function localLogout() {
  return localLogoutApi();
}
