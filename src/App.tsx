import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createQuestion, getQuestions, Question } from "./api";

type Role = "mentee" | "mentor" | "admin";
type Screen = "login" | "dashboard" | "ask" | "feed" | "question" | "profile" | "mentor" | "admin";

type Session = {
  email: string;
  role: Role;
};

const roleLabels: Record<Role, string> = {
  mentee: "Mentee",
  mentor: "Mentor",
  admin: "Administrator",
};

const categories = [
  "Clinical Skills",
  "Board Exams",
  "Career",
  "Wellness & Burnout",
  "Research",
  "Study Strategy",
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    message: <><path d="M20 12a8 8 0 0 1-8 8 8.5 8.5 0 0 1-3.5-.8L4 20l.8-4.5A8.5 8.5 0 0 1 4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8Z"/></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <div className="logo-mark">M</div>
      {!compact && <span>MentorLink</span>}
    </div>
  );
}

function Avatar({ email, size = "md" }: { email: string; size?: "sm" | "md" | "lg" }) {
  const initial = (email[0] || "U").toUpperCase();
  return <div className={`avatar avatar-${size}`}>{initial}</div>;
}

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  full = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${full ? "btn-full" : ""}`}
    >
      {children}
    </button>
  );
}

function AppShell({
  session,
  screen,
  setScreen,
  onLogout,
  children,
}: {
  session: Session;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { id: "dashboard" as Screen, label: "Dashboard", icon: "home" },
    { id: "feed" as Screen, label: "Question Feed", icon: "search" },
    { id: "ask" as Screen, label: "Ask a Question", icon: "plus" },
    ...(session.role === "mentor"
      ? [{ id: "mentor" as Screen, label: "Mentor Workspace", icon: "message" }]
      : []),
    ...(session.role === "admin"
      ? [{ id: "admin" as Screen, label: "Admin Console", icon: "shield" }]
      : []),
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <Icon name="close" />
          </button>
        </div>

        <div className="profile-mini">
          <Avatar email={session.email} size="md" />
          <div className="profile-mini-copy">
            <strong>{session.email.split("@")[0]}</strong>
            <span>{roleLabels[session.role]}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? "active" : ""}`}
              onClick={() => {
                setScreen(item.id);
                setMobileOpen(false);
              }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setScreen("profile")}>
            <Icon name="user" size={19} />
            <span>My Profile</span>
          </button>
          <button className="nav-item" onClick={onLogout}>
            <Icon name="logout" size={19} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <section className="main-column">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="topbar-brand"><Logo compact /></div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setScreen("feed")} aria-label="Search">
              <Icon name="search" size={19} />
            </button>
            <button className="icon-button" aria-label="Notifications">
              <Icon name="bell" size={19} />
            </button>
            <button className="top-avatar" onClick={() => setScreen("profile")}>
              <Avatar email={session.email} size="sm" />
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </section>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState("student@university.edu");
  const [role, setRole] = useState<Role>("mentee");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onLogin({ email: email.trim(), role });
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <Logo />
          <span className="login-kicker">MENTORING PLATFORM</span>
        </div>
        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Get answers, guidance and mentorship from people who have been there.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            University email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@university.edu"
              required
            />
          </label>

          <label>
            Sign in as
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Administrator</option>
            </select>
          </label>

          <Button type="submit" full>
            Continue <Icon name="arrow" size={17} />
          </Button>
        </form>

        <div className="dev-note">
          <Icon name="shield" size={16} />
          <span>Development mode: this frontend stores the session locally until your backend exposes a login API.</span>
        </div>
      </div>

      <div className="login-visual">
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />
        <div className="visual-card">
          <span className="eyebrow">MENTORLINK</span>
          <h2>Questions are easier when you don't have to figure them out alone.</h2>
          <div className="visual-list">
            <div><span>01</span><b>Ask privately</b></div>
            <div><span>02</span><b>Reach the right mentor</b></div>
            <div><span>03</span><b>Learn from real answers</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function QuestionCard({
  question,
  onOpen,
}: {
  question: Question;
  onOpen: (question: Question) => void;
}) {
  const answered = question.status.toLowerCase().includes("answered");
  return (
    <button className="question-card" onClick={() => onOpen(question)}>
      <div className="question-card-top">
        <span className="category-pill">{question.category}</span>
        <span className={`status-pill ${answered ? "status-answered" : "status-pending"}`}>
          {answered ? "Answered" : "Awaiting response"}
        </span>
      </div>
      <h3>{question.title}</h3>
      <div className="question-card-footer">
        <span>{answered ? "Mentor response available" : "Waiting for mentor response"}</span>
        <Icon name="arrow" size={16} />
      </div>
    </button>
  );
}

function Dashboard({
  session,
  questions,
  loading,
  onAsk,
  onOpen,
  onRefresh,
}: {
  session: Session;
  questions: Question[];
  loading: boolean;
  onAsk: () => void;
  onOpen: (q: Question) => void;
  onRefresh: () => void;
}) {
  const answered = questions.filter((q) => q.status.toLowerCase().includes("answered")).length;
  const pending = questions.length - answered;

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div>
          <span className="eyebrow">YOUR MENTORING SPACE</span>
          <h1>Good morning, {session.email.split("@")[0]}.</h1>
          <p>What would you like help with today?</p>
        </div>
        <Button onClick={onAsk}><Icon name="plus" size={17} /> Ask a question</Button>
      </section>

      <section className="stat-grid">
        <Stat label="Questions" value={String(questions.length)} detail="Across your current feed" />
        <Stat label="Answered" value={String(answered)} detail="Questions with a response" />
        <Stat label="Pending" value={String(pending)} detail="Still waiting for help" />
        <Stat label="Role" value={roleLabels[session.role]} detail="Current workspace" />
      </section>

      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">QUICK ACTIONS</span>
            <h2>How can we help?</h2>
          </div>
        </div>
        <div className="action-grid">
          {[
            ["Ask My Mentor", "Continue a private conversation with your assigned mentor.", "message"],
            ["Ask Any Mentor", "Reach the wider mentor community with a focused question.", "search"],
            ["Ask Anonymously", "Hide your identity when the topic feels personal.", "shield"],
            ["Browse Questions", "Explore answers and learn from questions others asked.", "home"],
          ].map(([title, text, icon], index) => (
            <button
              key={title}
              className="action-card"
              onClick={() => (index === 3 ? onOpen(questions[0]) : onAsk())}
              disabled={index === 3 && questions.length === 0}
            >
              <div className="action-icon"><Icon name={icon} size={20} /></div>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">LIVE FROM BACKEND</span>
            <h2>Recent questions</h2>
          </div>
          <button className="text-button" onClick={onRefresh}>Refresh</button>
        </div>

        {loading ? (
          <div className="empty-card">Loading questions…</div>
        ) : questions.length === 0 ? (
          <div className="empty-card">No questions have been returned by the backend yet.</div>
        ) : (
          <div className="question-list">
            {questions.slice(0, 4).map((q) => <QuestionCard key={q.id} question={q} onOpen={onOpen} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function AskQuestion({
  session,
  onDone,
  onToast,
}: {
  session: Session;
  onDone: () => void;
  onToast: (message: string, kind?: "success" | "error" | "info") => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [body, setBody] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      await createQuestion({
        title: title.trim(),
        category,
        body: body.trim(),
        privacy,
        authorEmail: session.email,
      });
      onToast("Question created successfully.", "success");
      onDone();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "The backend rejected the question.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-heading">
        <span className="eyebrow">NEW QUESTION</span>
        <h1>Ask for guidance</h1>
        <p>Be specific enough for a mentor to give you a useful answer.</p>
      </div>

      <form className="form-card" onSubmit={submit}>
        <label>
          Question title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need help with?" required />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label>
          Details
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add the context a mentor would need…" rows={8} required />
        </label>

        <div>
          <span className="field-label">Who can see this?</span>
          <div className="choice-grid">
            {[
              ["public", "Public", "Visible in the question feed."],
              ["mentors", "Mentors only", "Only verified mentors can respond."],
              ["anonymous", "Anonymous", "Hide your identity from the question."],
            ].map(([value, name, text]) => (
              <button
                type="button"
                key={value}
                className={`choice-card ${privacy === value ? "selected" : ""}`}
                onClick={() => setPrivacy(value)}
              >
                <strong>{name}</strong>
                <span>{text}</span>
                {privacy === value && <span className="choice-check"><Icon name="check" size={14} /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Button variant="secondary" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? "Publishing…" : "Publish question"}</Button>
        </div>
      </form>
    </div>
  );
}

function Feed({
  questions,
  onOpen,
  loading,
  error,
  onRetry,
}: {
  questions: Question[];
  onOpen: (q: Question) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        const matchesQuery = !query.trim() || q.title.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "All" || q.category === category;
        return matchesQuery && matchesCategory;
      }),
    [questions, query, category],
  );

  return (
    <div className="stack-xl">
      <section className="page-title-row">
        <div>
          <span className="eyebrow">COMMUNITY</span>
          <h1>Question feed</h1>
          <p>Explore questions and mentor answers.</p>
        </div>
        <button className="refresh-button" onClick={onRetry}><Icon name="search" size={17} /> Refresh</button>
      </section>

      <section className="filter-bar">
        <div className="search-field">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions…" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>

      {error ? (
        <div className="error-card">
          <strong>Could not load questions</strong>
          <p>{error}</p>
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </div>
      ) : loading ? (
        <div className="empty-card">Loading questions…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">No questions match your filters.</div>
      ) : (
        <div className="question-list">
          {filtered.map((q) => <QuestionCard key={q.id} question={q} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function QuestionDetail({ question, onBack }: { question: Question; onBack: () => void }) {
  return (
    <div className="detail-page">
      <button className="back-link" onClick={onBack}>← Back to questions</button>
      <div className="detail-grid">
        <article className="detail-card">
          <div className="question-card-top">
            <span className="category-pill">{question.category}</span>
            <span className={`status-pill ${question.status.toLowerCase().includes("answered") ? "status-answered" : "status-pending"}`}>
              {question.status}
            </span>
          </div>
          <h1>{question.title}</h1>
          <p className="detail-copy">
            This question is coming directly from <code>GET /api/questions</code>. When your backend begins returning richer fields such as body, author, tags and answers, this view is already structured to display them.
          </p>
        </article>

        <aside className="detail-side">
          <div className="mentor-card">
            <div className="mentor-avatar">ML</div>
            <div>
              <span className="eyebrow">MENTOR SPACE</span>
              <h3>Need more help?</h3>
              <p>Ask a focused follow-up or start a new question.</p>
            </div>
            <Button onClick={onBack}>Browse more</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Profile({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <div className="profile-page">
      <section className="profile-hero">
        <Avatar email={session.email} size="lg" />
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>{session.email.split("@")[0]}</h1>
          <p>{session.email}</p>
        </div>
      </section>

      <div className="profile-grid">
        <div className="detail-card">
          <span className="eyebrow">ROLE</span>
          <h3>{roleLabels[session.role]}</h3>
          <p>Your current frontend role controls which workspace is visible in this development build.</p>
        </div>
        <div className="detail-card">
          <span className="eyebrow">BACKEND STATUS</span>
          <h3>Questions API connected</h3>
          <p>The frontend is configured to request <code>/api/questions</code> through the Vite proxy.</p>
        </div>
      </div>

      <Button variant="danger" onClick={onLogout}><Icon name="logout" size={17} /> Sign out</Button>
    </div>
  );
}

function RoleWorkspace({ role }: { role: "mentor" | "admin" }) {
  const admin = role === "admin";
  return (
    <div className="stack-xl">
      <section className="page-title-row">
        <div>
          <span className="eyebrow">{admin ? "ADMINISTRATION" : "MENTORING"}</span>
          <h1>{admin ? "Admin console" : "Mentor workspace"}</h1>
          <p>{admin ? "Manage moderation and platform operations." : "See the work that needs your attention."}</p>
        </div>
      </section>

      <div className="workspace-banner">
        <div className="action-icon"><Icon name={admin ? "shield" : "message"} size={22} /></div>
        <div>
          <strong>{admin ? "Backend integration is ready for the next API layer." : "The mentor UI is ready for answer and queue endpoints."}</strong>
          <p>The current backend does not expose those resources yet, so these controls stay presentation-only until the corresponding API routes exist.</p>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="detail-card"><span className="eyebrow">READY</span><h3>Dashboard shell</h3><p>Navigation, role-aware access and responsive layout are already in place.</p></div>
        <div className="detail-card"><span className="eyebrow">NEXT API</span><h3>{admin ? "Users & moderation" : "Answers & assignments"}</h3><p>Connect these cards when those endpoints are added to the backend.</p></div>
      </div>
    </div>
  );
}

function Toast({ message, kind, onClose }: { message: string; kind: "success" | "error" | "info"; onClose: () => void }) {
  return (
    <div className={`toast toast-${kind}`}>
      <span>{message}</span>
      <button onClick={onClose}><Icon name="close" size={14} /></button>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem("mentorlink-session");
    return raw ? JSON.parse(raw) : null;
  });
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" | "info" } | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      setQuestions(await getQuestions());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadQuestions();
  }, [session]);

  const login = (next: Session) => {
    localStorage.setItem("mentorlink-session", JSON.stringify(next));
    setSession(next);
    setScreen("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("mentorlink-session");
    setSession(null);
    setScreen("login");
  };

  const openQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setScreen("question");
  };

  if (!session) return <Login onLogin={login} />;

  return (
    <>
      <AppShell session={session} screen={screen} setScreen={setScreen} onLogout={logout}>
        {screen === "dashboard" && (
          <Dashboard
            session={session}
            questions={questions}
            loading={loading}
            onAsk={() => setScreen("ask")}
            onOpen={(q) => q && openQuestion(q)}
            onRefresh={loadQuestions}
          />
        )}

        {screen === "ask" && (
          <AskQuestion
            session={session}
            onDone={() => {
              setScreen("dashboard");
              loadQuestions();
            }}
            onToast={(message, kind = "info") => setToast({ message, kind })}
          />
        )}

        {screen === "feed" && (
          <Feed
            questions={questions}
            onOpen={openQuestion}
            loading={loading}
            error={error}
            onRetry={loadQuestions}
          />
        )}

        {screen === "question" && selectedQuestion && (
          <QuestionDetail question={selectedQuestion} onBack={() => setScreen("feed")} />
        )}

        {screen === "profile" && <Profile session={session} onLogout={logout} />}

        {screen === "mentor" && session.role === "mentor" && <RoleWorkspace role="mentor" />}

        {screen === "admin" && session.role === "admin" && <RoleWorkspace role="admin" />}
      </AppShell>

      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </>
  );
}
