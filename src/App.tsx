import { useState, useRef, useEffect } from "react";
import {
  boostQuestion,
  createAnswer,
  createQuestion,
  getFeedQuestions,
  getMentorQueue,
  getMentorMentees,
  getModerationQueue,
  getAdminReports,
  getQuestionDetails,
  getQuestions,
  localLogin,
  localLogout,
  getMe,
  sendMessage,
  unboostQuestion,
  updateAdminReport,
  updateQuestionStatus,
  reportQuestion,
  updateMe,
  getAdminUsers,
  getAdminMentors,
  assignMentor,
  unassignMentor,
} from "./api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Screen =
  | "login"
  | "verify"
  | "onboarding-role"
  | "onboarding-mentee"
  | "onboarding-mentor"
  | "dashboard"
  | "ask-question"
  | "ask-my-mentor"
  | "ask-any-mentor"
  | "ask-anonymous"
  | "feed"
  | "question-detail"
  | "mentor-dashboard"
  | "mentor-answer"
  | "admin-dashboard"
  | "admin-users"
  | "admin-questions"
  | "admin-moderation"
  | "admin-reports"
  | "admin-settings"
  | "mentee-profile"
  | "mentor-profile"
  | "leaderboard";

type Role = "mentee" | "mentor" | "admin" | null;

type ToastType = "success" | "error" | "info";

type ReportReasonValue =
  | "SPAM"
  | "HARASSMENT"
  | "INAPPROPRIATE_CONTENT"
  | "MISINFORMATION"
  | "PRIVACY"
  | "OFF_TOPIC"
  | "OTHER";

type ReportStatusValue = "PENDING" | "DISMISSED" | "ACTION_TAKEN";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  // Brand indigo palette
  brand:        "#3B2F7A",   // logo, headers, heavy UI chrome
  primary:      "#5B4EBF",   // interactive: buttons, links, active nav, progress
  primaryHover: "#4A3DAD",   // button hover/pressed
  primaryLight: "#EEEAF9",   // tinted backgrounds, selected chip bg
  primaryMid:   "#7B6FD1",   // lighter interactive accent
  // Secondary accent
  secondary:    "#2C5282",   // icons, supporting accents
  // Semantic — unchanged
  success:      "#0F9D6B",
  successLight: "#D1FAE5",
  pending:      "#E0A62A",
  pendingLight: "#FEF3C7",
  error:        "#DC3545",
  errorLight:   "#FEE2E2",
  // Surface
  bg:           "#F7F6FB",
  card:         "#FFFFFF",
  text:         "#1E1B3A",
  textSec:      "#5C5578",
  border:       "#E2DFF0",
  borderLight:  "#F0EEF8",
};

const DEMO_MODE = false;

// ─── COMPONENT LIBRARY ───────────────────────────────────────────────────────

function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  fullWidth,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer select-none";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variants = {
    primary: `bg-[${C.primary}] text-white hover:bg-[${C.primaryHover}] active:scale-[0.98] shadow-sm`,
    secondary: `bg-white text-[${C.text}] border border-[${C.border}] hover:bg-[${C.bg}] active:scale-[0.98]`,
    ghost: `text-[${C.textSec}] hover:bg-[${C.borderLight}] hover:text-[${C.text}] active:scale-[0.98]`,
    danger: `bg-[${C.error}] text-white hover:bg-red-700 active:scale-[0.98] shadow-sm`,
  };
  const disabledCls = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  const widthCls = fullWidth ? "w-full" : "";

  const variantStyle: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: C.primary, color: "#fff" },
    secondary: { backgroundColor: "#fff", color: C.text, border: `1px solid ${C.border}` },
    ghost: { color: C.textSec },
    danger: { backgroundColor: C.error, color: "#fff" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${disabledCls} ${widthCls} ${className}`}
      style={variantStyle[variant]}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary")
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primaryHover;
        if (variant === "secondary")
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bg;
        if (variant === "ghost") {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.borderLight;
          (e.currentTarget as HTMLButtonElement).style.color = C.text;
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary")
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.primary;
        if (variant === "secondary")
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
        if (variant === "ghost") {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = C.textSec;
        }
      }}
    >
      {children}
    </button>
  );
}

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon,
  rightElement,
  autoFocus,
}: {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: C.text }}>
          {label}
        </label>
      )}
      <div
        className="flex items-center rounded-xl px-3.5 transition-all duration-150"
        style={{
          border: `1.5px solid ${hasError ? C.error : focused ? C.primary : C.border}`,
          backgroundColor: "#fff",
          boxShadow: focused && !hasError ? `0 0 0 3px rgba(91,78,191,0.12)` : "none",
        }}
      >
        {icon && (
          <span className="mr-2" style={{ color: C.textSec }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-gray-400"
          style={{ color: C.text }}
        />
        {rightElement && <span className="ml-2">{rightElement}</span>}
      </div>
      {hasError && (
        <p className="text-xs flex items-center gap-1" style={{ color: C.error }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="6" fill={C.error} fillOpacity="0.15" />
            <path d="M6 3.5v3M6 8h.01" stroke={C.error} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !hasError && (
        <p className="text-xs" style={{ color: C.textSec }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: C.text }}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl px-3.5 py-3 text-sm resize-none outline-none placeholder:text-gray-400 transition-all duration-150"
        style={{
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          backgroundColor: "#fff",
          color: C.text,
          boxShadow: focused ? `0 0 0 3px rgba(91,78,191,0.12)` : "none",
        }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium" style={{ color: C.text }}>
          {label}
        </label>
      )}
      <div
        className="relative rounded-xl transition-all duration-150"
        style={{
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          backgroundColor: "#fff",
          boxShadow: focused ? `0 0 0 3px rgba(91,78,191,0.12)` : "none",
        }}
      >
        <select
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-3 text-sm bg-transparent outline-none rounded-xl cursor-pointer"
          style={{ color: value ? C.text : "#9CA3AF" }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "pending" | "error" | "info" | "neutral";
}) {
  const styles: Record<string, React.CSSProperties> = {
    success: { backgroundColor: C.successLight, color: C.success },
    pending: { backgroundColor: C.pendingLight, color: C.pending },
    error: { backgroundColor: C.errorLight, color: C.error },
    info: { backgroundColor: C.primaryLight, color: C.primary },
    neutral: { backgroundColor: C.borderLight, color: C.textSec },
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={styles[variant]}
    >
      {variant === "success" && (
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: C.success }} />
      )}
      {variant === "pending" && (
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: C.pending }} />
      )}
      {children}
    </span>
  );
}

function Card({
  children,
  className = "",
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl bg-white card-shadow ${className} ${onClick ? "cursor-pointer" : ""}`}
      style={{ border: `1px solid ${C.border}`, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function Avatar({
  src,
  name,
  size = 40,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return src ? (
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: C.primaryLight,
        color: C.primary,
        fontSize: size * 0.35,
      }}
    >
      {initials}
    </div>
  );
}

function StatusDot({ available }: { available: boolean }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full border-2 border-white"
      style={{ backgroundColor: available ? C.success : C.pending }}
    />
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const styles: Record<ToastType, React.CSSProperties> = {
    success: { borderLeft: `4px solid ${C.success}` },
    error: { borderLeft: `4px solid ${C.error}` },
    info: { borderLeft: `4px solid ${C.primary}` },
  };
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill={C.success} fillOpacity="0.15" />
        <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke={C.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill={C.error} fillOpacity="0.15" />
        <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke={C.error} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="9" fill={C.primary} fillOpacity="0.15" />
        <path d="M9 8v5M9 6h.01" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <div
      className="toast-enter flex items-start gap-3 bg-white rounded-xl p-4 card-shadow-md min-w-[300px] max-w-sm"
      style={{ ...styles[toast.type], border: `1px solid ${C.border}` }}
    >
      {icons[toast.type]}
      <p className="text-sm font-medium flex-1" style={{ color: C.text }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto"
        style={{ color: C.textSec }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function PrivacyBadge({
  type,
}: {
  type: "hidden" | "public" | "mentors" | "private" | "approved" | "pending-approval";
}) {
  const config: Record<string, { icon: React.ReactNode; label: string; bg: string; color: string; border: string }> = {
    hidden: {
      label: "Identity Hidden",
      bg: "#FEF3C7", color: "#92400E", border: "#FCD34D",
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 5V3.5a2 2 0 114 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
    },
    public: {
      label: "Public",
      bg: C.primaryLight, color: C.primary, border: `${C.primary}44`,
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/><path d="M5 1c0 0-2 1.5-2 4s2 4 2 4M5 1c0 0 2 1.5 2 4s-2 4-2 4M1 5h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
    },
    mentors: {
      label: "Mentors Only",
      bg: "#EDE9FE", color: "#5B21B6", border: "#C4B5FD",
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.1"/><path d="M1.5 9c0-2 1.567-3 3.5-3s3.5 1 3.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
    },
    private: {
      label: "Private",
      bg: "#FEF3C7", color: "#B45309", border: "#FCD34D",
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="2" y="5" width="6" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 5V3.5a2 2 0 114 0V5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
    },
    approved: {
      label: "Approved",
      bg: C.successLight, color: C.success, border: `${C.success}44`,
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2.5 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
    "pending-approval": {
      label: "Pending Approval",
      bg: "#FEF3C7", color: C.pending, border: "#FCD34D",
      icon: <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/><path d="M5 3v2.5M5 7h.01" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
    },
  };
  const c = config[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function TopicChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="topic-chip px-3 py-1.5 rounded-full text-sm border"
      style={{
        borderColor: selected ? C.primary : C.border,
        backgroundColor: selected ? C.primaryLight : "#fff",
        color: selected ? C.primary : C.text,
        fontWeight: selected ? 500 : 400,
      }}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

const Icons = {
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Lock: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  ),
  Eye: ({ open }: { open: boolean }) =>
    open ? (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10M4 4.3C2.4 5.5 1 8 1 8s2.5 5 7 5c1.5 0 2.9-.5 4-1.3M7 3.1A7 7 0 0115 8s-.7 1.8-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  MessageCircle: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M17 10c0 3.866-3.134 7-7 7a6.97 6.97 0 01-3.5-.937L3 17l.937-3.5A6.97 6.97 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h16M10 2c-2 3-2 13 0 16M10 2c2 3 2 13 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 3l14 14M8.5 8.6A2.5 2.5 0 0012 12M5 5.3C3.1 6.7 1.5 10 1.5 10s3 6 8.5 6c1.8 0 3.4-.6 4.8-1.5M8.5 4.1A9 9 0 0118.5 10s-.8 2.2-2.5 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 15.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 6l1.5-2h5L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3 3.5 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 8H3M6 5L3 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────

const MENTOR = {
  name: "Dr. Mariam Khaled",
  specialty: "Internal Medicine",
  photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&auto=format",
  expertise: ["Board Prep", "Clinical Skills", "Residency Applications"],
  available: true,
  years: 12,
  hospital: "University Medical Center",
  bio: "Board-certified internist with 12 years of clinical and teaching experience. Passionate about helping students navigate boards and residency applications.",
  points: 285,
};

// ─── MENTOR REWARD SYSTEM ────────────────────────────────────────────────────

const MENTOR_TIERS = [
  { min: 0,   label: "New Mentor",     emoji: "🌱", color: C.textSec,  bg: C.borderLight },
  { min: 50,  label: "Active Mentor",  emoji: "⭐", color: C.success,  bg: C.successLight },
  { min: 150, label: "Trusted Mentor", emoji: "🏅", color: C.primary,  bg: C.primaryLight },
  { min: 300, label: "Top Mentor",     emoji: "👑", color: C.pending,  bg: C.pendingLight },
] as const;

function getMentorTier(points: number) {
  let tier = MENTOR_TIERS[0];
  for (const t of MENTOR_TIERS) {
    if (points >= t.min) tier = t;
  }
  const idx = MENTOR_TIERS.indexOf(tier);
  const next = MENTOR_TIERS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((points - tier.min) / (next.min - tier.min)) * 100))
    : 100;
  return { ...tier, next, progress };
}

const CURRENT_MENTOR_POINTS = MENTOR.points;
const CURRENT_LEADERBOARD_MENTORS = LEADERBOARD_MENTORS.map((mentor) => ({
  ...mentor,
}));

const QUESTIONS = [
  {
    id: 1,
    question: "How do I approach a patient with suspected PE in the ED?",
    date: "Aug 28, 2026",
    type: "Private",
    status: "Answered",
    responses: 1,
    latest: "Dr. Khaled responded 2 hours ago",
    tag: "Clinical Skills",
  },
  {
    id: 2,
    question: "What's the best way to structure my Step 1 study schedule for a 10-week block?",
    date: "Aug 25, 2026",
    type: "Anonymous",
    status: "Answered",
    responses: 3,
    latest: "Dr. Chen also responded",
    tag: "Board Prep",
  },
  {
    id: 3,
    question: "Can you review my personal statement draft before I submit to ERAS?",
    date: "Aug 22, 2026",
    type: "Private",
    status: "Awaiting Response",
    responses: 0,
    latest: null,
    tag: "Residency",
  },
  {
    id: 4,
    question: "What are common pitfalls students make during third-year rotations?",
    date: "Aug 18, 2026",
    type: "Public",
    status: "Answered",
    responses: 5,
    latest: "Latest response from Dr. Patel",
    tag: "Clinical Skills",
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    message: "Dr. Mariam Khaled answered your question about PE management",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    message: "Your anonymous question received 2 new responses",
    time: "Yesterday",
    read: false,
  },
  {
    id: 3,
    message: "Reminder: Your mentoring session is tomorrow at 3:00 PM",
    time: "2 days ago",
    read: true,
  },
];

const ASK_CATEGORIES = [
  "Clinical Rotations",
  "Board Exams",
  "Residency Match",
  "Clinical Skills",
  "Research",
  "Study Skills",
  "Wellness & Burnout",
  "Other",
];

const SAMPLE_RESPONSES = [
  {
    id: 1,
    mentor: {
      name: "Dr. Mariam Khaled",
      specialty: "Internal Medicine",
      photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&auto=format",
      expertise: ["Board Prep", "Clinical Skills"],
    },
    answer:
      "Great question — this is one of the most common challenges in M2. I'd strongly recommend anchoring your schedule around active recall rather than passive reading. Dedicate 60% of your dedicated study block to UWorld with timed blocks, and use your Anki reviews every morning before diving in. For pathophysiology, Pathoma is excellent. The key insight most students miss: Step 1 rewards integrated thinking, not isolated facts. Study organ systems in parallel with their pharmacology.",
    timestamp: "2 hours ago",
    helpfulCount: 14,
  },
  {
    id: 2,
    mentor: {
      name: "Dr. James Chen",
      specialty: "Emergency Medicine",
      photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop",
      expertise: ["Clinical Skills", "Wellness & Burnout"],
    },
    answer:
      "From my own Step 1 experience and watching hundreds of students go through it: the biggest predictor of score isn't raw hours but quality of review. After every UWorld block, spend as much time on the explanations as you did on the questions themselves. Also — please protect your sleep. Cognitive consolidation during sleep is non-negotiable. Eight weeks of 5-hour nights will cost you more than you gain from the extra study hours.",
    timestamp: "5 hours ago",
    helpfulCount: 9,
  },
  {
    id: 3,
    mentor: {
      name: "Dr. Priya Patel",
      specialty: "Neurology",
      photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=80&h=80&fit=crop",
      expertise: ["Research", "Residency Applications"],
    },
    answer:
      "I'll add a less-discussed angle: don't neglect the behavioral science and biostatistics sections. Most students underinvest here and leave easy points on the table. They're high-yield and very learnable in a short window. Also, track your weak areas by system in a spreadsheet and revisit them every two weeks — you need to catch gaps before test day, not discover them during the exam.",
    timestamp: "1 day ago",
    helpfulCount: 7,
  },
];

// ─── FEED & NOTIFICATION DATA ─────────────────────────────────────────────────

interface FeedQuestion {
  id: string | number;
  title: string;
  preview: string;
  full: string;
  category: string;
  date: string;
  responses: number;
  helpful: number;
  boosted: number;
  tags: string[];
  createdAtMs?: number;
  reportedByMe?: boolean;
  isMine?: boolean;
  isAnonymous?: boolean;
}

const FEED_QUESTIONS: FeedQuestion[] = [
  {
    id: 101,
    title: "How did you prepare for Step 2 CK?",
    preview: "I'm an M3 starting my dedicated study period and feeling overwhelmed by the breadth of clinical material. What resources did you use and how did you structure your days?",
    full: "I'm an M3 entering my dedicated Step 2 CK study period and feeling genuinely overwhelmed by how different it feels from Step 1. My school recommends Amboss and UWorld but I've heard very mixed things. I have about 8 weeks before my exam. What resources and day-structure strategies actually worked for you? And how do you handle weak subjects when time is running out?",
    category: "Board Exams",
    date: "Aug 29, 2026",
    responses: 4,
    helpful: 23,
    boosted: 15,
    tags: ["Step 2 CK", "Boards", "Study Schedule"],
  },
  {
    id: 102,
    title: "What should I expect during my first surgery rotation?",
    preview: "Starting my surgery clerkship next week. I've heard everything from 'best rotation ever' to 'make sure you eat.' What should I realistically prepare for?",
    full: "Starting my surgery clerkship next week. I'm M3 with no prior surgical exposure outside the skills lab. I've heard wildly different accounts from upperclassmen — some say it was transformative, others say it nearly broke them. What should I realistically prepare for? How early should I arrive? What's the quickest way to build trust with residents and attendings? And is the culture really as intense as it's made out to be?",
    category: "Clinical Rotations",
    date: "Aug 27, 2026",
    responses: 6,
    helpful: 31,
    boosted: 24,
    tags: ["Surgery", "Clerkship", "M3"],
  },
  {
    id: 103,
    title: "How do I balance research with clinical rotations?",
    preview: "I have an ongoing faculty project and I'm entering my clinical year. How do you find time for both without burning out?",
    full: "I have an ongoing research project with a faculty mentor that I started during M2. Now that I'm starting rotations, I'm not sure how to keep the project moving alongside lab meetings, data analysis, and manuscript revisions. Has anyone navigated this successfully? Did the concurrent research ultimately help or hurt your clinical performance? And how much does it actually add to a residency application when completed?",
    category: "Research",
    date: "Aug 25, 2026",
    responses: 3,
    helpful: 18,
    boosted: 9,
    tags: ["Research", "M3", "Residency"],
  },
  {
    id: 104,
    title: "Dealing with imposter syndrome as an M1 — is this normal?",
    preview: "Three months in and I constantly feel like I don't belong. My classmates all seem so confident. Is this imposter syndrome, and when does it get better?",
    full: "Three months into M1 and I still feel like I don't belong here. My classmates seem confident in PBL, in the hallways, in every conversation about medicine. I feel like I'm perpetually catching up. I studied hard to get here but it sometimes feels like a mistake. Is this common? How did you get through it during your own training? When does it start to feel like you actually belong?",
    category: "Wellness & Burnout",
    date: "Aug 24, 2026",
    responses: 8,
    helpful: 47,
    boosted: 33,
    tags: ["Wellness", "M1", "Mental Health"],
  },
  {
    id: 105,
    title: "How early should I start thinking about residency specialty?",
    preview: "I'm M2 and already feel pressure to know my specialty. Some classmates seem completely certain. How did you decide, and when is undecided actually okay?",
    full: "I'm M2 and there's enormous pressure to already know what specialty I want to pursue. Some classmates seem certain — already doing sub-specialty research and networking. I genuinely don't know what I want, and I feel behind. How did you actually decide on your specialty? When is it truly okay to go into M3 without an answer? And will being undecided hurt me in the match if I don't lock in early?",
    category: "Residency Match",
    date: "Aug 22, 2026",
    responses: 5,
    helpful: 29,
    boosted: 19,
    tags: ["Specialty", "M2", "Career"],
  },
  {
    id: 106,
    title: "Tips for writing a strong research abstract as a medical student?",
    preview: "First abstract submission coming up for a regional conference. I've never written one. What makes a student abstract compelling enough to get accepted?",
    full: "I have my first abstract deadline coming up for a regional internal medicine conference. My PI is giving me a lot of creative latitude, which is exciting but also terrifying. What makes a medical student abstract strong enough to get accepted? What are the most common mistakes first-time submitters make? How do I write compellingly when I'm working with preliminary and not final data?",
    category: "Research",
    date: "Aug 20, 2026",
    responses: 2,
    helpful: 11,
    boosted: 6,
    tags: ["Abstract", "Conference", "Writing"],
  },
  {
    id: 107,
    title: "Practical strategies for managing burnout during dedicated Step 1?",
    preview: "Six weeks into dedicated and I'm hitting a wall. Motivation is gone, I'm crying over question blocks. How do you push through without falling apart?",
    full: "Six weeks into Step 1 dedicated and I'm hitting a serious wall. My motivation has evaporated. I'm making careless mistakes on blocks where I know the material. I had a breakdown after a bad NBME. I know burnout during dedicated is common — knowing that doesn't help me get through it. What practical strategies actually worked for you in the last stretch? How do you maintain performance when you're emotionally depleted?",
    category: "Wellness & Burnout",
    date: "Aug 18, 2026",
    responses: 7,
    helpful: 38,
    boosted: 27,
    tags: ["Burnout", "Step 1", "Mental Health"],
  },
  {
    id: 108,
    title: "How do I approach a difficult patient conversation on rounds?",
    preview: "My attending asked me to tell a patient their biopsy came back positive. I've never done this in real life. How do I prepare and what do I actually say?",
    full: "On my oncology rotation, my attending asked me to lead a conversation with a patient receiving positive biopsy results. I've practiced breaking bad news in standardized patient sessions but this is completely real and I'm terrified of saying the wrong thing. How do you prepare mentally and practically? What frameworks actually hold up under pressure? And honestly — what happens if I freeze mid-conversation?",
    category: "Clinical Skills",
    date: "Aug 16, 2026",
    responses: 4,
    helpful: 22,
    boosted: 14,
    tags: ["Communication", "Oncology", "Clinical"],
  },
];

const QUESTIONS = [
    { id: 101, text: "How do I approach Step 2 CK study schedule?", status: "answered", date: "Nov 20, 2024" },
    { id: 102, text: "Best resources for clinical reasoning practice?", status: "answered", date: "Nov 15, 2024" },
    { id: 103, text: "How do I get research experience as an M2?", status: "pending", date: "Nov 28, 2024" },
    { id: 104, text: "Tips for surviving third-year rotations?", status: "answered", date: "Oct 30, 2024" },
  ];

  const header = (
    <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 flex-shrink-0"
          style={{ color: C.textSec, backgroundColor: C.borderLight }}
        >
          <Icons.ArrowLeft />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <Logo size="sm" />
        <div className="flex-1" />
        {!editMode ? (
          <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9 1.5l2.5 2.5-7 7H2V8.5l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>Save Changes</Button>
          </div>
        )}
      </div>
    </header>
  );

  if (editMode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        {header}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 fade-in flex flex-col gap-5">
          {/* Avatar edit */}
          <Card className="p-5 flex items-center gap-4">
            <div className="relative">
              <img src={profile.photo} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
              <button
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => onToast("info", "Photo upload coming soon.")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M14 3.5l2.5 2.5-9 9H5V12.5l9-9z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.text }}>Profile Photo</p>
              <p className="text-xs mt-0.5" style={{ color: C.textSec }}>Click the photo to update</p>
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Personal Information</h3>
            <InputField
              label="Full Name"
              value={draft.name}
              onChange={v => setDraft(d => ({ ...d, name: v }))}
              placeholder="Your full name"
            />
            <InputField
              label="Medical School"
              value={draft.school}
              onChange={v => setDraft(d => ({ ...d, school: v }))}
              placeholder="School name"
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Year"
                value={draft.year}
                onChange={v => setDraft(d => ({ ...d, year: v }))}
                options={availYears.map(y => ({ value: y, label: y }))}
              />
              <SelectField
                label="Track"
                value={draft.track}
                onChange={v => setDraft(d => ({ ...d, track: v }))}
                options={availTracks.map(t => ({ value: t, label: t }))}
              />
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>About</h3>
            <TextAreaField
              label="Bio"
              value={draft.bio}
              onChange={v => setDraft(d => ({ ...d, bio: v }))}
              placeholder="Tell mentors about yourself and your goals…"
              rows={4}
            />
          </Card>

          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Interests</h3>
            <TagInput tags={interests} onChange={setInterests} placeholder="Add an interest…" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {header}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 fade-in flex flex-col gap-5">
        {/* Hero card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={profile.photo} alt={profile.name} className="w-20 h-20 rounded-2xl object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold" style={{ color: C.text }}>{profile.name}</h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: C.textSec }}>
                {profile.year} · {profile.track} · {profile.school}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textSec }}>{profile.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
                  Medical Student
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.successLight, color: C.success }}>
                  Member since {profile.memberSince}
                </span>
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-sm leading-relaxed mt-4 pt-4" style={{ color: C.textSec, borderTop: `1px solid ${C.borderLight}` }}>
              {profile.bio}
            </p>
          )}
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Questions Asked", value: profile.questionsAsked, color: C.primary, bg: C.primaryLight },
            { label: "Answered", value: profile.questionsAnswered, color: C.success, bg: C.successLight },
            { label: "Response Rate", value: `${Math.round((profile.questionsAnswered / profile.questionsAsked) * 100)}%`, color: C.pending, bg: C.pendingLight },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: s.bg }}>
              <div className="stat-numeral" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5 font-medium" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Interests */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map(tag => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}33` }}>
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Assigned mentor */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Assigned Mentor</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={profile.mentor.photo} alt={profile.mentor.name} className="w-12 h-12 rounded-xl object-cover" />
              <StatusDot available />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: C.text }}>{profile.mentor.name}</div>
              <div className="text-xs" style={{ color: C.textSec }}>{profile.mentor.specialty}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => onNavigate("ask-question")}>
              Ask a Question
            </Button>
          </div>
        </Card>

        {/* Questions history */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Questions Asked</h3>
          <div className="flex flex-col gap-2">
            {QUESTIONS.map(q => (
              <div key={q.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: C.text }}>{q.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{q.date}</p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{
                    backgroundColor: q.status === "answered" ? C.successLight : C.pendingLight,
                    color: q.status === "answered" ? C.success : C.pending,
                  }}
                >
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── MENTOR PROFILE SCREEN ────────────────────────────────────────────────────

const AVAIL_OPTIONS: { v: MentorProfileData["availability"]; label: string; color: string; bg: string; dot: string }[] = [
  { v: "available", label: "Available", color: C.success, bg: C.successLight, dot: C.success },
  { v: "busy",      label: "Busy",      color: C.pending, bg: C.pendingLight, dot: C.pending },
  { v: "offline",   label: "Offline",   color: C.textSec, bg: C.borderLight,  dot: C.textSec },
];

function MentorProfileScreen({
  onNavigate,
  onToast,
}: {
  onNavigate: (s: Screen) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(MENTOR_PROFILE_DATA);
  const [draft, setDraft] = useState(profile);
  const [expertise, setExpertise] = useState(profile.expertise);
  const [liveMentees, setLiveMentees] = useState<Array<{ id: string; name: string | null; email: string; questionCount: number }>>([]);

  useEffect(() => {
    let active = true;
    getMentorMentees()
      .then((response) => {
        if (active) setLiveMentees(response.items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function saveEdit() {
    try {
      const updated = await updateMe({ name: draft.name.trim() || null });
      const next = { ...draft, name: updated.name ?? draft.name, expertise };
      setProfile(next);
      setDraft(next);
      setEditMode(false);
      onToast("success", "Profile updated successfully.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to update profile.");
    }
  }
  function cancelEdit() {
    setDraft(profile);
    setExpertise(profile.expertise);
    setEditMode(false);
  }

  const avail = AVAIL_OPTIONS.find(o => o.v === profile.availability)!;

  const header = (
    <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => onNavigate("mentor-dashboard")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 flex-shrink-0"
          style={{ color: C.textSec, backgroundColor: C.borderLight }}
        >
          <Icons.ArrowLeft />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <Logo size="sm" />
        <div className="flex-1" />
        {!editMode ? (
          <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9 1.5l2.5 2.5-7 7H2V8.5l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={saveEdit}>Save Changes</Button>
          </div>
        )}
      </div>
    </header>
  );

  if (editMode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        {header}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 fade-in flex flex-col gap-5">
          {/* Avatar + availability */}
          <Card className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img src={profile.photo} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
                <button
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={() => onToast("info", "Photo upload coming soon.")}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M14 3.5l2.5 2.5-9 9H5V12.5l9-9z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>Profile Photo</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSec }}>Click to update</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: C.textSec }}>AVAILABILITY</p>
              <div className="flex gap-2">
                {AVAIL_OPTIONS.map(o => (
                  <button
                    key={o.v}
                    onClick={() => setDraft(d => ({ ...d, availability: o.v }))}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: draft.availability === o.v ? o.bg : C.borderLight,
                      color: draft.availability === o.v ? o.color : C.textSec,
                      border: `1.5px solid ${draft.availability === o.v ? o.dot : "transparent"}`,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.dot }} />
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Professional Information</h3>
            <InputField label="Full Name" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Dr. Full Name" />
            <InputField label="Institution" value={draft.school} onChange={v => setDraft(d => ({ ...d, school: v }))} placeholder="Hospital or university" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Specialty" value={draft.specialty} onChange={v => setDraft(d => ({ ...d, specialty: v }))} placeholder="e.g. Internal Medicine" />
              <InputField label="Subspecialty" value={draft.subspecialty} onChange={v => setDraft(d => ({ ...d, subspecialty: v }))} placeholder="e.g. Hospital Medicine" />
            </div>
            <InputField label="Education" value={draft.education} onChange={v => setDraft(d => ({ ...d, education: v }))} placeholder="MD, School name" />
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Years in Practice"
                value={String(draft.yearsInPractice)}
                onChange={v => setDraft(d => ({ ...d, yearsInPractice: Number(v) || 0 }))}
                placeholder="14"
              />
              <InputField
                label="Years Mentoring"
                value={String(draft.mentoringYears)}
                onChange={v => setDraft(d => ({ ...d, mentoringYears: Number(v) || 0 }))}
                placeholder="6"
              />
            </div>
          </Card>

          <Card className="p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>About</h3>
            <TextAreaField
              label="Biography"
              value={draft.bio}
              onChange={v => setDraft(d => ({ ...d, bio: v }))}
              placeholder="Describe your clinical background, interests, and mentoring philosophy…"
              rows={5}
            />
          </Card>

          <Card className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Areas of Expertise</h3>
            <TagInput tags={expertise} onChange={setExpertise} placeholder="Add expertise area…" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {header}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 fade-in flex flex-col gap-5">
        {/* Hero */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img src={profile.photo} alt={profile.name} className="w-20 h-20 rounded-2xl object-cover" />
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: avail.dot }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: C.text }}>{profile.name}</h2>
                  <p className="text-sm font-medium mt-0.5" style={{ color: C.textSec }}>
                    {profile.specialty} · {profile.subspecialty}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{profile.school}</p>
                </div>
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                  style={{ backgroundColor: avail.bg, color: avail.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: avail.dot }} />
                  {avail.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.successLight, color: C.success }}>
                  Verified Mentor
                </span>
                <MentorTierBadge points={CURRENT_MENTOR_POINTS} />
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.borderLight, color: C.textSec }}>
                  Member since {profile.memberSince}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mt-4 pt-4" style={{ color: C.textSec, borderTop: `1px solid ${C.borderLight}` }}>
            {profile.bio}
          </p>
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.borderLight}` }}>
            <p className="text-xs" style={{ color: C.textSec }}>
              <strong style={{ color: C.text }}>Education:</strong> {profile.education}
            </p>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Years in Practice", value: profile.yearsInPractice, color: C.primary, bg: C.primaryLight },
            { label: "Years Mentoring", value: profile.mentoringYears, color: "#7C3AED", bg: "#EDE9FE" },
            { label: "Active Mentees", value: profile.menteesActive, color: C.success, bg: C.successLight },
            { label: "Total Mentored", value: profile.totalMentored, color: C.pending, bg: C.pendingLight },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: s.bg }}>
              <div className="stat-numeral" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5 font-medium leading-tight" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mentor Rewards */}
        {(() => {
          const tier = getMentorTier(CURRENT_MENTOR_POINTS);
          return (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: C.text }}>Mentor Rewards</h3>
                <button
                  onClick={() => onNavigate("leaderboard")}
                  className="text-xs font-semibold"
                  style={{ color: C.primary }}
                >
                  View Leaderboard →
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: tier.bg }}
                >
                  {tier.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="stat-numeral" style={{ color: tier.color }}>{CURRENT_MENTOR_POINTS}</span>
                    <span className="text-xs font-medium" style={{ color: C.textSec }}>points · {tier.label}</span>
                  </div>
                  {tier.next && (
                    <>
                      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.borderLight }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${tier.progress}%`, backgroundColor: tier.color, transition: "width 0.4s ease" }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: C.textSec }}>
                        {tier.next.min - CURRENT_MENTOR_POINTS} points to {tier.next.emoji} {tier.next.label}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Availability indicator */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Availability</h3>
          <div className="flex gap-2 flex-wrap">
            {AVAIL_OPTIONS.map(o => (
              <div
                key={o.v}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: profile.availability === o.v ? o.bg : C.borderLight,
                  color: profile.availability === o.v ? o.color : C.textSec,
                  border: `1.5px solid ${profile.availability === o.v ? o.dot + "44" : "transparent"}`,
                  opacity: profile.availability === o.v ? 1 : 0.5,
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: o.dot }} />
                {o.label}
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: C.textSec }}>
            Current status: <strong style={{ color: avail.color }}>{avail.label}</strong> — students can see this indicator when browsing mentors.
          </p>
        </Card>

        {/* Expertise */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Areas of Expertise</h3>
          <div className="flex flex-wrap gap-2">
            {profile.expertise.map(tag => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}33` }}>
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Current mentees */}
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Current Mentees</h3>
          <div className="flex flex-col gap-2">
            {(liveMentees.length > 0
              ? liveMentees.map((m, index) => ({
                  ...MENTOR_MENTEES_DATA[index % MENTOR_MENTEES_DATA.length],
                  id: m.id,
                  name: m.name ?? "Mentee",
                  email: m.email,
                  totalQuestions: m.questionCount,
                }))
              : MENTOR_MENTEES_DATA
            ).map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                <div className="relative">
                  <img src={m.photo} alt={m.name} className="w-9 h-9 rounded-full object-cover" />
                  <StatusDot available={m.active} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold" style={{ color: C.text }}>{m.name}</div>
                  <div className="text-xs" style={{ color: C.textSec }}>{m.year} · {m.track}</div>
                </div>
                <span className="text-xs" style={{ color: C.textSec }}>{m.totalQuestions} Q&amp;As</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

function LeaderboardScreen({
  onBack,
  role,
}: {
  onBack: () => void;
  role: Role;
}) {
  const backLabel = role === "mentor" ? "Dashboard" : "Dashboard";
  const backTarget = () => onBack();

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={backTarget}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 flex-shrink-0"
            style={{ color: C.textSec, backgroundColor: C.borderLight }}
          >
            <Icons.ArrowLeft />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
          <Logo size="sm" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>🏆 Top Mentors</h1>
          <p className="text-sm" style={{ color: C.textSec }}>
            Ranked by reward points — earned for answering, helpful votes, and fast responses.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {CURRENT_LEADERBOARD_MENTORS.map((m, idx) => {
            const tier = getMentorTier(m.points);
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            return (
              <Card
                key={m.id}
                className="p-4 flex items-center gap-3"
                style={isTop3 ? { border: `1.5px solid ${tier.color}55`, backgroundColor: tier.bg } : undefined}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ backgroundColor: isTop3 ? "transparent" : C.borderLight, color: C.textSec }}
                >
                  {medal ?? rank}
                </div>
                <img src={m.photo} alt={m.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: C.text }}>{m.name}</div>
                  <div className="text-xs" style={{ color: C.textSec }}>{m.specialty}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="stat-numeral" style={{ color: tier.color, fontSize: "1.2rem" }}>
                    {m.points}
                  </span>
                  <MentorTierBadge points={m.points} />
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────

function MobileNav({
  role,
  screen,
  onNavigate,
}: {
  role: Role;
  screen: Screen;
  onNavigate: (s: Screen) => void;
}) {
  const menteeItems = [
    {
      s: "dashboard" as Screen,
      label: "Home",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
        </svg>
      ),
    },
    {
      s: "ask-question" as Screen,
      label: "Ask",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0}/>
          <path d="M11 7v4M11 13.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      s: "mentee-profile" as Screen,
      label: "Profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
          <path d="M4 19c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const mentorItems = [
    {
      s: "mentor-dashboard" as Screen,
      label: "Home",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
        </svg>
      ),
    },
    {
      s: "dashboard" as Screen,
      label: "Mentees",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
          <circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M2 19c0-3.5 2.686-5 6-5 1.5 0 2.9.4 3.9 1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M13 18c0-2 1.5-3.5 4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      s: "mentor-profile" as Screen,
      label: "Profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0}/>
          <path d="M4 19c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const isAdminScreen = screen.startsWith("admin-");
  if (isAdminScreen) return null;

  const items = role === "mentor" ? mentorItems : menteeItems;

  const isActive = (s: Screen) => {
    if (s === screen) return true;
    return false;
  };

  return (
    <nav
      className="mobile-nav glass-nav fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(item => {
        const active = isActive(item.s);
        return (
          <button
            key={item.s}
            onClick={() => onNavigate(item.s)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative transition-all active:scale-95"
            style={{ color: active ? "#C4B8FF" : "rgba(255,255,255,0.5)", minHeight: 56 }}
          >
            {item.icon(active)}
            <span className="text-xs font-medium leading-none" style={{ fontSize: "10px" }}>{item.label}</span>
            {"badge" in item && (item.badge ?? 0) > 0 && (
              <span
                className="absolute top-1.5 right-1/2 translate-x-4 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                style={{ backgroundColor: C.error, fontSize: "9px" }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number>(101);
  const [questionToAnswer, setQuestionToAnswer] = useState<MentorQuestion | null>(null);
  let toastId = 0;

  useEffect(() => {
    let active = true;

    getMe()
      .then((user) => {
        if (!active) return;
        setRole(
          user.role === "STUDENT"
            ? "mentee"
            : user.role === "MENTOR"
              ? "mentor"
              : "admin"
        );
        setScreen(
          user.role === "STUDENT"
            ? "dashboard"
            : user.role === "MENTOR"
              ? "mentor-dashboard"
              : "admin-dashboard"
        );
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(email: string, password: string) {
    const user = await localLogin(email, password);
    const nextRole =
      user.role === "STUDENT"
        ? "mentee"
        : user.role === "MENTOR"
          ? "mentor"
          : "admin";

    setRole(nextRole);
    setScreen(
      nextRole === "mentee"
        ? "dashboard"
        : nextRole === "mentor"
          ? "mentor-dashboard"
          : "admin-dashboard"
    );
  }

  async function handleLogout() {
    try {
      await localLogout();
    } finally {
      setRole(null);
      setScreen("login");
    }
  }



  function addToast(type: ToastType, message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleRoleSelect(r: Role) {
    if (!r) return;
    setRole(r);
    setScreen(
      r === "mentee"
        ? "onboarding-mentee"
        : r === "mentor"
          ? "onboarding-mentor"
          : "admin-dashboard",
    );
  }

  function openQuestion(id: string | number) {
    setSelectedQuestionId(id);
    setScreen("question-detail");
  }

  function openMentorAnswer(q: MentorQuestion) {
    setQuestionToAnswer(q);
    setScreen("mentor-answer");
  }


  const showMobileNav =
    role !== "admin" &&
    screen !== "login" &&
    screen !== "verify" &&
    !screen.startsWith("onboarding") &&
    !screen.startsWith("admin");

  return (
    <div className={`size-full relative${showMobileNav ? " has-mobile-nav" : ""}`}>
      {screen === "login" && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {screen === "verify" && (
        <VerifyScreen
          onNext={() => {
            addToast("success", "Email verified successfully!");
            setScreen("onboarding-role");
          }}
        />
      )}
      {screen === "onboarding-role" && (
        <OnboardingRoleScreen onSelect={handleRoleSelect} />
      )}
      {screen === "onboarding-mentee" && (
        <OnboardingMenteeScreen
          onNext={() => {
            addToast("success", "Welcome to MedMentor, Alex!");
            setScreen("dashboard");
          }}
        />
      )}
      {screen === "onboarding-mentor" && (
        <OnboardingMentorScreen
          onNext={() => {
            addToast("success", "Mentor profile submitted for review!");
            setScreen("mentor-dashboard");
          }}
        />
      )}
      {screen === "dashboard" && (
        <DashboardScreen
          onToast={addToast}
          onNavigate={setScreen}
          onOpenQuestion={openQuestion}
        />
      )}
      {screen === "ask-question" && (
        <AskQuestionScreen
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "ask-my-mentor" && (
        <AskQuestionScreen
          initialStep="my-mentor"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "ask-any-mentor" && (
        <AskQuestionScreen
          initialStep="any-mentor"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "ask-anonymous" && (
        <AskQuestionScreen
          initialStep="anonymous"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "feed" && (
        <FeedScreen
          onBack={() => setScreen("dashboard")}
          onOpenQuestion={openQuestion}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "question-detail" && (
        <QuestionDetailScreen
          questionId={selectedQuestionId}
          onBack={() => setScreen("feed")}
          onOpenQuestion={openQuestion}
          onNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "mentor-dashboard" && (
        <MentorDashboardScreen
          onNavigate={setScreen}
          onAnswerQuestion={openMentorAnswer}
          onToast={addToast}
        />
      )}
      {screen === "mentor-answer" && questionToAnswer && (
        <MentorAnswerScreen
          question={questionToAnswer}
          onBack={() => setScreen("mentor-dashboard")}
          onToast={addToast}
        />
      )}
      {(screen === "admin-dashboard" || screen === "admin-users" || screen === "admin-questions" || screen === "admin-moderation" || screen === "admin-reports" || screen === "admin-settings") && (
        <AdminScreen
          initialSection={
            screen === "admin-dashboard" ? "dashboard"
            : screen === "admin-users" ? "users"
            : screen === "admin-questions" ? "questions"
            : screen === "admin-moderation" ? "moderation"
            : screen === "admin-reports" ? "reports"
            : "settings"
          }
          onFullNavigate={setScreen}
          onToast={addToast}
        />
      )}
      {screen === "mentee-profile" && (
        <MenteeProfileScreen onNavigate={setScreen} onToast={addToast} />
      )}
      {screen === "mentor-profile" && (
        <MentorProfileScreen onNavigate={setScreen} onToast={addToast} />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          role={role}
          onBack={() => setScreen(role === "mentor" ? "mentor-dashboard" : "dashboard")}
        />
      )}

      {role && screen !== "login" && (
        <button
          type="button"
          onClick={handleLogout}
          className="fixed right-4 z-50 px-3 py-2 rounded-xl text-xs font-semibold bg-white card-shadow hover:opacity-80"
          style={{
            bottom: showMobileNav ? "76px" : "16px",
            border: `1px solid ${C.border}`,
            color: C.textSec,
          }}
        >
          Sign out
        </button>
      )}

      {/* Mobile bottom nav */}
      {screen !== "login" && screen !== "verify" && !screen.startsWith("onboarding") && !screen.startsWith("admin") && (
        <MobileNav
          role={role}
          screen={screen}
          onNavigate={setScreen}
        />
      )}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}
