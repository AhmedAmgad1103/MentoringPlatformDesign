import React, { useState, useRef, useEffect } from "react";
import {
  boostQuestion,
  createAnswer,
  updateAnswer,
  createQuestion,
  getFeedQuestions,
  getMentorQueue,
  getMentorMentees,
  getModerationQueue,
  approveQuestion,
  rejectQuestion,
  getAdminReports,
  getQuestionDetails,
  getQuestions,
  getMe,
  getAvailableRoles,
  mentorSignup,
  updateMentorApproval,
  getAdminQuestions,
  login,
  logout,
  sendMessage,
  unboostQuestion,
  updateAdminReport,
  updateQuestionStatus,
  reportQuestion,
  updateMe,
  getAdminUsers,
  getAdminMentors,
  getAdminStats,
  assignMentor,
  unassignMentor,
} from "./api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Screen =
  | "login"
  | "mentor-signup"
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
  | "notifications-page"
  | "mentor-dashboard"
  | "mentor-answer"
  | "admin-dashboard"
  | "admin-users"
  | "admin-mentors"
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

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
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
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

function MentorTierBadge({ points, size = "sm" }: { points: number; size?: "sm" | "md" }) {
  const tier = getMentorTier(points);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      }`}
      style={{ backgroundColor: tier.bg, color: tier.color }}
    >
      <span>{tier.emoji}</span> {tier.label}
    </span>
  );
}

const LEADERBOARD_MENTORS = [
  { id: 1, name: "Dr. Mariam Khaled", specialty: "Internal Medicine", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&auto=format", points: 285 },
  { id: 2, name: "Dr. Amara Osei", specialty: "Family Medicine", photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop&auto=format", points: 340 },
  { id: 3, name: "Dr. Priya Patel", specialty: "Neurology", photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=120&h=120&fit=crop&auto=format", points: 198 },
  { id: 4, name: "Dr. Samuel Chen", specialty: "Surgery", photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&h=120&fit=crop&auto=format", points: 132 },
  { id: 5, name: "Dr. Layla Ahmed", specialty: "Pediatrics", photo: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=120&h=120&fit=crop&auto=format", points: 61 },
  { id: 6, name: "Dr. Omar Hassan", specialty: "Entrepreneurship", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&auto=format", points: 24 },
].sort((a, b) => b.points - a.points);

const REWARD_MONTH_KEY = "medmentor_reward_month";
const CURRENT_REWARD_MONTH = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
})();

const REWARD_RESET_THIS_MONTH = (() => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(REWARD_MONTH_KEY);

  if (stored === null) {
    window.localStorage.setItem(REWARD_MONTH_KEY, CURRENT_REWARD_MONTH);
    return false;
  }

  if (stored !== CURRENT_REWARD_MONTH) {
    window.localStorage.setItem(REWARD_MONTH_KEY, CURRENT_REWARD_MONTH);
    return true;
  }

  return false;
})();

const CURRENT_MENTOR_POINTS = REWARD_RESET_THIS_MONTH ? 0 : MENTOR.points;

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
  moderationStatus?: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
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

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  detail: string;
  time: string;
  read: boolean;
  questionId: number | null;
}

const ALL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "mentor-answered",
    message: "Dr. Mariam Khaled answered your question",
    detail: "Your question about managing suspected PE in the ED received a detailed response.",
    time: "2 hours ago",
    read: false,
    questionId: 101,
  },
  {
    id: 2,
    type: "any-mentor-responded",
    message: "3 mentors responded to your Ask Any Mentor question",
    detail: "Your question about Step 1 study schedules now has multiple perspectives.",
    time: "5 hours ago",
    read: false,
    questionId: 101,
  },
  {
    id: 3,
    type: "anon-approved",
    message: "Your anonymous question was approved by a moderator",
    detail: "\"What should I expect during my first surgery rotation?\" is now live and visible to all students.",
    time: "Yesterday",
    read: false,
    questionId: 102,
  },
  {
    id: 4,
    type: "anon-response",
    message: "Your anonymous question received a new response",
    detail: "Dr. James Chen answered your question about Step 2 CK preparation.",
    time: "2 days ago",
    read: false,
    questionId: 101,
  },
  {
    id: 5,
    type: "rejected",
    message: "Your question was rejected by a moderator",
    detail: "Your submission may contain identifying information. Please review our anonymous posting guidelines before resubmitting.",
    time: "3 days ago",
    read: true,
    questionId: null,
  },
  {
    id: 6,
    type: "session",
    message: "Dr. Khaled confirmed your mentoring session",
    detail: "September 3 at 3:00 PM via video call. A calendar invite has been sent to your school email.",
    time: "3 days ago",
    read: true,
    questionId: null,
  },
  {
    id: 7,
    type: "helpful",
    message: "Your Ask Any Mentor response was marked helpful 5 times",
    detail: "Students found your answer about residency applications helpful.",
    time: "4 days ago",
    read: true,
    questionId: 105,
  },
];

// ─── MENTOR-SIDE DATA ─────────────────────────────────────────────────────────

const MENTOR_MENTEES_DATA = [
  {
    id: 1,
    name: "Alex Johnson",
    year: "M2",
    track: "Preclinical",
    photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&auto=format",
    lastActivity: "2 hours ago",
    lastQuestion: "How do I approach Step 2 CK in a 10-week dedicated block?",
    active: true,
    totalQuestions: 4,
  },
  {
    id: 2,
    name: "Sarah Chen",
    year: "M3",
    track: "Clinical Rotations",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    lastActivity: "Yesterday",
    lastQuestion: "Can you review my personal statement before I submit to ERAS?",
    active: false,
    totalQuestions: 7,
  },
  {
    id: 3,
    name: "Marcus Williams",
    year: "M1",
    track: "Preclinical",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    lastActivity: "3 days ago",
    lastQuestion: "How do I manage the volume of first-year coursework without burning out?",
    active: false,
    totalQuestions: 2,
  },
];

interface MentorQuestion {
  id: string | number;
  type: "private" | "any-mentor" | "anon-public" | "anon-private";
  question: string;
  content?: string;
  category: string;
  date: string;
  priority?: "high" | "normal";
  asker: { name: string; year?: string; track?: string; photo?: string } | null;
  responses: number;
  reportedByMe?: boolean;
}

const MENTOR_WAITING_QUESTIONS: MentorQuestion[] = [
  {
    id: 1001,
    type: "private",
    question: "How do I approach a patient presenting with chest pain in the outpatient setting? When do I refer to cardiology versus manage independently?",
    category: "Clinical Skills",
    date: "Aug 29, 2026",
    priority: "high",
    asker: {
      name: "Alex Johnson",
      year: "M2",
      track: "Preclinical",
      photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&auto=format",
    },
    responses: 0,
  },
  {
    id: 1002,
    type: "private",
    question: "Can you review my personal statement before I submit to ERAS? I'm applying primarily to internal medicine programs — I've attached a draft.",
    category: "Residency Match",
    date: "Aug 28, 2026",
    priority: "normal",
    asker: {
      name: "Sarah Chen",
      year: "M3",
      track: "Clinical Rotations",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format",
    },
    responses: 0,
  },
  {
    id: 1003,
    type: "private",
    question: "I'm struggling with renal physiology — the tubular transport concepts aren't clicking. Are there any frameworks or analogies that helped you understand them?",
    category: "Study Skills",
    date: "Aug 27, 2026",
    priority: "normal",
    asker: {
      name: "Marcus Williams",
      year: "M1",
      track: "Preclinical",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&auto=format",
    },
    responses: 0,
  },
];

const MENTOR_ANY_QUESTIONS: MentorQuestion[] = [
  {
    id: 2001,
    type: "any-mentor",
    question: "What's the single most important thing to focus on during M3 clinical rotations to set yourself up for a strong residency application?",
    category: "Clinical Rotations",
    date: "Aug 29, 2026",
    asker: {
      name: "Jordan Kim",
      year: "M2",
      track: "Preclinical",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format",
    },
    responses: 0,
  },
  {
    id: 2002,
    type: "any-mentor",
    question: "How do you decide between academic medicine and private practice? What were the factors that mattered most in your own decision?",
    category: "Residency Match",
    date: "Aug 28, 2026",
    asker: {
      name: "Priya Shah",
      year: "M3",
      track: "Clinical Rotations",
      photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format",
    },
    responses: 1,
  },
];

const MENTOR_ANON_QUESTIONS: MentorQuestion[] = [
  {
    id: 3001,
    type: "anon-private",
    question: "I've been having panic attacks during high-stakes exams. I'm terrified of telling my school. How do I manage this while keeping it private and not impacting my evaluations?",
    category: "Wellness & Burnout",
    date: "Aug 28, 2026",
    asker: null,
    responses: 0,
  },
  {
    id: 3002,
    type: "anon-public",
    question: "Is it normal to feel like you made the wrong career choice halfway through M2? I love medicine conceptually but I'm questioning everything about this path.",
    category: "Wellness & Burnout",
    date: "Aug 27, 2026",
    asker: null,
    responses: 2,
  },
];

const MENTEE_TOPICS = [
  "Board Prep (Step 1)", "Board Prep (Step 2)", "Clinical Skills", "Residency Applications",
  "Research & Publications", "Specialty Selection", "Work-Life Balance", "Interview Prep",
  "Note Writing", "Pharmacology", "Pathophysiology", "Ethics & Professionalism",
];

const MENTOR_SPECIALTIES = [
  "Internal Medicine", "Surgery", "Pediatrics", "Psychiatry", "Emergency Medicine",
  "Family Medicine", "Radiology", "Anesthesiology", "Neurology", "OB/GYN", "Dermatology", "Ophthalmology",
];

const MENTOR_EXPERTISE = [
  "Board Prep", "Clinical Skills", "Residency Applications", "Research", "Subspecialty Guidance",
  "Work-Life Balance", "Leadership", "Medical Ethics", "Wellness & Burnout", "Academic Medicine",
];

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="progress-step flex-1"
          style={{ backgroundColor: i < step ? C.primary : C.border }}
        />
      ))}
    </div>
  );
}

// ─── PLATFORM LOGO ────────────────────────────────────────────────────────────

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: { icon: 28, text: "text-base" }, md: { icon: 36, text: "text-xl" }, lg: { icon: 44, text: "text-2xl" } };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ width: s.icon, height: s.icon, background: `linear-gradient(135deg, ${C.brand} 0%, ${C.primary} 100%)` }}
      >
        <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 7v11h14V7L10 2z" fill="white" fillOpacity="0.25" />
          <path d="M7 14h6M7 11h6M10 8v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="6" r="1.5" fill="white" />
        </svg>
      </div>
      <div>
        <div className={`font-bold ${s.text} leading-tight tracking-tight`} style={{ color: C.text }}>
          MedMentor
        </div>
        {size !== "sm" && (
          <div className="text-xs leading-tight" style={{ color: C.textSec }}>
            Clinical Education Network
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: LOGIN ────────────────────────────────────────────────────────────

function LoginScreen({ onNext, onSignup }: { onNext: (email: string) => void; onSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState(false);

  function validateEmail(v: string) {
    if (!v) return "";
    if (!v.includes("@")) return "";
    if (!v.endsWith(".edu")) return "Please use your official medical school email address.";
    return "";
  }

  function handleEmailChange(v: string) {
    setEmail(v);
    if (touched) setEmailError(validateEmail(v));
  }

  function handleEmailBlur() {
    setTouched(true);
    setEmailError(validateEmail(email));
  }

  async function handleSubmit() {
    setTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err || !email || !password) return;

    try {
      // Authentication happens after role selection so a new mentor/admin account
      // is not accidentally created as a student.
      onNext(email.trim());
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    }
  }

  const isValid = email.endsWith(".edu") && password.length >= 1;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: C.bg }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[44%] flex-shrink-0"
        style={{ background: `linear-gradient(160deg, #3B2F7A 0%, #5B4EBF 55%, #7B6FD1 100%)` }}
      >
        <Logo size="md" />
        <div className="fade-in">
          <div className="mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="white" fillOpacity="0.2" />
                <path d="M11 16l3 3.5 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Connect with physician mentors who've walked your path
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              MedMentor pairs medical students with experienced physicians for personalized guidance on boards, clinical training, and career planning.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: "Board Exam Guidance", sub: "Proven strategies from attendings who aced Step 1 & 2" },
              { label: "Clinical Skills Coaching", sub: "Real feedback on presentations, notes, and procedures" },
              { label: "Residency Mentorship", sub: "Application reviews, specialty selection, interview prep" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Icons.Check />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{f.label}</div>
                  <div className="text-blue-200 text-xs mt-0.5">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[
              "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop",
              "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop",
              "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Mentor"
                className="w-9 h-9 rounded-full border-2 border-blue-700 object-cover"
              />
            ))}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">2,400+ physician mentors</div>
            <div className="text-blue-200 text-xs">across 180 specialties</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] fade-in">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: C.text }}>
              Welcome back
            </h1>
            <p style={{ color: C.textSec }} className="text-sm">
              Sign in to your MedMentor account
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <InputField
                label="Medical School Email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={handleEmailChange}
                error={emailError}
                helperText={!emailError ? "Use your official medical school email address to access the mentoring platform." : undefined}
                icon={<Icons.Mail />}
              />
              {/* live validation indicator */}
              {email.endsWith(".edu") && !emailError && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: C.successLight }}>
                    <Icons.Check />
                  </span>
                  <span className="text-xs font-medium" style={{ color: C.success }}>Valid school email</span>
                </div>
              )}
            </div>

            <InputField
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              icon={<Icons.Lock />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="p-1 rounded"
                  style={{ color: C.textSec }}
                >
                  <Icons.Eye open={showPw} />
                </button>
              }
            />

            <div className="flex justify-end">
              <button className="text-sm font-medium" style={{ color: C.primary }}>
                Forgot password?
              </button>
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={!isValid}>
              Sign In
            </Button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
              <span className="text-xs" style={{ color: C.textSec }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: C.border }} />
            </div>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => {
                setEmail("student@northwestern.edu");
                setEmailError("");
                setTouched(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="16" height="16" rx="4" fill={C.primary} fillOpacity="0.12" />
                <path d="M9 4L4 9l5 5 5-5-5-5z" fill={C.primary} />
              </svg>
              Continue with School Email (SSO)
            </Button>



            <p className="text-center text-sm" style={{ color: C.textSec }}>
              Don't have an account?{" "}
              <button className="font-semibold" style={{ color: C.primary }} onClick={onSignup}>
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: EMAIL VERIFICATION ───────────────────────────────────────────────

function MentorSignupScreen({ onBack, onSubmitted }: { onBack: () => void; onSubmitted: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    if (!email.endsWith(".edu")) { setError("Please use your official medical school email address."); return; }
    try {
      await mentorSignup(email);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit mentor signup.");
    }
  }
  if (submitted) return <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}><Card className="p-8 w-full max-w-md text-center"><h1 className="text-xl font-bold mb-2" style={{ color: C.text }}>Mentor signup submitted</h1><p className="text-sm mb-6" style={{ color: C.textSec }}>Your mentor account is pending admin approval. You can sign in as a mentor after it is approved.</p><Button variant="primary" fullWidth onClick={() => onSubmitted(email.trim())}>Continue</Button></Card></div>;
  return <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}><Card className="p-8 w-full max-w-md"><button onClick={onBack} className="text-sm mb-6" style={{ color: C.primary }}>← Back</button><h1 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Mentor sign up</h1><p className="text-sm mb-6" style={{ color: C.textSec }}>Create a mentor account. It will remain pending until an admin approves it.</p><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@medicalschool.edu" className="w-full px-3 py-2.5 rounded-xl text-sm mb-2 outline-none" style={{ border: `1px solid ${C.border}` }}/>{error && <p className="text-xs mb-3" style={{ color: C.error }}>{error}</p>}<Button variant="primary" fullWidth onClick={() => void submit()}>Submit mentor application</Button></Card></div>;
}
 
function VerifyScreen({ onNext }: { onNext: () => void }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleInput(i: number, v: string) {
    if (!/^\d*$/.test(v)) return;
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && next.join("").length === 6) {
      setTimeout(onNext, 300);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleResend() {
    setResent(true);
    setCode(["", "", "", "", "", ""]);
    setTimeout(() => setResent(false), 3000);
  }

  const filled = code.filter((d) => d !== "").length;

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: `linear-gradient(135deg, ${C.primaryLight} 0%, #C7D2FE 100%)` }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="3" y="7" width="26" height="18" rx="3" stroke={C.primary} strokeWidth="1.8" />
              <path d="M3 11l13 8 13-8" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <Logo size="sm" />
          <h1 className="text-2xl font-bold mt-4 mb-2" style={{ color: C.text }}>
            Check your school email
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
            We sent a 6-digit verification code to{" "}
            <span className="font-semibold" style={{ color: C.text }}>
              student@northwestern.edu
            </span>
          </p>
        </div>

        <Card className="p-8">
          <div className="flex gap-2 justify-center mb-6">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`otp-input ${digit ? "filled" : ""}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNext}
            disabled={filled < 6}
          >
            Verify Code
          </Button>

          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textSec }}>
              {resent ? (
                <span style={{ color: C.success }} className="font-medium">✓ Code resent!</span>
              ) : (
                <>
                  Didn't receive it?{" "}
                  <button onClick={handleResend} className="font-semibold" style={{ color: C.primary }}>
                    Resend code
                  </button>
                </>
              )}
            </p>
            <button className="text-sm" style={{ color: C.textSec }}>
              Change email
            </button>
          </div>
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: C.textSec }}>
          The code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
}

// ─── SCREEN: ONBOARDING — ROLE ────────────────────────────────────────────────

function OnboardingRoleScreen({ onSelect, availableRoles = ["STUDENT", "MENTOR"] }: { onSelect: (role: Role) => void; availableRoles?: string[] }) {
  const [selected, setSelected] = useState<Role>(null);

  const allowed = new Set(availableRoles);
  const roles: { role: Role; icon: React.ReactNode; title: string; sub: string; label: string }[] = [
    {
      role: "mentee",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="10" r="5" stroke={C.primary} strokeWidth="1.8" />
          <path d="M6 28c0-5.523 4.477-9 10-9s10 3.477 10 9" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 14l2 2-3 3" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "I am looking for guidance",
      sub: "Connect with physician mentors, ask questions, and get support on your medical education journey.",
      label: "Medical Student",
    },
    {
      role: "mentor",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="12" cy="10" r="4" stroke={C.primary} strokeWidth="1.8" />
          <path d="M4 26c0-4.418 3.582-7 8-7s8 3.582 8 7" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="12" r="3.5" fill={C.primaryLight} stroke={C.primary} strokeWidth="1.8" />
          <path d="M19.5 18.5c1-.3 2.5-.3 3.5-.3 3.5 0 6.5 2.3 7 5.3" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 9.5v2.5l1.5 1" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "I want to become a mentor",
      sub: "Share your clinical expertise and guide the next generation of medical professionals.",
      label: "Physician / Resident",
    },
    {
      role: "admin",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 4l9 4v6c0 6-3.8 11.3-9 14-5.2-2.7-9-8-9-14V8l9-4Z" stroke={C.primary} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="m11.5 15.5 3 3 6-6" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "I manage the platform",
      sub: "Manage users, questions, moderation, reports, and platform settings.",
      label: "Administrator",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
      <div className="w-full max-w-3xl fade-in">
        <div className="text-center mb-10">
          <Logo size="md" />
          <h1 className="text-2xl font-bold mt-6 mb-2" style={{ color: C.text }}>
            What are you here for?
          </h1>
          <p style={{ color: C.textSec }} className="text-sm">
            Tell us your goal so we can set up the right experience for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {roles.filter(({ role }) => role === "mentee" ? allowed.has("STUDENT") : allowed.has("MENTOR")).map(({ role, icon, title, sub, label }) => (
            <div
              key={role}
              className="role-card border-2 rounded-2xl p-6 flex flex-col gap-4"
              style={{
                borderColor: selected === role ? C.primary : C.border,
                backgroundColor: selected === role ? C.primaryLight : "#fff",
              }}
              onClick={() => setSelected(role)}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: selected === role ? "#fff" : C.primaryLight }}
              >
                {icon}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.textSec }}>
                  {label}
                </div>
                <div className="font-bold text-base mb-1.5" style={{ color: C.text }}>
                  {title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                  {sub}
                </p>
              </div>
              {selected === role && (
                <div className="self-start flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.primary }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: C.primary }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.5 1.5 3.5-3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
        >
          Continue
          <Icons.ChevronRight />
        </Button>
      </div>
    </div>
  );
}

// ─── SCREEN: ONBOARDING — MENTEE ─────────────────────────────────────────────

function OnboardingMenteeScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [track, setTrack] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  const total = 3;

  function toggleTopic(t: string) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
      <div className="w-full max-w-lg fade-in">
        <div className="flex items-center justify-between mb-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-xl transition-opacity hover:opacity-70"
              style={{ color: C.textSec, backgroundColor: C.borderLight }}
            >
              <Icons.ArrowLeft />
              {step === 2 ? "Your Profile" : "Interests"}
            </button>
          ) : <div />}
          <div className="text-sm font-medium" style={{ color: C.textSec }}>
            Step {step} of {total}
          </div>
        </div>
        <ProgressBar step={step} total={total} />

        {step === 1 && (
          <div className="flex flex-col gap-6 fade-in">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
                Tell us about yourself
              </h2>
              <p className="text-sm" style={{ color: C.textSec }}>
                This helps us match you with the right mentors.
              </p>
            </div>

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="avatar-upload w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer"
                style={{ backgroundColor: C.borderLight }}
              >
                <span style={{ color: C.textSec }}><Icons.Camera /></span>
                <span className="text-xs mt-1" style={{ color: C.textSec }}>Add photo</span>
              </div>
              <span className="text-xs" style={{ color: C.textSec }}>Optional — helps mentors recognize you</span>
            </div>

            <InputField
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChange={setName}
              icon={<Icons.User />}
            />

            <SelectField
              label="Year of Study"
              value={year}
              onChange={setYear}
              placeholder="Select your year"
              options={[
                { value: "M1", label: "M1 — First Year" },
                { value: "M2", label: "M2 — Second Year" },
                { value: "M3", label: "M3 — Third Year" },
                { value: "M4", label: "M4 — Fourth Year" },
              ]}
            />

            <SelectField
              label="Current Track"
              value={track}
              onChange={setTrack}
              placeholder="Select your track"
              options={[
                { value: "preclinical", label: "Preclinical" },
                { value: "clinical", label: "Clinical Rotations" },
              ]}
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep(2)}
              disabled={!name || !year || !track}
            >
              Continue
              <Icons.ChevronRight />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 fade-in">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
                What do you want help with?
              </h2>
              <p className="text-sm" style={{ color: C.textSec }}>
                Select all topics that apply — you can change these later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {MENTEE_TOPICS.map((t) => (
                <TopicChip
                  key={t}
                  label={t}
                  selected={topics.includes(t)}
                  onClick={() => toggleTopic(t)}
                />
              ))}
            </div>

            {topics.length > 0 && (
              <div
                className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
                style={{ backgroundColor: C.successLight, color: C.success }}
              >
                <Icons.Check />
                <span className="font-medium">{topics.length} topic{topics.length > 1 ? "s" : ""} selected</span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep(3)}
              disabled={topics.length === 0}
            >
              Continue
              <Icons.ChevronRight />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-6 fade-in text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.primaryLight} 0%, #C7D2FE 100%)` }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 20l7 7.5L30 12" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
                You're all set, {name.split(" ")[0]}!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                We're matching you with physician mentors based on your interests. You'll be connected shortly. In the meantime, explore questions from other students.
              </p>
            </div>
            <div
              className="w-full rounded-xl p-4 text-left"
              style={{ backgroundColor: C.primaryLight, border: `1px solid #C7D2FE` }}
            >
              <div className="text-sm font-semibold mb-2" style={{ color: C.primary }}>
                Your profile summary
              </div>
              <div className="flex flex-col gap-1 text-sm" style={{ color: C.text }}>
                <span><strong>Name:</strong> {name}</span>
                <span><strong>Year:</strong> {year}</span>
                <span><strong>Track:</strong> {track === "preclinical" ? "Preclinical" : "Clinical Rotations"}</span>
                <span><strong>Topics:</strong> {topics.slice(0, 3).join(", ")}{topics.length > 3 ? ` +${topics.length - 3} more` : ""}</span>
              </div>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={onNext}>
              Go to My Dashboard
              <Icons.ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: ONBOARDING — MENTOR ─────────────────────────────────────────────

function OnboardingMentorScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [years, setYears] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);

  const total = 3;

  function toggleExpertise(t: string) {
    setExpertise((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
      <div className="w-full max-w-lg fade-in">
        <div className="flex items-center justify-between mb-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-xl transition-opacity hover:opacity-70"
              style={{ color: C.textSec, backgroundColor: C.borderLight }}
            >
              <Icons.ArrowLeft />
              {step === 2 ? "Your Profile" : "Expertise"}
            </button>
          ) : <div />}
          <div className="text-sm font-medium" style={{ color: C.textSec }}>
            Step {step} of {total}
          </div>
        </div>
        <ProgressBar step={step} total={total} />

        {step === 1 && (
          <div className="flex flex-col gap-5 fade-in">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>Your professional profile</h2>
              <p className="text-sm" style={{ color: C.textSec }}>Help students find and connect with you.</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="avatar-upload w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer" style={{ backgroundColor: C.borderLight }}>
                <span style={{ color: C.textSec }}><Icons.Camera /></span>
                <span className="text-xs mt-1" style={{ color: C.textSec }}>Add photo</span>
              </div>
            </div>

            <InputField label="Full Name (with credentials)" placeholder="e.g. Dr. Jane Smith, MD" value={name} onChange={setName} icon={<Icons.User />} />

            <SelectField
              label="Specialty"
              value={specialty}
              onChange={setSpecialty}
              placeholder="Select your specialty"
              options={MENTOR_SPECIALTIES.map((s) => ({ value: s, label: s }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Medical School Graduation Year"
                value={gradYear}
                onChange={setGradYear}
                placeholder="Year"
                options={Array.from({ length: 40 }, (_, i) => {
                  const y = 2024 - i;
                  return { value: String(y), label: String(y) };
                })}
              />
              <SelectField
                label="Years in Practice"
                value={years}
                onChange={setYears}
                placeholder="Years"
                options={Array.from({ length: 40 }, (_, i) => ({
                  value: String(i + 1),
                  label: `${i + 1} year${i + 1 > 1 ? "s" : ""}`,
                }))}
              />
            </div>

            <Button variant="primary" size="lg" fullWidth onClick={() => setStep(2)} disabled={!name || !specialty}>
              Continue <Icons.ChevronRight />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5 fade-in">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>Areas of expertise</h2>
              <p className="text-sm" style={{ color: C.textSec }}>Select what you can best guide students on.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {MENTOR_EXPERTISE.map((t) => (
                <TopicChip key={t} label={t} selected={expertise.includes(t)} onClick={() => toggleExpertise(t)} />
              ))}
            </div>

            <TextAreaField
              label="Short Biography"
              placeholder="Briefly describe your background, clinical focus, and what you enjoy mentoring students on..."
              value={bio}
              onChange={setBio}
              rows={4}
            />

            <Button variant="primary" size="lg" fullWidth onClick={() => setStep(3)} disabled={expertise.length === 0}>
              Continue <Icons.ChevronRight />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-6 fade-in text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.successLight} 0%, #A7F3D0 100%)` }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 20l7 7.5L30 12" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
                Welcome, {name.split(" ").slice(0, 2).join(" ")}!
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                Your mentor profile is under review. Our team will verify your credentials within 24–48 hours. You'll receive an email once approved.
              </p>
            </div>
            <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: C.successLight, border: `1px solid #A7F3D0` }}>
              <div className="text-sm font-semibold mb-1" style={{ color: C.success }}>Profile submitted for review</div>
              <div className="text-xs" style={{ color: "#059669" }}>Estimated review time: 24–48 hours</div>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={onNext}>
              Go to Dashboard <Icons.ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: MENTEE DASHBOARD ─────────────────────────────────────────────────

function DashboardScreen({
  onToast,
  onNavigate,
  onOpenQuestion,
  notifReadIds,
  onMarkRead,
  onMarkAllRead,
}: {
  onToast: (t: ToastType, msg: string) => void;
  onNavigate: (s: Screen) => void;
  onOpenQuestion: (id: string | number) => void;
  notifReadIds?: number[];
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"questions" | "notifications">("questions");
  const [searchQuery, setSearchQuery] = useState("");
  const [backendQuestionCount, setBackendQuestionCount] = useState<number | null>(null);
  const [backendLoadError, setBackendLoadError] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<Awaited<ReturnType<typeof getQuestions>>>([]);
  const [currentUser, setCurrentUser] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const readIds = notifReadIds ?? [];
  const markRead = onMarkRead ?? (() => {});
  const markAllRead = onMarkAllRead ?? (() => {});
  const unreadCount = 0;
  const [selectedSuggestedMentor, setSelectedSuggestedMentor] = useState<{ name: string; specialty: string; available: boolean; photo: string } | null>(null);

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    let active = true;
    getQuestions()
      .then((questions) => {
        if (!active) return;
        setRecentQuestions(questions);
        setBackendQuestionCount(questions.length);
        setBackendLoadError(false);
      })
      .catch(() => {
        if (active) setBackendLoadError(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notifDropdownOpen) return;
    function handler(e: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node))
        setNotifDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifDropdownOpen]);

  const statusVariant: Record<string, "success" | "pending" | "error" | "info" | "neutral"> = {
    Answered: "success",
    "Awaiting Response": "pending",
    "Pending Approval": "info",
    Private: "neutral",
    Public: "info",
  };

  const QUICK_ACTIONS = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={C.primary} strokeWidth="1.6" />
          <path d="M4 20c0-4 3.582-6 8-6s8 2 8 6" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 10l2 2-3 3" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Ask My Mentor",
      sub: "Ask your assigned mentor a private question",
      color: C.primaryLight,
      border: "#C7D2FE",
      badge: currentUser?.assignedMentor?.name || "Not assigned",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="9" r="4" stroke="#0F9D6B" strokeWidth="1.6" />
          <circle cx="17" cy="9" r="3" stroke="#0F9D6B" strokeWidth="1.6" />
          <path d="M2 20c0-3.5 3.134-5 7-5 1.5 0 2.9.3 4 .9M14 20c0-2 1.5-3.5 5-3.5" stroke="#0F9D6B" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: "Ask Any Mentor",
      sub: "Get perspectives from mentors across the school",
      color: C.successLight,
      border: "#A7F3D0",
      badge: "Available mentors",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#E0A62A" strokeWidth="1.6" />
          <path d="M12 7v5l3 3" stroke="#E0A62A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2.5C5 4 3 6.8 3 10" stroke="#E0A62A" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: "Ask Anonymously",
      sub: "Ask without revealing your identity",
      color: C.pendingLight,
      border: "#FDE68A",
      badge: "Identity protected",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="#7C3AED" strokeWidth="1.6" />
          <path d="M7 9h10M7 13h7" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      title: "Browse Questions",
      sub: "Learn from questions other students have asked",
      color: "#EDE9FE",
      border: "#C4B5FD",
      badge: "Live database",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header / Nav */}
      <header
        className="sticky top-0 z-30 bg-white"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <div
            className="hidden sm:flex items-center rounded-xl px-3.5 py-2 gap-2 w-64"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: C.bg }}
          >
            <span style={{ color: C.textSec }}><Icons.Search /></span>
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Search questions, mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: C.text }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notifDropdownRef}>
              <button
                className="relative p-2 rounded-xl transition-colors"
                style={{ color: C.textSec }}
                onClick={() => setNotifDropdownOpen((o) => !o)}
              >
                <Icons.Bell />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: C.error, fontSize: 9 }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifDropdownOpen && (
                <NotificationDropdown
                  notifications={[]}
                  readIds={readIds}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onViewAll={() => {
                    setNotifDropdownOpen(false);
                    onNavigate("notifications-page");
                  }}
                  onOpenQuestion={(id) => {
                    setNotifDropdownOpen(false);
                    onOpenQuestion(id);
                  }}
                />
              )}
            </div>
            <button onClick={() => onNavigate("mentee-profile")} className="rounded-full hover:opacity-80 transition-opacity">
              <Avatar
                name={currentUser?.name || currentUser?.email?.split("@")[0] || "User"}
                size={36}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Greeting */}
        <div className="mb-6 sm:mb-8 fade-in">
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: C.text }}>
            Good morning, {currentUser?.name || currentUser?.email?.split("@")[0] || "there"} 👋
          </h1>
          <p style={{ color: C.textSec }} className="text-sm">
            How can we help you today?
          </p>
          {backendQuestionCount !== null && (
            <p className="text-xs mt-2 font-medium" style={{ color: C.success }}>
              Backend connected · {backendQuestionCount} question{backendQuestionCount === 1 ? "" : "s"} available
            </p>
          )}
          {backendQuestionCount === null && backendLoadError && !DEMO_MODE && (
            <p className="text-xs mt-2 font-medium" style={{ color: C.error }}>
              Backend unavailable — frontend is showing placeholder data.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {QUICK_ACTIONS.map((qa) => (
            <div
              key={qa.title}
              className="quick-action-card rounded-2xl p-5 cursor-pointer card-shadow"
              style={{ backgroundColor: qa.color, border: `1.5px solid ${qa.border}` }}
              onClick={() => qa.title === "Browse Questions" ? onNavigate("feed") : qa.title === "Ask My Mentor" ? onNavigate("ask-my-mentor") : qa.title === "Ask Any Mentor" ? onNavigate("ask-any-mentor") : qa.title === "Ask Anonymously" ? onNavigate("ask-anonymous") : onNavigate("ask-question")}
            >
              <div className="mb-3">{qa.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: C.text }}>
                {qa.title}
              </div>
              <p className="text-xs leading-snug mb-3" style={{ color: C.textSec }}>
                {qa.sub}
              </p>
              <span
                className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.7)", color: C.textSec }}
              >
                {qa.badge}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Questions + Notifications */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1" style={{ borderBottom: `1.5px solid ${C.border}` }}>
              {(["questions", "notifications"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2.5 text-sm font-medium capitalize relative transition-colors"
                  style={{
                    color: activeTab === tab ? C.primary : C.textSec,
                    borderBottom: activeTab === tab ? `2px solid ${C.primary}` : "2px solid transparent",
                    marginBottom: -1.5,
                  }}
                >
                  {tab === "notifications" ? "Notifications" : "Recent Questions"}
                  {tab === "notifications" && unreadCount > 0 && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: C.error, fontSize: 10 }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "questions" && (
              <div className="flex flex-col gap-3">
                {recentQuestions
                  .filter((q) =>
                    !searchQuery ||
                    q.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((q) => (
                    <Card
                      key={q.id}
                      className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onOpenQuestion(q.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium leading-snug flex-1" style={{ color: C.text }}>
                          {q.title}
                        </p>
                        <Badge
                          variant={
                            q.moderationStatus === "PENDING"
                              ? "info"
                              : q.status === "ANSWERED"
                                ? "success"
                                : q.status === "CLOSED"
                                  ? "neutral"
                                  : "pending"
                          }
                        >
                          {q.moderationStatus === "PENDING"
                            ? "Awaiting Approval"
                            : q.status === "ANSWERED"
                              ? "Answered"
                              : q.status === "CLOSED"
                                ? "Closed"
                                : "Awaiting Response"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: C.borderLight, color: C.textSec }}
                        >
                          {q.category}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: q.isAnonymous
                              ? "#F3E8FF"
                              : q.visibility === "PRIVATE"
                                ? C.pendingLight
                                : C.primaryLight,
                            color: q.isAnonymous
                              ? "#7C3AED"
                              : q.visibility === "PRIVATE"
                                ? C.pending
                                : C.primary,
                          }}
                        >
                          {q.isAnonymous
                            ? "👤 Anonymous"
                            : q.visibility === "PRIVATE"
                              ? "🔒 Private"
                              : "🌐 Public"}
                        </span>
                        <span className="text-xs" style={{ color: C.textSec }}>
                          {formatDateTime(q.createdAt)}
                        </span>
                        {q.moderationStatus === "PENDING" && (
                          <span className="text-xs font-medium" style={{ color: C.primary }}>
                            Awaiting admin approval
                          </span>
                        )}
                        {q.responses > 0 && (
                          <span className="text-xs flex items-center gap-1" style={{ color: C.textSec }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M10.5 6c0 2.485-2.015 4.5-4.5 4.5a4.47 4.47 0 01-2.25-.6L1.5 10.5l.6-2.25A4.47 4.47 0 011.5 6C1.5 3.515 3.515 1.5 6 1.5S10.5 3.515 10.5 6z"
                                stroke="currentColor"
                                strokeWidth="1.1"
                              />
                            </svg>
                            {q.responses} response{q.responses !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}

                {recentQuestions.filter((q) =>
                  !searchQuery ||
                  q.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: C.borderLight }}
                    >
                      <Icons.Search />
                    </div>
                    <p className="text-sm font-medium" style={{ color: C.text }}>
                      {searchQuery ? `No questions match "${searchQuery}"` : "No questions yet"}
                    </p>
                    <p className="text-xs" style={{ color: C.textSec }}>
                      {searchQuery ? "Try a different search term" : "Questions you submit will appear here, newest first."}
                    </p>
                  </div>
                )}

                <button
                  className="text-sm font-medium flex items-center gap-1.5 self-start mt-1"
                  style={{ color: C.primary }}
                  onClick={() => onNavigate("feed")}
                >
                  View all questions <Icons.ChevronRight />
                </button>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: C.textSec }}>
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button onClick={onMarkAllRead} className="text-xs font-semibold" style={{ color: C.primary }}>
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => onNavigate("notifications-page")} className="text-xs font-semibold" style={{ color: C.primary }}>
                      View all →
                    </button>
                  </div>
                </div>
                {ALL_NOTIFICATIONS.slice(0, 5).map((n) => {
                  const isRead = n.read || notifReadIds.includes(n.id);
                  return (
                    <Card
                      key={n.id}
                      className="p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        onMarkRead(n.id);
                        if (n.questionId) onOpenQuestion(n.questionId);
                      }}
                    >
                      <NotifIcon type={n.type} />
                      <div className="flex-1">
                        <p className="text-sm leading-snug" style={{ color: C.text, fontWeight: isRead ? 400 : 600 }}>
                          {n.message}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{n.detail}</p>
                        <p className="text-xs mt-1" style={{ color: C.textSec }}>{n.time}</p>
                      </div>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: C.primary }} />
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: My Mentor */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: C.textSec }}>
                MY MENTOR
              </h2>
              <Card className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={MENTOR.photo}
                      alt={MENTOR.name}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot available={MENTOR.available} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight" style={{ color: C.text }}>
                      {MENTOR.name}
                    </div>
                    <div className="text-xs mt-0.5 mb-1.5" style={{ color: C.textSec }}>
                      {MENTOR.specialty} · {MENTOR.hospital}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={MENTOR.available ? "success" : "pending"}>
                        {MENTOR.available ? "Available" : "Busy"}
                      </Badge>
                      <MentorTierBadge points={MENTOR.points} />
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed mb-3" style={{ color: C.textSec }}>
                  {MENTOR.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {MENTOR.expertise.map((e) => (
                    <span
                      key={e}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: C.primaryLight, color: C.primary }}
                    >
                      {e}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => onNavigate("ask-my-mentor")}
                  >
                    Ask My Mentor
                  </Button>
                  <button
                    onClick={() => onNavigate("leaderboard")}
                    className="text-xs font-semibold text-center py-1"
                    style={{ color: C.primary }}
                  >
                    🏆 See Top Mentors
                  </button>
                </div>
              </Card>
            </div>

            {/* Stats */}
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: C.textSec }}>
                MY STATS
              </h2>
              <Card className="divide-y" style={{ borderColor: C.border }}>
                {[
                  { label: "Questions asked", value: "4" },
                  { label: "Answers received", value: "7" },
                  { label: "Mentoring sessions", value: "2" },
                  { label: "Streak", value: "12 days 🔥" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs" style={{ color: C.textSec }}>{stat.label}</span>
                    <span className="text-sm font-bold" style={{ color: C.text }}>{stat.value}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* Suggested mentors */}
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: C.textSec }}>
                SUGGESTED MENTORS
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Dr. James Chen", specialty: "Emergency Medicine", available: true, photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=80&h=80&fit=crop" },
                  { name: "Dr. Priya Patel", specialty: "Neurology", available: false, photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=80&h=80&fit=crop" },
                ].map((m) => (
                  <Card key={m.name} className="flex items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSuggestedMentor(m)}>
                    <div className="relative flex-shrink-0">
                      <Avatar name={m.name} size={40} />
                      <span className="absolute -bottom-0.5 -right-0.5"><StatusDot available={m.available} /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{m.name}</div>
                      <div className="text-xs" style={{ color: C.textSec }}>{m.specialty}</div>
                    </div>
                    <span style={{ color: C.textSec }}><Icons.ChevronRight /></span>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedSuggestedMentor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedSuggestedMentor(null); }}
        >
          <div className="bg-white rounded-2xl card-shadow-lg w-full max-w-md p-6 fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <img src={selectedSuggestedMentor.photo} alt={selectedSuggestedMentor.name} className="w-16 h-16 rounded-full object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5"><StatusDot available={selectedSuggestedMentor.available} /></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold" style={{ color: C.text }}>{selectedSuggestedMentor.name}</h3>
                  <button type="button" onClick={() => setSelectedSuggestedMentor(null)} className="text-lg px-2 hover:opacity-70" style={{ color: C.textSec }}>✕</button>
                </div>
                <p className="text-sm mt-1" style={{ color: C.textSec }}>{selectedSuggestedMentor.specialty}</p>
                <div className="mt-3">
                  <Badge variant={selectedSuggestedMentor.available ? "success" : "pending"}>
                    {selectedSuggestedMentor.available ? "Available now" : "Currently busy"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-5 p-4 rounded-xl" style={{ backgroundColor: C.primaryLight, border: "1px solid " + C.border }}>
              <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                Mentor profile preview. Their full profile and mentor-matching flow can be connected to the backend later.
              </p>
            </div>
            <div className="flex justify-end mt-5">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSuggestedMentor(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATION ICON ────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const configs: Record<string, { bg: string; color: string }> = {
    "mentor-answered":      { bg: C.primaryLight,  color: C.primary  },
    "any-mentor-responded": { bg: C.primaryLight,  color: C.primary  },
    "anon-approved":        { bg: C.successLight,  color: C.success  },
    "anon-response":        { bg: "#EDE9FE",       color: "#7C3AED"  },
    "rejected":             { bg: C.errorLight,    color: C.error    },
    "session":              { bg: "#EDE9FE",       color: "#7C3AED"  },
    "helpful":              { bg: C.pendingLight,  color: C.pending  },
  };
  const c = configs[type] || { bg: C.borderLight, color: C.textSec };

  const svgs: Record<string, React.ReactNode> = {
    "mentor-answered": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.5 8.5c0 2.485-2.462 4.5-5.5 4.5a6.2 6.2 0 01-2.5-.52L2.5 13.5l.52-2.5A4.49 4.49 0 012 8.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 8.5l1.5 1.5L10 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    "any-mentor-responded": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12 7.5c0 2.209-2.015 4-4.5 4a5 5 0 01-2-.41L3 12.5l.41-2.09A3.55 3.55 0 013 7.5c0-2.209 2.015-4 4.5-4s4.5 1.791 4.5 4z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10.5 3.5a3 3 0 012.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    "anon-approved": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L3 4v4c0 3 2.2 5 5 6 2.8-1 5-3 5-6V4L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    "anon-response": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.5 8.5c0 2.485-2.462 4.5-5.5 4.5a6.2 6.2 0 01-2.5-.52L2.5 13.5l.52-2.5A4.49 4.49 0 012 8.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="8" cy="8.5" r="1" fill="currentColor" />
      </svg>
    ),
    "rejected": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    "session": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="10.5" r="1" fill="currentColor" />
      </svg>
    ),
    "helpful": (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3.5 7.5L2.5 13h7.5l1.5-5.5H8V4.5a1.5 1.5 0 00-3 0v3H3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M12.5 7.5h1.5V13h-1.5V7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {svgs[type] || svgs["anon-response"]}
    </div>
  );
}

// ─── NOTIFICATION DROPDOWN ────────────────────────────────────────────────────

function NotificationDropdown({
  notifications,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  onOpenQuestion,
}: {
  notifications: NotificationItem[];
  readIds: number[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onViewAll: () => void;
  onOpenQuestion: (id: number) => void;
}) {
  const unread = notifications.filter((n) => !n.read && !readIds.includes(n.id)).length;

  return (
    <div
      className="absolute top-full right-0 mt-2 fade-in rounded-2xl overflow-hidden card-shadow-lg"
      style={{
        width: 380,
        backgroundColor: "#fff",
        border: `1px solid ${C.border}`,
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: C.text }}>
            Notifications
          </span>
          {unread > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-white font-bold"
              style={{ backgroundColor: C.error, fontSize: 10 }}
            >
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold"
            style={{ color: C.primary }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      <div className="max-h-[340px] overflow-y-auto">
        {notifications.slice(0, 5).map((n) => {
          const isRead = n.read || readIds.includes(n.id);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                onMarkRead(n.id);
                if (n.questionId) onOpenQuestion(n.questionId);
              }}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{
                backgroundColor: isRead ? "#fff" : "#F5F8FF",
                borderBottom: `1px solid ${C.borderLight}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = C.borderLight)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = isRead ? "#fff" : "#F5F8FF")
              }
            >
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-snug"
                  style={{ color: C.text, fontWeight: isRead ? 400 : 600 }}
                >
                  {n.message}
                </p>
                <p
                  className="text-xs mt-0.5 overflow-hidden"
                  style={{
                    color: C.textSec,
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {n.detail}
                </p>
                <p className="text-xs mt-1" style={{ color: C.textSec }}>
                  {n.time}
                </p>
              </div>
              {!isRead && (
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: C.primary }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 text-center"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <button
          onClick={onViewAll}
          className="text-sm font-semibold"
          style={{ color: C.primary }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );
}

// ─── SHARED PAGE HEADER ───────────────────────────────────────────────────────

function PageHeader({
  onBack,
  backLabel = "Back",
  title,
  subtitle,
  actions,
  notifUnread,
  onBell,
}: {
  onBack: () => void;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  notifUnread?: number;
  onBell?: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 bg-white"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80 flex-shrink-0"
          style={{ color: C.textSec, backgroundColor: C.borderLight }}
        >
          <Icons.ArrowLeft />
          {backLabel}
        </button>
        {title && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate" style={{ color: C.text }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs truncate" style={{ color: C.textSec }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          {actions}
          {onBell !== undefined && (
            <button
              onClick={onBell}
              className="relative p-2 rounded-xl"
              style={{ color: C.textSec }}
            >
              <Icons.Bell />
              {!!notifUnread && notifUnread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: C.error, fontSize: 9 }}
                >
                  {notifUnread}
                </span>
              )}
            </button>
          )}
          <Logo size="sm" />
        </div>
      </div>
    </header>
  );
}

// ─── FEED QUESTION CARD ───────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  "Board Exams":       { bg: C.primaryLight,  color: C.primary   },
  "Clinical Rotations":{ bg: C.successLight,  color: C.success   },
  "Residency Match":   { bg: "#EDE9FE",       color: "#7C3AED"   },
  "Clinical Skills":   { bg: "#D1FAE5",       color: "#065F46"   },
  "Research":          { bg: "#FEF3C7",       color: "#92400E"   },
  "Study Skills":      { bg: "#DBEAFE",       color: "#1E40AF"   },
  "Wellness & Burnout":{ bg: "#FCE7F3",       color: "#9D174D"   },
  "Other":             { bg: C.borderLight,   color: C.textSec   },
};

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {category}
    </span>
  );
}

function FeedQuestionCard({
  question,
  onClick,
  isBoosted,
  onToggleBoost,
  onToast,
}: {
  question: FeedQuestion;
  onClick: () => void;
  isBoosted: boolean;
  onToggleBoost: (id: string | number) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(Boolean(question.reportedByMe));

  return (
    <>
      <Card
        className="p-5 cursor-pointer"
        onClick={onClick}
        style={{ transition: "box-shadow 0.2s, transform 0.2s" }}
      >
        <div
          onMouseEnter={(e) => {
            (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow =
              "0 8px 24px rgba(0,0,0,0.1)";
            (e.currentTarget.parentElement as HTMLDivElement).style.transform =
              "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow = "";
            (e.currentTarget.parentElement as HTMLDivElement).style.transform = "";
          }}
        >
          {/* Author row */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: C.borderLight }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke={C.textSec} strokeWidth="1.2" />
                <path d="M1.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke={C.textSec} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold" style={{ color: C.text }}>
                {question.isAnonymous === false ? "Student" : "Anonymous Mentee"}
              </div>
              <div className="text-xs" style={{ color: C.textSec }}>
                {question.date}
              </div>
            </div>
            <CategoryBadge category={question.category} />
          </div>

          {/* Question */}
          <h3
            className="font-semibold text-sm leading-snug mb-1.5"
            style={{ color: C.text }}
          >
            {question.title}
          </h3>
          <p
            className="text-xs leading-relaxed mb-3 overflow-hidden"
            style={{
              color: C.textSec,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {question.preview}
          </p>

          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {question.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: C.borderLight, color: C.textSec }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Stats footer */}
          <div
            className="flex items-center gap-3 pt-3"
            style={{ borderTop: `1px solid ${C.borderLight}` }}
          >
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: C.textSec }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10.5 6c0 2.485-2.015 4.5-4.5 4.5a4.47 4.47 0 01-2.25-.6L1.5 10.5l.6-2.25A4.47 4.47 0 011.5 6C1.5 3.515 3.515 1.5 6 1.5S10.5 3.515 10.5 6z" stroke="currentColor" strokeWidth="1.1" />
              </svg>
              <strong style={{ color: C.text }}>{question.responses}</strong> mentor{" "}
              {question.responses === 1 ? "answer" : "answers"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBoost(question.id);
              }}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: isBoosted ? C.primary : C.primaryLight,
                color: isBoosted ? "#fff" : C.primary,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1.5L8.5 6.5H1.5L5 1.5Z" fill="currentColor" />
              </svg>
              {question.boosted}
            </button>

            {!question.isMine && typeof question.id === "string" && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!reported) setReportOpen(true);
                  }}
                  className="text-xs font-medium px-2 py-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: reported ? C.successLight : C.borderLight,
                    color: reported ? C.success : C.textSec,
                  }}
                >
                  {reported ? "Reported" : "Report"}
                </button>
                {reportOpen && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ReportQuestionModal
                      questionId={question.id}
                      questionTitle={question.title}
                      onClose={() => setReportOpen(false)}
                      onReported={() => setReported(true)}
                      onToast={onToast}
                    />
                  </div>
                )}
              </>
            )}

            <span
              className="ml-auto flex items-center gap-1 text-xs font-semibold"
              style={{ color: C.primary }}
            >
              Read answers
              <Icons.ChevronRight />
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}

// ─── SCREEN: PUBLIC FEED ──────────────────────────────────────────────────────

function FeedScreen({
  onBack,
  onOpenQuestion,
  onNavigate,
  notifReadIds = [],
  onMarkRead = () => {},
  onMarkAllRead = () => {},
  onToast,
}: {
  onBack: () => void;
  onOpenQuestion: (id: string | number) => void;
  onNavigate: (s: Screen) => void;
  notifReadIds?: number[];
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "helpful" | "answered" | "boosted">("recent");
  const [boostedIds, setBoostedIds] = useState<Set<string | number>>(new Set());
  const [liveQuestions, setLiveQuestions] = useState<FeedQuestion[] | null>(null);

  useEffect(() => {
    let active = true;
    getFeedQuestions()
      .then((items) => {
        if (active) {
          setLiveQuestions(items);
          setBoostedIds(
            new Set(items.filter((q) => q.boostedByMe).map((q) => q.id))
          );
        }
      })
      .catch(() => {
        if (active) setLiveQuestions(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleBoost(id: string | number) {
    if (typeof id !== "string") {
      setBoostedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      return;
    }

    const alreadyBoosted = boostedIds.has(id);
    try {
      const result = alreadyBoosted
        ? await unboostQuestion(id)
        : await boostQuestion(id);

      setBoostedIds((prev) => {
        const next = new Set(prev);
        if (result.boosted) next.add(id);
        else next.delete(id);
        return next;
      });

      setLiveQuestions((prev) =>
        prev
          ? prev.map((q) =>
              q.id === id ? { ...q, boosted: result.boostCount } : q
            )
          : prev
      );
    } catch (error) {
      onToast(
        "error",
        error instanceof Error ? error.message : "Unable to update boost."
      );
    }
  }
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = ALL_NOTIFICATIONS.filter((n) => !n.read && !notifReadIds.includes(n.id)).length;

  useEffect(() => {
    if (!notifOpen) return;
    function h(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  const FEED_CATS = [
    "Clinical Rotations",
    "Board Exams",
    "Residency Match",
    "Clinical Skills",
    "Research",
    "Study Skills",
    "Wellness & Burnout",
    "Other",
  ];

  const sourceQuestions = liveQuestions ?? [];

  const filtered = sourceQuestions.filter((q) => {
    const matchSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.preview.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || q.category === activeCategory;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sort === "helpful") return b.helpful - a.helpful;
    if (sort === "answered") return b.responses - a.responses;
    if (sort === "boosted")
      return b.boosted - a.boosted;
    if (b.createdAtMs !== undefined && a.createdAtMs !== undefined)
      return b.createdAtMs - a.createdAtMs;
    if (typeof b.id === "number" && typeof a.id === "number")
      return b.id - a.id;
    return 0;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 hover:opacity-80 transition-opacity"
            style={{ color: C.textSec, backgroundColor: C.borderLight }}
          >
            <Icons.ArrowLeft />
            Dashboard
          </button>

          <div
            className="flex-1 flex items-center rounded-xl px-3.5 py-2 gap-2"
            style={{ border: `1.5px solid ${C.border}`, backgroundColor: "#fff" }}
          >
            <span style={{ color: C.textSec }}>
              <Icons.Search />
            </span>
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: C.text }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{ color: C.textSec, backgroundColor: C.borderLight }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-6 fade-in">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>
                Questions from Students
              </h1>
              <p className="text-sm" style={{ color: C.textSec }}>
                {liveQuestions?.length ?? 0} approved anonymous questions — browse, learn, and find answers
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <PrivacyBadge type="hidden" />
              <PrivacyBadge type="approved" />
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 fade-in" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all"
            style={{
              backgroundColor: !activeCategory ? C.primary : "#fff",
              color: !activeCategory ? "#fff" : C.textSec,
              border: `1.5px solid ${!activeCategory ? C.primary : C.border}`,
            }}
          >
            All questions
          </button>
          {FEED_CATS.map((cat) => {
            const active = activeCategory === cat;
            const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
                className="px-3.5 py-2 rounded-full text-xs font-medium flex-shrink-0 transition-all"
                style={{
                  backgroundColor: active ? col.color : "#fff",
                  color: active ? "#fff" : col.color,
                  border: `1.5px solid ${active ? col.color : col.bg}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: C.textSec }}>
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
            {activeCategory ? ` in ${activeCategory}` : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: C.borderLight }}>
            {(
              [
                { v: "recent", label: "Most Recent" },
                { v: "helpful", label: "Most Helpful" },
                { v: "answered", label: "Most Answered" },
                { v: "boosted", label: "Most Boosted" },
              ] as const
            ).map(({ v, label }) => (
              <button
                key={v}
                onClick={() => setSort(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: sort === v ? "#fff" : "transparent",
                  color: sort === v ? C.text : C.textSec,
                  boxShadow: sort === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            {filtered.map((q) => (
              <FeedQuestionCard
                key={q.id}
                question={q}
                onClick={() => onOpenQuestion(q.id)}
                isBoosted={boostedIds.has(q.id)}
                onToggleBoost={toggleBoost}
                onToast={onToast}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 gap-4 fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: C.borderLight }}
            >
              <Icons.Search />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>
                No questions found
              </p>
              <p className="text-xs" style={{ color: C.textSec }}>
                Try adjusting your search or category filter
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setActiveCategory(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SCREEN: QUESTION DETAIL ──────────────────────────────────────────────────

function QuestionDetailScreen({
  questionId,
  onBack,
  onOpenQuestion,
  onNavigate,
  notifReadIds = [],
  onMarkRead = () => {},
  onMarkAllRead = () => {},
  onToast,
}: {
  questionId: string | number;
  onBack: () => void;
  onOpenQuestion: (id: string | number) => void;
  onNavigate: (s: Screen) => void;
  notifReadIds?: number[];
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [sort, setSort] = useState<"helpful" | "newest">("helpful");
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string | number>>(new Set());
  const [liveQuestion, setLiveQuestion] =
    useState<Awaited<ReturnType<typeof getQuestionDetails>> | null>(null);
  const [loading, setLoading] = useState(typeof questionId === "string");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const [boostCount, setBoostCount] = useState(0);
  const [boostInFlight, setBoostInFlight] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");
  const [savingAnswer, setSavingAnswer] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => setCurrentUserId(me.id))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    if (typeof questionId !== "string") {
      setLoading(false);
      setLoadError(null);
      setLiveQuestion(null);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    getQuestionDetails(questionId)
      .then((item) => {
        if (!active) return;
        setLiveQuestion(item);
        setReported(Boolean(item.reportedByMe));
        setBoosted(Boolean(item.boostedByMe));
        setBoostCount(typeof item.boostCount === "number" ? item.boostCount : 0);
      })
      .catch((error) => {
        if (!active) return;
        setLiveQuestion(null);
        setLoadError(
          error instanceof Error ? error.message : "Unable to load this question."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [questionId]);

  const unread = 0;

  const liveCategory =
    typeof liveQuestion?.category === "string"
      ? liveQuestion.category.replace(/_/g, " ")
      : "Other";

  const liveAnswers = Array.isArray(liveQuestion?.answers)
    ? liveQuestion.answers
    : [];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}><p className="text-sm" style={{ color: C.textSec }}>Loading question…</p></div>;
  }

  if (!liveQuestion) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6" style={{ backgroundColor: C.bg }}><p className="text-sm" style={{ color: C.textSec }}>{loadError || "Question not found."}</p><Button variant="secondary" onClick={onBack}>Go back</Button></div>;
  }

  const question: FeedQuestion = {
    id: liveQuestion.id,
    title: liveQuestion.title ?? "Untitled question",
    preview: liveQuestion.content ?? "",
    full: liveQuestion.content ?? "",
    category: liveCategory,
    date: liveQuestion.createdAt ? formatDateTime(liveQuestion.createdAt) : "",
    responses: typeof liveQuestion.answerCount === "number" ? liveQuestion.answerCount : liveAnswers.length,
    helpful: 0,
    boosted: typeof liveQuestion.boostCount === "number" ? liveQuestion.boostCount : 0,
    tags: [],
    reportedByMe: Boolean(liveQuestion.reportedByMe),
    isMine: Boolean(liveQuestion.isMine),
    isAnonymous: Boolean(liveQuestion.isAnonymous),
  };

  const questionContent = liveQuestion.content ?? question.full;
  const isAnonymous = liveQuestion?.isAnonymous ?? question.isAnonymous ?? true;
  const canReport =
    Boolean(liveQuestion) &&
    !liveQuestion?.isMine &&
    liveQuestion?.visibility === "PUBLIC" &&
    (liveQuestion?.moderationStatus === "APPROVED" ||
      liveQuestion?.moderationStatus === "NOT_REQUIRED") &&
    typeof liveQuestion?.id === "string";

  const responses = liveQuestion
    ? liveAnswers.map((a) => ({
        id: a.id,
        mentor: {
          name: a.mentor?.name ?? "Mentor",
          specialty: "Physician Mentor",
          photo:
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&auto=format",
          expertise: [],
        },
        answer: a.content,
        timestamp: new Date(a.createdAt).toLocaleString(),
        helpfulCount: 0,
        mentorId: a.mentor?.id ?? null,
      }))
    : [];

  const sortedResponses = [...responses].sort((a, b) => {
    if (sort === "helpful") {
      return (
        b.helpfulCount +
        (helpfulVotes.has(b.id) ? 1 : 0) -
        (a.helpfulCount + (helpfulVotes.has(a.id) ? 1 : 0))
      );
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const relatedToShow: FeedQuestion[] = [];

  async function toggleBoost() {
    if (boostInFlight) return;
    if (typeof question.id !== "string") {
      setBoosted((prev) => !prev);
      setBoostCount((prev) => prev + (boosted ? -1 : 1));
      return;
    }

    setBoostInFlight(true);
    try {
      if (boosted) {
        const result = await unboostQuestion(question.id);
        setBoosted(false);
        setBoostCount(result.boostCount);
      } else {
        const result = await boostQuestion(question.id);
        setBoosted(true);
        setBoostCount(result.boostCount);
      }
    } catch (error) {
      onToast(
        "error",
        error instanceof Error ? error.message : "Unable to update boost."
      );
    } finally {
      setBoostInFlight(false);
    }
  }

  function toggleHelpful(id: string | number) {
    setHelpfulVotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startEditingAnswer(id: string, content: string) {
    setEditingAnswerId(id);
    setEditingAnswerContent(content);
  }

  function cancelEditingAnswer() {
    setEditingAnswerId(null);
    setEditingAnswerContent("");
  }

  async function saveEditedAnswer() {
    if (!editingAnswerId || typeof question.id !== "string") return;
    const content = editingAnswerContent.trim();
    if (!content) {
      onToast("error", "Response cannot be empty.");
      return;
    }

    setSavingAnswer(true);
    try {
      const result = await updateAnswer(question.id, editingAnswerId, content);
      setLiveQuestion((prev) =>
        prev
          ? {
              ...prev,
              answers: prev.answers.map((answer) =>
                answer.id === editingAnswerId ? result.item : answer
              ),
            }
          : prev
      );
      cancelEditingAnswer();
      onToast("success", "Response updated successfully.");
    } catch (error) {
      onToast(
        "error",
        error instanceof Error ? error.message : "Unable to update response."
      );
    } finally {
      setSavingAnswer(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <header
        className="sticky top-0 z-30 bg-white"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium flex-shrink-0 hover:opacity-80 transition-opacity"
            style={{ color: C.textSec, backgroundColor: C.borderLight }}
          >
            <Icons.ArrowLeft />
            Questions
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: C.text }}>
              {question.title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => onNavigate("notifications-page")}
                className="p-2 rounded-xl"
                style={{ color: C.textSec }}
                title={`${unread} unread notifications`}
              >
                <Icons.Bell />
                {unread > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: C.error, fontSize: 9 }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            </div>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 fade-in">
        {loading && (
          <Card className="p-10 text-center mb-6">
            <p className="text-sm" style={{ color: C.textSec }}>
              Loading question…
            </p>
          </Card>
        )}

        {loadError && !liveQuestion && (
          <Card className="p-6 mb-6" style={{ borderColor: C.error }}>
            <h2 className="text-base font-bold mb-2" style={{ color: C.text }}>
              Could not load this question
            </h2>
            <p className="text-sm mb-4" style={{ color: C.textSec }}>
              {loadError}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBack}>Back</Button>
              {typeof questionId === "string" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setLoadError(null);
                    setLoading(true);
                    getQuestionDetails(questionId)
                      .then((item) => {
                        setLiveQuestion(item);
                        setReported(Boolean(item.reportedByMe));
                        setBoosted(Boolean(item.boostedByMe));
                        setBoostCount(item.boostCount);
                      })
                      .catch((error) =>
                        setLoadError(
                          error instanceof Error
                            ? error.message
                            : "Unable to load this question."
                        )
                      )
                      .finally(() => setLoading(false));
                  }}
                >
                  Try again
                </Button>
              )}
            </div>
          </Card>
        )}

        {!loading && !loadError && (
          <>
            <Card className="p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.borderLight }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="4" stroke={C.textSec} strokeWidth="1.4" />
                    <path
                      d="M3 19c0-3.866 3.134-6 7-6s7 2.134 7 6"
                      stroke={C.textSec}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: C.text }}>
                    {isAnonymous ? "Anonymous Mentee" : liveQuestion?.student?.name ?? "Student"}
                  </div>
                  <div className="text-xs" style={{ color: C.textSec }}>
                    {question.date}
                  </div>
                  {liveQuestion?.isMine && liveQuestion.moderationStatus === "PENDING" && (
                    <div
                      className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: C.primaryLight, color: C.primary }}
                    >
                      Awaiting Approval
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {isAnonymous && <PrivacyBadge type="hidden" />}
                  <PrivacyBadge type={liveQuestion?.visibility === "PUBLIC" ? "public" : "private"} />
                  <CategoryBadge category={question.category} />
                </div>
              </div>

              <h1 className="text-xl font-bold mb-3 leading-snug" style={{ color: C.text }}>
                {question.title}
              </h1>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mb-5" style={{ color: C.text }}>
                {questionContent}
              </p>

              <div
                className="flex items-center gap-3 flex-wrap pt-4"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <span className="text-xs" style={{ color: C.textSec }}>
                  <strong style={{ color: C.text }}>
                    {liveQuestion?.answerCount ?? question.responses}
                  </strong>{" "}
                  {(liveQuestion?.answerCount ?? question.responses) === 1 ? "answer" : "answers"}
                </span>

                <button
                  type="button"
                  onClick={() => void toggleBoost()}
                  disabled={Boolean(liveQuestion?.isMine) || boostInFlight}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: boosted ? C.primary : C.primaryLight,
                    color: boosted ? "#fff" : C.primary,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1.5L8.5 6.5H1.5L5 1.5Z" fill="currentColor" />
                  </svg>
                  {boostCount}
                </button>

                {canReport && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!reported) setReportOpen(true);
                      }}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-xl"
                      style={{
                        backgroundColor: reported ? C.successLight : C.borderLight,
                        color: reported ? C.success : C.textSec,
                      }}
                    >
                      {reported ? "Reported" : "Report"}
                    </button>
                    {reported && (
                      <span className="text-xs" style={{ color: C.success }}>
                        This post has been reported to an admin.
                      </span>
                    )}
                  </>
                )}
              </div>
            </Card>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-bold text-base" style={{ color: C.text }}>
                  Mentor Responses
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: C.primaryLight, color: C.primary }}
                  >
                    {responses.length}
                  </span>
                </h2>

                {responses.length > 0 && (
                  <div
                    className="flex items-center gap-1 p-1 rounded-xl"
                    style={{ backgroundColor: C.borderLight }}
                  >
                    {(["helpful", "newest"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSort(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                        style={{
                          backgroundColor: sort === s ? "#fff" : "transparent",
                          color: sort === s ? C.text : C.textSec,
                        }}
                      >
                        {s === "helpful" ? "Most Helpful" : "Newest"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {responses.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: C.text }}>
                    No mentor responses yet
                  </p>
                  <p className="text-xs" style={{ color: C.textSec }}>
                    Your question is waiting for a mentor response.
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-4">
                  {sortedResponses.map((r) => {
                    const voted = helpfulVotes.has(r.id);
                    const count = r.helpfulCount + (voted ? 1 : 0);
                    return (
                      <Card key={r.id} className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={r.mentor.photo}
                            alt={r.mentor.name}
                            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: C.text }}>
                            {r.mentor.name}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                          {r.mentor.specialty} · {r.timestamp}
                        </div>
                      </div>
                    </div>
                    {editingAnswerId === String(r.id) ? (
                      <div className="mb-4">
                        <textarea
                          rows={6}
                          value={editingAnswerContent}
                          onChange={(e) => setEditingAnswerContent(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-white outline-none resize-none rounded-xl"
                          style={{ color: C.text, border: "1.5px solid " + C.primary }}
                        />
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <Button variant="secondary" size="sm" onClick={cancelEditingAnswer} disabled={savingAnswer}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" onClick={() => void saveEditedAnswer()} disabled={savingAnswer}>
                            {savingAnswer ? "Saving…" : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: C.text }}>
                        {r.answer}
                      </p>
                    )}
                        <div
                          className="flex items-center justify-between pt-3"
                          style={{ borderTop: `1px solid ${C.border}` }}
                        >
                          <button
                            onClick={() => toggleHelpful(r.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
                            style={{
                              backgroundColor: voted ? C.successLight : C.borderLight,
                              color: voted ? C.success : C.textSec,
                              border: `1px solid ${voted ? "#A7F3D0" : C.border}`,
                            }}
                          >
                            👍 Helpful · {count}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {relatedToShow.length > 0 && !liveQuestion && (
              <section>
                <h2 className="font-bold text-base mb-4" style={{ color: C.text }}>
                  Related Questions
                </h2>
                <div className="flex flex-col gap-3">
                  {relatedToShow.map((q) => (
                    <Card
                      key={q.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onOpenQuestion(q.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>
                            {q.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <CategoryBadge category={q.category} />
                            <span className="text-xs" style={{ color: C.textSec }}>
                              {q.responses} answers
                            </span>
                          </div>
                        </div>
                        <Icons.ChevronRight />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {reportOpen && canReport && liveQuestion && (
        <ReportQuestionModal
          questionId={liveQuestion.id}
          questionTitle={liveQuestion.title}
          onClose={() => setReportOpen(false)}
          onReported={() => setReported(true)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ─── ASK QUESTION SCREEN ─────────────────────────────────────────────────────

type AskStep =
  | "select"
  | "my-mentor"
  | "any-mentor"
  | "anonymous"
  | "anon-public"
  | "anon-private"
  | "success-my-mentor"
  | "success-any-mentor"
  | "success-anon-public"
  | "success-anon-private";

function TagInput({
  tags,
  onChange,
  placeholder = "Add a tag and press Enter",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: C.text }}>
        Tags <span className="font-normal" style={{ color: C.textSec }}>(optional)</span>
      </label>
      <div
        className="flex flex-wrap gap-1.5 rounded-xl px-3 py-2 min-h-[46px] transition-all duration-150"
        style={{
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          backgroundColor: "#fff",
          boxShadow: focused ? `0 0 0 3px rgba(91,78,191,0.12)` : "none",
        }}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: C.primaryLight, color: C.primary }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="ml-0.5 hover:opacity-70"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-xs bg-transparent outline-none py-1 placeholder:text-gray-400"
          style={{ color: C.text }}
        />
      </div>
      <p className="text-xs" style={{ color: C.textSec }}>
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}

function AttachmentZone({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: C.text }}>
        Attachment <span className="font-normal" style={{ color: C.textSec }}>(optional)</span>
      </label>
      {file ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: C.primaryLight, border: `1.5px solid #C7D2FE` }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="1" width="11" height="16" rx="2" stroke={C.primary} strokeWidth="1.4" />
            <path d="M5 6h5M5 9h5M5 12h3" stroke={C.primary} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-medium flex-1 truncate" style={{ color: C.primary }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-medium px-2 py-1 rounded-lg hover:opacity-80"
            style={{ color: C.error, backgroundColor: C.errorLight }}
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          className="flex flex-col items-center gap-2 px-4 py-6 rounded-xl cursor-pointer transition-all duration-150 hover:border-blue-400"
          style={{ border: `2px dashed ${C.border}`, backgroundColor: C.bg }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v12M7 9l5-5 5 5" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20h16" stroke={C.textSec} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm" style={{ color: C.textSec }}>
            <span className="font-semibold" style={{ color: C.primary }}>Upload a file</span> or drag and drop
          </span>
          <span className="text-xs" style={{ color: C.textSec }}>PDF, PNG, JPG up to 10MB</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

function AskPageHeader({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className="sticky top-0 z-20 bg-white"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ color: C.textSec, backgroundColor: C.borderLight }}
        >
          <Icons.ArrowLeft />
          Dashboard
        </button>
        <div>
          <h1 className="text-base font-bold leading-tight" style={{ color: C.text }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs" style={{ color: C.textSec }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <Logo size="sm" />
        </div>
      </div>
    </div>
  );
}

function QuestionForm({
  title: formTitle,
  question,
  category,
  tags,
  attachment,
  onTitle,
  onQuestion,
  onCategory,
  onTags,
  onAttachment,
  showTags = false,
  privacyNotice,
  onSubmit,
  submitLabel = "Submit Question",
  disabled,
}: {
  title: string;
  question: string;
  category: string;
  tags: string[];
  attachment: File | null;
  onTitle: (v: string) => void;
  onQuestion: (v: string) => void;
  onCategory: (v: string) => void;
  onTags: (v: string[]) => void;
  onAttachment: (f: File | null) => void;
  showTags?: boolean;
  privacyNotice?: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <InputField
        label="Question Title"
        placeholder="e.g. What's the best approach to Step 1 study in a 10-week block?"
        value={formTitle}
        onChange={onTitle}
      />
      <TextAreaField
        label="Question"
        placeholder="Provide as much detail as you'd like. More context helps mentors give better answers."
        value={question}
        onChange={onQuestion}
        rows={5}
      />
      <SelectField
        label="Category"
        value={category}
        onChange={onCategory}
        placeholder="Select a category"
        options={ASK_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      {showTags && <TagInput tags={tags} onChange={onTags} />}
      <AttachmentZone file={attachment} onChange={onAttachment} />
      {privacyNotice}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onSubmit}
        disabled={disabled || !formTitle || !question || !category}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

function AskQuestionScreen({
  onBack,
  onNavigate,
  onOpenQuestion,
  onToast,
  initialStep = "select",
}: {
  onBack: () => void;
  onNavigate: (s: Screen) => void;
  onOpenQuestion: (id: string | number) => void;
  onToast: (t: ToastType, msg: string) => void;
  initialStep?: AskStep;
}) {
  const [step, setStep] = useState<AskStep>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sort, setSort] = useState<"helpful" | "newest" | "relevant">("helpful");
  const [helpfulVotes, setHelpfulVotes] = useState<Set<number>>(new Set());
  const [submittedQuestionId, setSubmittedQuestionId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);

  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  function resetForm() {
    setTitle("");
    setQuestion("");
    setCategory("");
    setTags([]);
    setAttachment(null);
  }

  async function handleSubmit(successStep: AskStep, toastMsg: string, privacy: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await createQuestion({ title: title.trim(), category, body: question.trim(), privacy });
      setSubmittedQuestionId(created.id);
      onToast("success", toastMsg);
      setStep(successStep);
    } catch (error) {
      if (DEMO_MODE) {
        onToast("success", toastMsg);
        setStep(successStep);
      } else {
        onToast("error", error instanceof Error ? error.message : "Unable to submit the question.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleHelpful(id: number) {
    setHelpfulVotes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const sortedResponses: typeof SAMPLE_RESPONSES = [];

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader onBack={onBack} title="Ask a Question" subtitle="Choose how you want to ask" />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="text-center mb-10 fade-in">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
              What would you like to ask?
            </h2>
            <p className="text-sm" style={{ color: C.textSec }}>
              Choose how your question will be shared and who can respond.
            </p>
          </div>

          <div className="flex flex-col gap-4 fade-in">
            {/* Ask My Mentor */}
            <div
              className="quick-action-card rounded-2xl p-6 cursor-pointer card-shadow"
              style={{ backgroundColor: "#fff", border: `2px solid ${C.border}` }}
              onClick={() => { resetForm(); setStep("my-mentor"); }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.primaryLight }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="9" r="5" stroke={C.primary} strokeWidth="1.8" />
                    <path d="M4 24c0-5.523 4.477-8 10-8s10 2.477 10 8" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M21 11.5l2.5 2.5-3.5 3.5" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base" style={{ color: C.text }}>Ask My Mentor</h3>
                    <PrivacyBadge type="private" />
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSec }}>
                    Send a private question directly to your assigned mentor. Only you and Dr. Mariam Khaled will see this question.
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop"
                      alt={currentUser?.assignedMentor?.name || "Assigned mentor"}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-medium" style={{ color: C.text }}>Dr. Mariam Khaled · Internal Medicine</span>
                    <StatusDot available />
                  </div>
                </div>
                <span style={{ color: C.textSec }} className="mt-1 flex-shrink-0"><Icons.ChevronRight /></span>
              </div>
            </div>

            {/* Ask Any Mentor */}
            <div
              className="quick-action-card rounded-2xl p-6 cursor-pointer card-shadow"
              style={{ backgroundColor: "#fff", border: `2px solid ${C.border}` }}
              onClick={() => { resetForm(); setStep("any-mentor"); }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.successLight }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="10" cy="10" r="4" stroke={C.success} strokeWidth="1.8" />
                    <circle cx="20" cy="10" r="3.5" stroke={C.success} strokeWidth="1.8" />
                    <path d="M2 24c0-4.418 3.582-7 8-7 2 0 3.8.6 5.2 1.6" stroke={C.success} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M16 22c0-2.5 1.8-4 5-4 3 0 5 1.5 5 4" stroke={C.success} strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base" style={{ color: C.text }}>Ask Any Mentor</h3>
                    <PrivacyBadge type="public" />
                    <PrivacyBadge type="mentors" />
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: C.textSec }}>
                    Ask the school's physician mentors for guidance. Your name, year of study, and profile picture will be visible on the question. Receive perspectives from people with different training paths.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      {[
                        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop",
                        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop",
                        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=40&h=40&fit=crop",
                      ].map((src, i) => (
                        <img key={i} src={src} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: C.textSec }}>2,400+ mentors available to answer</span>
                  </div>
                </div>
                <span style={{ color: C.textSec }} className="mt-1 flex-shrink-0"><Icons.ChevronRight /></span>
              </div>
            </div>

            {/* Ask Anonymously */}
            <div
              className="quick-action-card rounded-2xl p-6 cursor-pointer card-shadow"
              style={{ backgroundColor: "#fff", border: `2px solid ${C.border}` }}
              onClick={() => { resetForm(); setStep("anonymous"); }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#FEF3C7" }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="11" r="5" stroke={C.pending} strokeWidth="1.8" />
                    <path d="M4 25c0-5.523 4.477-8 10-8s10 2.477 10 8" stroke={C.pending} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M14 4L14 2M9.2 5.8L7.8 4.4M18.8 5.8L20.2 4.4" stroke={C.pending} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-base" style={{ color: C.text }}>Ask Anonymously</h3>
                    <PrivacyBadge type="hidden" />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSec }}>
                    Ask questions without revealing your identity. Choose between a public question that others can learn from, or a completely private question only mentors can access.
                  </p>
                </div>
                <span style={{ color: C.textSec }} className="mt-1 flex-shrink-0"><Icons.ChevronRight /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ASK MY MENTOR ─────────────────────────────────────────────────────────
  if (step === "my-mentor") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader
          onBack={onBack}
          title="Ask My Mentor"
          subtitle={`Private question to ${currentUser?.assignedMentor?.name || "your assigned mentor"}`}
        />
        <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
          {/* Mentor preview */}
          <Card className="p-4 mb-6 flex items-center gap-3">
            <div className="relative">
              <Avatar name={currentUser?.assignedMentor?.name || "Assigned mentor"} size={48} />
              <span className="absolute -bottom-0.5 -right-0.5"><StatusDot available /></span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: C.text }}>{currentUser?.assignedMentor?.name || "Assigned mentor"}</div>
              <div className="text-xs" style={{ color: C.textSec }}>Assigned mentor</div>
            </div>
            <PrivacyBadge type="private" />
          </Card>

          <QuestionForm
            title={title}
            question={question}
            category={category}
            tags={tags}
            attachment={attachment}
            onTitle={setTitle}
            onQuestion={setQuestion}
            onCategory={setCategory}
            onTags={setTags}
            onAttachment={setAttachment}
            showTags={false}
            privacyNotice={
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: C.borderLight, border: `1px solid ${C.border}` }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
                  <rect x="5" y="8" width="8" height="7" rx="1.5" stroke={C.textSec} strokeWidth="1.3" />
                  <path d="M6.5 8V6a3.5 3.5 0 017 0v2" stroke={C.textSec} strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="9" cy="11.5" r="1" fill={C.textSec} />
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: C.textSec }}>
                  <strong style={{ color: C.text }}>Privacy notice:</strong> Only you and your assigned mentor will be able to see this question and any responses. It will never appear in the public feed.
                </p>
              </div>
            }
            onSubmit={() => handleSubmit("success-my-mentor", "Question sent to your mentor!", "private")}
            submitLabel="Send to your mentor"
          />
        </div>
      </div>
    );
  }

  // ── SUCCESS: MY MENTOR ────────────────────────────────────────────────────
  if (step === "success-my-mentor") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
        <div className="w-full max-w-md text-center fade-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `linear-gradient(135deg, ${C.successLight} 0%, #A7F3D0 100%)` }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 20l7 7.5L30 12" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Your question has been sent.</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: C.textSec }}>
            Your assigned mentor will receive a notification and typically responds within 24–48 hours. You'll be notified by email when she replies.
          </p>
          <Card className="p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <PrivacyBadge type="private" />
              <span className="text-xs" style={{ color: C.textSec }}>Sent just now</span>
            </div>
            <p className="text-sm font-medium" style={{ color: C.text }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: C.textSec }}>{category}</p>
          </Card>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!submittedQuestionId}
              onClick={() => submittedQuestionId && onOpenQuestion(submittedQuestionId)}
            >
              View Question
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── ASK ANY MENTOR ────────────────────────────────────────────────────────
  if (step === "any-mentor") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader
          onBack={onBack}
          title="Ask Any Mentor"
          subtitle="Visible to all physician mentors at the school"
        />
        <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
          {/* Identity preview */}
          <Card className="p-4 mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.textSec }}>
              Your question will appear as:
            </div>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop"
                alt="Alex Johnson"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-sm" style={{ color: C.text }}>Alex Johnson</div>
                <div className="text-xs" style={{ color: C.textSec }}>M2 · Clinical Rotations</div>
              </div>
              <div className="ml-auto flex gap-2">
                <PrivacyBadge type="public" />
                <PrivacyBadge type="mentors" />
              </div>
            </div>
          </Card>

          <QuestionForm
            title={title}
            question={question}
            category={category}
            tags={tags}
            attachment={attachment}
            onTitle={setTitle}
            onQuestion={setQuestion}
            onCategory={setCategory}
            onTags={setTags}
            onAttachment={setAttachment}
            showTags
            privacyNotice={
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: C.successLight, border: `1px solid #A7F3D0` }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="9" cy="9" r="8" stroke={C.success} strokeWidth="1.3" />
                  <path d="M6 9l2 2 4-4" stroke={C.success} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: "#065F46" }}>
                  Your name, profile picture, year, and track are visible to mentors and other students. All physician mentors can respond, and other students can read the answers.
                </p>
              </div>
            }
            onSubmit={() => handleSubmit("success-any-mentor", "Question shared with all mentors!", "any-mentor")}
            submitLabel="Share with Mentors"
          />
        </div>
      </div>
    );
  }

  // ── SUCCESS: ANY MENTOR ──────────────────────────────────────────────────
  if (step === "success-any-mentor") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
        <div className="w-full max-w-md text-center fade-in">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: C.successLight }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M10 20l7 7.5L30 12" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <PrivacyBadge type="public" />
          <h2 className="text-2xl font-bold mt-3 mb-2" style={{ color: C.text }}>Question shared.</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: C.textSec }}>Your question is now stored in the database and available to mentors according to its visibility and moderation status.</p>
          <Card className="p-4 mb-6 text-left">
            <p className="text-sm font-medium" style={{ color: C.text }}>{title}</p>
            <p className="text-xs mt-1" style={{ color: C.textSec }}>{category}</p>
          </Card>
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth disabled={!submittedQuestionId} onClick={() => submittedQuestionId && onOpenQuestion(submittedQuestionId)}>View Question</Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onBack}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── ASK ANONYMOUSLY — LANDING ─────────────────────────────────────────────
  if (step === "anonymous") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader
          onBack={onBack}
          title="Ask Anonymously"
          subtitle="Your identity is fully protected"
        />
        <div className="max-w-3xl mx-auto px-6 py-8 fade-in">
          {/* Privacy explanation panel */}
          <div
            className="rounded-2xl p-5 mb-8 flex items-start gap-4"
            style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", border: `1px solid #FCD34D` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="5" y="10" width="12" height="9" rx="2" stroke={C.pending} strokeWidth="1.5" />
                <path d="M8 10V7.5a4 4 0 018 0V10" stroke={C.pending} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="11" cy="14.5" r="1.5" fill={C.pending} />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm mb-1.5" style={{ color: "#92400E" }}>Your identity is protected</div>
              <div className="flex flex-col gap-1">
                {[
                  "Your name, email address, and profile picture are never shown to mentors or other students.",
                  'You will appear as "Anonymous Mentee" on all anonymous questions.',
                  "MedMentor's moderation team can see your identity only to prevent misuse — it is never shared with mentors.",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-xs" style={{ color: "#78350F" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-0.5">
                      <circle cx="6" cy="6" r="5" fill={C.pending} fillOpacity="0.3" />
                      <path d="M3.5 6l2 2 3-3" stroke={C.pending} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Choose your anonymous question type</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Public anonymous */}
            <div
              className="quick-action-card rounded-2xl p-6 cursor-pointer flex flex-col gap-4 card-shadow"
              style={{ backgroundColor: "#fff", border: `2px solid ${C.border}` }}
              onClick={() => { resetForm(); setStep("anon-public"); }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.primaryLight }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke={C.primary} strokeWidth="1.6" />
                  <path d="M3 12h18M12 3c-2.5 3-2.5 13 0 18M12 3c2.5 3 2.5 13 0 18" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-bold text-sm" style={{ color: C.text }}>Public Anonymous</h4>
                  <PrivacyBadge type="hidden" />
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.textSec }}>
                  Share your question anonymously so other students can learn from the answers. Your question requires moderator approval before publication.
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { icon: "🌐", text: "Visible to all students once approved" },
                    { icon: "🩺", text: "Any mentor can respond" },
                    { icon: "✓",  text: "Requires moderator approval" },
                    { icon: "🔒", text: "Name & photo never shown" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
                      <span>{f.icon}</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto">
                <Button variant="secondary" size="sm" fullWidth onClick={() => { resetForm(); setStep("anon-public"); }}>
                  Ask Publicly (Anonymous)
                </Button>
              </div>
            </div>

            {/* Private anonymous */}
            <div
              className="quick-action-card rounded-2xl p-6 cursor-pointer flex flex-col gap-4 card-shadow"
              style={{ backgroundColor: "#fff", border: `2px solid ${C.border}` }}
              onClick={() => { resetForm(); setStep("anon-private"); }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke={C.pending} strokeWidth="1.6" />
                  <path d="M8 11V7.5a4 4 0 018 0V11" stroke={C.pending} strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1.5" fill={C.pending} />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 className="font-bold text-sm" style={{ color: C.text }}>Private Anonymous</h4>
                  <PrivacyBadge type="mentors" />
                  <PrivacyBadge type="hidden" />
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: C.textSec }}>
                  Keep your question completely private. Only mentors can access it, and only you can see the responses. Never appears in the public feed.
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { icon: "🔒", text: "Never in the public feed" },
                    { icon: "🩺", text: "Mentors only — no students" },
                    { icon: "👤", text: "Only you see responses" },
                    { icon: "✓",  text: "No approval required" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-1.5 text-xs" style={{ color: C.textSec }}>
                      <span>{f.icon}</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto">
                <Button variant="secondary" size="sm" fullWidth onClick={() => { resetForm(); setStep("anon-private"); }}>
                  Ask Privately (Anonymous)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ANON PUBLIC FORM ──────────────────────────────────────────────────────
  if (step === "anon-public") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader
          onBack={() => setStep("anonymous")}
          title="Public Anonymous Question"
          subtitle="Visible to all students after moderator approval"
        />
        <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
          <Card className="p-4 mb-6 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: C.borderLight }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="4" stroke={C.textSec} strokeWidth="1.4" />
                <path d="M3 18c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke={C.textSec} strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: C.text }}>Anonymous Mentee</div>
              <div className="text-xs" style={{ color: C.textSec }}>Your name will appear exactly like this</div>
            </div>
            <PrivacyBadge type="hidden" />
          </Card>

          <QuestionForm
            title={title}
            question={question}
            category={category}
            tags={tags}
            attachment={attachment}
            onTitle={setTitle}
            onQuestion={setQuestion}
            onCategory={setCategory}
            onTags={setTags}
            onAttachment={setAttachment}
            showTags
            privacyNotice={
              <div
                className="flex flex-col gap-2 px-4 py-4 rounded-xl"
                style={{ backgroundColor: C.borderLight, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <PrivacyBadge type="hidden" />
                  <PrivacyBadge type="pending-approval" />
                  <PrivacyBadge type="public" />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.textSec }}>
                  <strong style={{ color: C.text }}>Your question will appear as Anonymous Mentee.</strong> It requires moderator review before publication (typically under 4 hours). Once approved, all mentors can answer and all students can read the responses.
                </p>
              </div>
            }
            onSubmit={() => handleSubmit("success-anon-public", "Anonymous question submitted for review!", "anon-public")}
            submitLabel="Submit for Approval"
          />
        </div>
      </div>
    );
  }

  // ── ANON PRIVATE FORM ─────────────────────────────────────────────────────
  if (step === "anon-private") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <AskPageHeader
          onBack={() => setStep("anonymous")}
          title="Private Anonymous Question"
          subtitle="Visible only to mentors — your identity is hidden"
        />
        <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
          <Card className="p-4 mb-6 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#FEF3C7" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="9.5" width="10" height="8" rx="1.5" stroke={C.pending} strokeWidth="1.4" />
                <path d="M7 9.5V7a3.5 3.5 0 017 0v2.5" stroke={C.pending} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="10" cy="13.5" r="1" fill={C.pending} />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: C.text }}>Anonymous Mentee</div>
              <div className="text-xs" style={{ color: C.textSec }}>Your name will appear exactly like this</div>
            </div>
            <div className="flex gap-2">
              <PrivacyBadge type="mentors" />
              <PrivacyBadge type="hidden" />
            </div>
          </Card>

          <QuestionForm
            title={title}
            question={question}
            category={category}
            tags={tags}
            attachment={attachment}
            onTitle={setTitle}
            onQuestion={setQuestion}
            onCategory={setCategory}
            onTags={setTags}
            onAttachment={setAttachment}
            showTags
            privacyNotice={
              <div
                className="flex flex-col gap-2 px-4 py-4 rounded-xl"
                style={{ backgroundColor: "#FEF3C7", border: `1px solid #FCD34D` }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <PrivacyBadge type="mentors" />
                  <PrivacyBadge type="hidden" />
                  <PrivacyBadge type="private" />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
                  <strong>Your identity will remain hidden.</strong> Only mentors can see and respond to this question. You are the only one who can see their responses. This question will never appear in the student feed or public question archive.
                </p>
              </div>
            }
            onSubmit={() => handleSubmit("success-anon-private", "Private anonymous question sent to mentors!", "anon-private")}
            submitLabel="Submit Privately"
          />
        </div>
      </div>
    );
  }

  // ── SUCCESS: ANON PUBLIC ──────────────────────────────────────────────────
  if (step === "success-anon-public") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
        <div className="w-full max-w-md text-center fade-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `linear-gradient(135deg, ${C.primaryLight} 0%, #C7D2FE 100%)` }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 20l7 7.5L30 12" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <PrivacyBadge type="hidden" />
            <PrivacyBadge type="pending-approval" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Question submitted!</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: C.textSec }}>
            Your question will appear as <strong style={{ color: C.text }}>Anonymous Mentee</strong>. A moderator will review it within 4 hours. You'll receive an email notification once it's approved and mentors begin answering.
          </p>
          <Card className="p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <PrivacyBadge type="hidden" />
              <span className="text-xs" style={{ color: C.textSec }}>Awaiting approval</span>
            </div>
            <p className="text-sm font-medium" style={{ color: C.text }}>{title || "How do I approach the neurology shelf exam with limited time?"}</p>
            <p className="text-xs mt-1" style={{ color: C.textSec }}>{category || "Board Exams"}</p>
          </Card>
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep("select")}>
              Ask Another Question
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCESS: ANON PRIVATE ─────────────────────────────────────────────────
  if (step === "success-anon-private") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: C.bg }}>
        <div className="w-full max-w-md text-center fade-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="12" y="18" width="16" height="14" rx="3" stroke={C.pending} strokeWidth="2" />
              <path d="M16 18V14a6 6 0 0112 0v4" stroke={C.pending} strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="25" r="2" fill={C.pending} />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <PrivacyBadge type="hidden" />
            <PrivacyBadge type="mentors" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Your identity will remain hidden.</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: C.textSec }}>
            Your question has been privately sent to all physician mentors. You'll be notified when a mentor responds. Only you can see their answers — they will never appear in the student feed.
          </p>
          <Card className="p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <PrivacyBadge type="hidden" />
              <PrivacyBadge type="mentors" />
            </div>
            <p className="text-sm font-medium" style={{ color: C.text }}>{title || "I'm struggling with burnout during rotations — how do I manage this without it affecting my evaluations?"}</p>
            <p className="text-xs mt-1" style={{ color: C.textSec }}>{category || "Wellness & Burnout"}</p>
          </Card>
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep("select")}>
              Ask Another Question
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── ADMIN DATA ───────────────────────────────────────────────────────────────

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "mentee" | "mentor" | "pending-mentor";
  year?: string;
  track?: string;
  school: string;
  status: "active" | "suspended" | "pending";
  joinDate: string;
  photo?: string;
}

const ADMIN_USERS: AdminUser[] = [
  { id: 1, name: "Alex Johnson", email: "alex.j@med.ucsf.edu", role: "mentee", year: "M2", track: "Preclinical", school: "UCSF School of Medicine", status: "active", joinDate: "Aug 12, 2024", photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=40&h=40&fit=crop" },
  { id: 2, name: "Sarah Chen", email: "s.chen@hms.harvard.edu", role: "mentee", year: "M3", track: "Clinical Rotations", school: "Harvard Medical School", status: "active", joinDate: "Sep 3, 2024", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" },
  { id: 3, name: "Marcus Williams", email: "m.williams@med.columbia.edu", role: "mentee", year: "M1", track: "Preclinical", school: "Columbia Vagelos COM", status: "active", joinDate: "Oct 1, 2024", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop" },
  { id: 4, name: "Dr. Mariam Khaled", email: "m.khaled@umc.edu", role: "mentor", school: "University Medical Center", status: "active", joinDate: "Jun 5, 2024", photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop" },
  { id: 5, name: "Dr. James Patel", email: "j.patel@stanford.edu", role: "mentor", school: "Stanford Medicine", status: "active", joinDate: "Jun 18, 2024", photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop" },
  { id: 6, name: "Dr. Amara Osei", email: "a.osei@jhmi.edu", role: "pending-mentor", school: "Johns Hopkins Medicine", status: "pending", joinDate: "Nov 14, 2024", photo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=40&h=40&fit=crop" },
  { id: 7, name: "Jordan Kim", email: "j.kim@med.yale.edu", role: "mentee", year: "M4", track: "Clinical", school: "Yale School of Medicine", status: "suspended", joinDate: "Aug 30, 2024", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop" },
  { id: 8, name: "Priya Sharma", email: "p.sharma@wustl.edu", role: "mentee", year: "M2", track: "Preclinical", school: "Washington University SOM", status: "active", joinDate: "Sep 22, 2024", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop" },
];

type ModerationStatus = "pending" | "approved" | "rejected" | "reported";

interface ModerationItem {
  id: string | number;
  type:
    | "anon-question"
    | "private-question"
    | "any-mentor-question"
    | "reported-question"
    | "reported-answer"
    | "suspicious";
  questionText: string;
  questionTitle?: string;
  category: string;
  submittedDate: string;
  visibility: "public" | "private";
  submittedBy?: { name: string | null; email: string };
  status: ModerationStatus;
  internalNote?: string;
  reportReason?: string;
  reportedBy?: string;
  flagCount?: number;
}

const MODERATION_ITEMS: ModerationItem[] = [
  { id: 101, type: "anon-question", questionText: "I've been struggling with severe anxiety and imposter syndrome to the point where I'm questioning whether medicine is right for me. Has anyone else felt this way in M2?", category: "Mental Health", submittedDate: "Nov 28, 2024", visibility: "private", status: "pending", internalNote: "Submitted via anonymous private channel. No identifying metadata. IP hash: a7f3..." },
  { id: 102, type: "anon-question", questionText: "What is the best way to approach a faculty member about a grade dispute without damaging the relationship?", category: "Academic", submittedDate: "Nov 27, 2024", visibility: "public", status: "pending", internalNote: "Submitted via anonymous public channel. No identifying metadata. IP hash: b2c9..." },
  { id: 103, type: "anon-question", questionText: "How do I handle a situation where a senior resident asked me to document something I didn't actually observe?", category: "Ethics", submittedDate: "Nov 26, 2024", visibility: "public", status: "pending", internalNote: "Flagged by auto-moderator for ethics keyword. No identifying metadata." },
  { id: 104, type: "reported-question", questionText: "Looking for study partners at [specific dorm building] on Thursday nights — bring snacks!", category: "Study Tips", submittedDate: "Nov 25, 2024", visibility: "public", status: "reported", reportReason: "Personal information", reportedBy: "3 users", flagCount: 3 },
  { id: 105, type: "reported-answer", questionText: 'Response by Dr. Chen to "How do I survive shelf exams?" — contains alleged misinformation about Step 1 scoring.', category: "Board Prep", submittedDate: "Nov 24, 2024", visibility: "public", status: "reported", reportReason: "Misinformation", reportedBy: "2 users", flagCount: 2 },
  { id: 106, type: "anon-question", questionText: "Is it normal to feel completely burned out after first year? I haven't been able to study in weeks.", category: "Mental Health", submittedDate: "Nov 23, 2024", visibility: "private", status: "approved" },
  { id: 107, type: "anon-question", questionText: "How do I ask for a letter of recommendation from someone I barely know?", category: "Career", submittedDate: "Nov 22, 2024", visibility: "public", status: "rejected", internalNote: "Rejected: not related to mentoring program scope." },
  { id: 108, type: "suspicious", questionText: "Account created 3 minutes ago. Posted 12 questions in rapid succession with identical structure. Possible bot activity.", category: "System", submittedDate: "Nov 28, 2024", visibility: "public", status: "pending", internalNote: "Auto-flagged: unusual posting frequency. User ID: #4471. Review recommended." },
];

const REJECT_REASONS = [
  "Inappropriate content",
  "Offensive language",
  "Not related to mentoring",
  "Personal information",
  "Spam",
  "Other",
];



// ─── MENTOR ANSWER SCREEN ─────────────────────────────────────────────────────

function FormatBtn({
  label,
  title,
  onClick,
}: {
  label: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
      style={{ backgroundColor: C.borderLight, color: C.text }}
    >
      {label}
    </button>
  );
}

function MentorAnswerScreen({
  question,
  onBack,
  onOpenQuestion,
  onToast,
}: {
  question: MentorQuestion;
  onBack: () => void;
  onOpenQuestion: (id: string | number) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [answer, setAnswer] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAnon = question.type === "anon-public" || question.type === "anon-private";

  function saveDraft() {
    if (!answer.trim()) return;
    setIsSavingDraft(true);
    setTimeout(() => {
      setIsSavingDraft(false);
      const now = new Date();
      setDraftSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 600);
  }

  const TYPE_META: Record<
    MentorQuestion["type"],
    { label: string; badge: React.ReactNode; notice: string; successNote: string }
  > = {
    private: {
      label: "Private Question",
      badge: <PrivacyBadge type="private" />,
      notice: `Your response will be sent privately to ${question.asker?.name ?? "the student"}. Only they can see it — it will never appear in the public feed or to other students.`,
      successNote: `${question.asker?.name ?? "The student"} will receive a notification and can view your response in their private thread.`,
    },
    "any-mentor": {
      label: "Ask Any Mentor",
      badge: <PrivacyBadge type="public" />,
      notice: `Your response will be visible to ${question.asker?.name ?? "the student"} and all physician mentors who have access to this question. Other students can also read the answers.`,
      successNote: "Your answer is now live on the question thread and visible to the student and their peers.",
    },
    "anon-public": {
      label: "Anonymous · Public",
      badge: (
        <span className="flex gap-1.5">
          <PrivacyBadge type="hidden" />
          <PrivacyBadge type="public" />
        </span>
      ),
      notice: "Your response will be visible publicly on the student question feed. Your name, photo, and specialty will be attributed to the answer. The student's identity is and will remain hidden from you.",
      successNote: "Your public response is now visible on the anonymous question page. Your name and specialty are shown as the responding physician.",
    },
    "anon-private": {
      label: "Anonymous · Private",
      badge: (
        <span className="flex gap-1.5">
          <PrivacyBadge type="hidden" />
          <PrivacyBadge type="mentors" />
        </span>
      ),
      notice: "Your response is visible only to the anonymous student. Their identity is completely hidden from you — you will never learn who they are. The student can continue the conversation and follow up while remaining anonymous.",
      successNote: 'The student will receive a notification: "Your anonymous question has received a response." Their identity remains hidden throughout.',
    },
  };

  const meta = TYPE_META[question.type];

  function applyFormat(fmt: "bold" | "italic" | "heading" | "list" | "quote") {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = el.value.slice(s, e);
    const before = el.value.slice(0, s);
    const after = el.value.slice(e);
    const map: Record<string, string> = {
      bold:    `**${sel || "bold text"}**`,
      italic:  `*${sel || "italic text"}*`,
      heading: `## ${sel || "Heading"}`,
      list:    `\n- ${sel || "List item"}`,
      quote:   `\n> ${sel || "Quoted text"}`,
    };
    const repl = map[fmt];
    const newVal = `${before}${repl}${after}`;
    setAnswer(newVal);
    setTimeout(() => {
      el.focus();
      const pos = s + repl.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  async function handleSubmit() {
    if (answer.trim().length < 10) return;
    try {
      await createAnswer(String(question.id), answer.trim());
      onToast("success", "Response sent successfully!");
      setStep("success");
    } catch (error) {
      onToast(
        "error",
        error instanceof Error ? error.message : "Unable to submit response."
      );
    }
  }

  if (step === "success") {
    const isAnonPrivate = question.type === "anon-private";
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80" style={{ color: C.textSec, backgroundColor: C.borderLight }}>
              <Icons.ArrowLeft /> Dashboard
            </button>
            <Logo size="sm" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-6 py-16 text-center fade-in">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `linear-gradient(135deg, ${C.successLight} 0%, #A7F3D0 100%)` }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 20l7 7.5L30 12" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">{meta.badge}</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
            Your response has been sent.
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: C.textSec }}>
            {meta.successNote}
          </p>

          {/* Preview of what was sent */}
          <Card className="p-4 mb-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop"
                alt="Dr. Khaled"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <div className="text-xs font-semibold" style={{ color: C.text }}>Dr. Mariam Khaled</div>
                <div className="text-xs" style={{ color: C.textSec }}>Internal Medicine · Just now</div>
              </div>
              <div className="ml-auto">{meta.badge}</div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: C.text }}>
              {answer.slice(0, 160)}{answer.length > 160 ? "…" : ""}
            </p>
          </Card>

          {isAnonPrivate && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-6 text-left"
              style={{ backgroundColor: "#FEF3C7", border: `1px solid #FCD34D` }}
            >
              <span className="text-lg flex-shrink-0">🔒</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#92400E" }}>
                  Student notification (anonymous)
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
                  The student received: <em>"Your anonymous question has received a response."</em> — Their identity remains completely hidden from you.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={() => onOpenQuestion(String(question.id))}>
              View Response
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={onBack}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium hover:opacity-80 flex-shrink-0"
            style={{ color: C.textSec, backgroundColor: C.borderLight }}
          >
            <Icons.ArrowLeft />
            Dashboard
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: C.text }}>
              Answer Question
            </p>
            <p className="text-xs" style={{ color: C.textSec }}>
              {meta.label}
            </p>
          </div>
          <Logo size="sm" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 fade-in">
        {/* Question card */}
        <Card className="p-5 mb-5">
          {/* Asker */}
          <div className="flex items-start gap-3 mb-4">
            {isAnon ? (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.borderLight }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="4" stroke={C.textSec} strokeWidth="1.4" />
                  <path d="M3 19c0-3.866 3.134-6 7-6s7 2.134 7 6" stroke={C.textSec} strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            ) : question.asker ? (
              <img
                src={question.asker.photo}
                alt={question.asker.name}
                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.borderLight }}
              >
                <span className="text-xs font-semibold" style={{ color: C.textSec }}>ST</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm" style={{ color: C.text }}>
                  {isAnon ? "Anonymous Mentee" : question.asker?.name ?? "Student"}
                </span>
                {!isAnon && question.asker?.year && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.borderLight, color: C.textSec }}>
                    {question.asker.year} · {question.asker.track}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {meta.badge}
                <CategoryBadge category={question.category} />
                <span className="text-xs" style={{ color: C.textSec }}>{question.date}</span>
                {question.priority === "high" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: C.errorLight, color: C.error }}>
                    High Priority
                  </span>
                )}
              </div>
            </div>
          </div>
          <h2 className="text-base font-bold leading-snug mb-2" style={{ color: C.text }}>
            {question.question}
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.textSec }}>
            {question.content?.trim() || question.question}
          </p>
        </Card>

        {/* Privacy notice */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
          style={{
            backgroundColor: isAnon ? "#FFF8ED" : C.borderLight,
            border: `1px solid ${isAnon ? "#FCD34D" : C.border}`,
          }}
        >
          <span className="text-base flex-shrink-0 mt-0.5">{isAnon ? "🔒" : "ℹ️"}</span>
          <p className="text-xs leading-relaxed" style={{ color: isAnon ? "#78350F" : C.textSec }}>
            <strong style={{ color: isAnon ? "#92400E" : C.text }}>Visibility: </strong>
            {meta.notice}
          </p>
        </div>

        {/* Response editor */}
        <Card className="p-5 mb-5">
          {/* Author preview */}
          <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop"
              alt="Dr. Khaled"
              className="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <div className="text-sm font-semibold" style={{ color: C.text }}>Dr. Mariam Khaled</div>
              <div className="text-xs" style={{ color: C.textSec }}>Internal Medicine · University Medical Center</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold" style={{ color: C.text }}>
              Write your response
            </label>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <FormatBtn label={<strong>B</strong>} title="Bold" onClick={() => applyFormat("bold")} />
              <FormatBtn label={<em>I</em>} title="Italic" onClick={() => applyFormat("italic")} />
              <FormatBtn label="H" title="Heading" onClick={() => applyFormat("heading")} />
              <div className="w-px h-5 self-center" style={{ backgroundColor: C.border }} />
              <FormatBtn label="• List" title="Bullet list" onClick={() => applyFormat("list")} />
              <FormatBtn label='" Quote' title="Quote" onClick={() => applyFormat("quote")} />
              <div className="w-px h-5 self-center" style={{ backgroundColor: C.border }} />
              <FormatBtn
                label={
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6a3 3 0 003 3h2a3 3 0 000-6H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M10 6a3 3 0 00-3-3H5a3 3 0 000 6h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Link
                  </span>
                }
                title="Insert link"
                onClick={() => {
                  const el = textareaRef.current;
                  if (!el) return;
                  const s = el.selectionStart;
                  const sel = el.value.slice(s, el.selectionEnd);
                  const repl = `[${sel || "link text"}](https://)`;
                  setAnswer((v) => v.slice(0, s) + repl + v.slice(el.selectionEnd));
                }}
              />
            </div>

            {/* Textarea */}
            <div
              className="rounded-xl transition-all duration-150"
              style={{ border: `1.5px solid ${C.border}`, overflow: "hidden" }}
            >
              <textarea
                ref={textareaRef}
                rows={9}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your answer here. Be specific, practical, and draw from your own experience where relevant. Students benefit most from concrete examples and actionable guidance."
                className="w-full px-4 py-3 text-sm bg-white outline-none resize-none placeholder:text-gray-400"
                style={{ color: C.text }}
                onFocus={(e) => {
                  (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = C.primary;
                  (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow = `0 0 0 3px rgba(91,78,191,0.12)`;
                }}
                onBlur={(e) => {
                  (e.currentTarget.parentElement as HTMLDivElement).style.borderColor = C.border;
                  (e.currentTarget.parentElement as HTMLDivElement).style.boxShadow = "none";
                }}
              />
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{ borderTop: `1px solid ${C.borderLight}`, backgroundColor: C.bg }}
              >
                <span className="text-xs" style={{ color: C.textSec }}>
                  Markdown supported — your formatting will be preserved
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: answer.length > 50 ? C.success : C.textSec }}
                >
                  {answer.length} chars
                </span>
              </div>
            </div>

            <AttachmentZone file={attachment} onChange={setAttachment} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={saveDraft}
            disabled={answer.trim().length < 3 || isSavingDraft}
          >
            {isSavingDraft ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" strokeLinecap="round"/>
                </svg>
                Saving…
              </span>
            ) : "Save Draft"}
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={answer.trim().length < 10}
          >
            Submit Answer
            <Icons.ChevronRight />
          </Button>
        </div>

        {draftSavedAt && !isSavingDraft && (
          <p className="text-center text-xs mt-2 flex items-center justify-center gap-1" style={{ color: C.success }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l2.5 3L10 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Draft saved at {draftSavedAt}
          </p>
        )}

        <p className="text-center text-xs mt-2" style={{ color: C.textSec }}>
          {question.type === "anon-private"
            ? "The student can view the response in the anonymous thread. You will not learn their identity."
            : question.type === "anon-public"
            ? "Your response will be attributed to you publicly."
            : "The student can view the response in their question thread."}
        </p>
      </main>
    </div>
  );
}

// ─── MENTOR DASHBOARD ─────────────────────────────────────────────────────────

function MentorQuestionCard({
  q,
  onAnswer,
  onReport,
  reported,
  compact = false,
}: {
  q: MentorQuestion;
  onAnswer: (q: MentorQuestion) => void;
  onReport: (q: MentorQuestion) => void;
  reported: boolean;
  compact?: boolean;
}) {
  const isAnon = q.asker === null;
  const TYPE_BADGE: Record<MentorQuestion["type"], React.ReactNode> = {
    private:      <PrivacyBadge type="private" />,
    "any-mentor": <PrivacyBadge type="public" />,
    "anon-public":  <span className="flex gap-1"><PrivacyBadge type="hidden" /><PrivacyBadge type="public" /></span>,
    "anon-private": <span className="flex gap-1"><PrivacyBadge type="hidden" /><PrivacyBadge type="mentors" /></span>,
  };

  return (
    <Card
      className="p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={() => onAnswer(q)}
    >
      {/* Asker row */}
      <div className="flex items-center gap-2.5 mb-3">
        {isAnon ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: C.borderLight }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="3" stroke={C.textSec} strokeWidth="1.3" />
              <path d="M2 14.5c0-3 2.686-4.5 6-4.5s6 1.5 6 4.5" stroke={C.textSec} strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <img
            src={q.asker!.photo}
            alt={q.asker!.name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: C.text }}>
              {isAnon ? "Anonymous Mentee" : q.asker!.name}
            </span>
            {!isAnon && q.asker?.year && (
              <span className="text-xs" style={{ color: C.textSec }}>
                {q.asker.year}
              </span>
            )}
            {q.priority === "high" && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: C.errorLight, color: C.error }}
              >
                Urgent
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: C.textSec }}>
            {q.date}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {TYPE_BADGE[q.type]}
        </div>
      </div>

      {/* Question */}
      <p
        className="text-sm leading-snug mb-3 overflow-hidden"
        style={{
          color: C.text,
          fontWeight: 500,
          display: "-webkit-box",
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {q.question}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between gap-2 pt-3"
        style={{ borderTop: `1px solid ${C.borderLight}` }}
      >
        <CategoryBadge category={q.category} />
        <div className="flex items-center gap-2">
          {typeof q.id === "string" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReport(q);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors"
              style={{
                backgroundColor: reported ? C.successLight : C.borderLight,
                color: reported ? C.success : C.textSec,
              }}
            >
              {reported ? "Reported" : "Report"}
            </button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAnswer(q);
            }}
          >
            Answer
            <Icons.ChevronRight />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MentorDashboardScreen({
  onNavigate,
  onAnswerQuestion,
  onToast,
}: {
  onNavigate: (s: Screen) => void;
  onAnswerQuestion: (q: MentorQuestion) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<"all" | "mentees" | "waiting" | "any" | "anon">("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifReadIds: number[] = [];
  type MessageTarget = Omit<(typeof MENTOR_MENTEES_DATA)[number], "id"> & { id: string | number };
  const [messageTarget, setMessageTarget] = useState<MessageTarget | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [showAllMentees, setShowAllMentees] = useState(false);
  const [reportingQuestion, setReportingQuestion] = useState<MentorQuestion | null>(null);
  const [reportedQuestionIds, setReportedQuestionIds] = useState<Set<string | number>>(new Set());
  const [liveMentorQuestions, setLiveMentorQuestions] = useState<MentorQuestion[] | null>(null);
  const [liveMentees, setLiveMentees] = useState<Array<{ id: string; name: string | null; email: string; createdAt: string; questionCount: number }> | null>(null);

  useEffect(() => {
    let active = true;
    getMentorQueue()
      .then((items) => {
        if (!active) return;
        const typed = items as MentorQuestion[];
        setLiveMentorQuestions(typed);
        setReportedQuestionIds(new Set(typed.filter((q) => q.reportedByMe).map((q) => q.id)));
      })
      .catch(() => {
        if (active) setLiveMentorQuestions(null);
      });

    getMentorMentees()
      .then((response) => {
        if (active) setLiveMentees(response.items);
      })
      .catch(() => {
        if (active) setLiveMentees(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function h(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen]);

  async function sendMentorMessage() {
    if (!messageTarget || !messageText.trim() || messageSending) return;
    setMessageSending(true);
    try {
      await sendMessage({ recipientId: messageTarget.id, body: messageText.trim() });
      onToast("success", "Message sent to " + messageTarget.name + ".");
      setMessageTarget(null);
      setMessageText("");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to send the message.");
    } finally {
      setMessageSending(false);
    }
  }

  const waitingQuestions =
    liveMentorQuestions?.filter((q) => q.type === "private") ?? [];
  const anyQuestions =
    liveMentorQuestions?.filter((q) => q.type === "any-mentor") ?? [];
  const anonQuestions =
    liveMentorQuestions?.filter((q) => q.type === "anon-public" || q.type === "anon-private") ?? [];

  const displayMentees = liveMentees
    ? liveMentees.map((m) => ({
        id: m.id,
        name: m.name ?? "Mentee",
        email: m.email,
        totalQuestions: m.questionCount,
        year: "",
        track: "",
        photo: undefined,
        active: false,
        lastActivity: "",
        lastQuestion: "",
      }))
    : [];

  const totalWaiting =
    waitingQuestions.length +
    anyQuestions.filter((q) => q.responses === 0).length +
    anonQuestions.filter((q) => q.responses === 0).length;

  const STATS = [
    {
      label: "Assigned Mentees",
      value: displayMentees.length,
      bg: C.successLight,
      color: C.success,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 16c0-3.5 3.134-5.5 7-5.5s7 2 7 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Awaiting Response",
      value: waitingQuestions.length,
      bg: C.errorLight,
      color: C.error,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M15 9.5c0 3-2.686 5.5-6 5.5a5.9 5.9 0 01-3-.8L2.5 15.5l.8-3A5.49 5.49 0 012 9.5c0-3 2.686-5.5 6-5.5s7 2.5 7 5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9 7v2.5M9 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Ask Any Mentor",
      value: anyQuestions.length,
      bg: C.primaryLight,
      color: C.primary,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="13" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 16c0-3 2.5-4.5 5.5-4.5 1.5 0 2.8.4 3.8 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11 16c0-2 1.5-3.5 5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Anonymous",
      value: anonQuestions.length,
      bg: C.pendingLight,
      color: C.pending,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="4" y="8.5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 8.5V6.5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="9" cy="12.5" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Activity Today",
      value: 5,
      bg: "#EDE9FE",
      color: "#7C3AED",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9h2.5l2-5 3 10 2-7 1.5 4H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Logo size="sm" />
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: C.primaryLight, color: C.primary }}
          >
            Mentor Portal
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("dashboard")}
              className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ color: C.textSec, backgroundColor: C.borderLight }}
            >
              Switch to Student View
            </button>
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl"
                style={{ color: C.textSec }}
              >
                <Icons.Bell />
              </button>
              {notifOpen && (
                <NotificationDropdown
                  notifications={[]}
                  readIds={notifReadIds}
                  onMarkRead={() => {}}
                  onMarkAllRead={() => {}}
                  onViewAll={() => setNotifOpen(false)}
                  onOpenQuestion={() => setNotifOpen(false)}
                />
              )}
            </div>
            <button
              onClick={() => onNavigate("mentor-profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity rounded-xl px-2 py-1"
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop"
                  alt="Dr. Khaled"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <StatusDot available />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold" style={{ color: C.text }}>Dr. Khaled</div>
                <div className="text-xs" style={{ color: C.textSec }}>Internal Medicine</div>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-6 fade-in">
          <h1 className="text-2xl font-bold mb-0.5" style={{ color: C.text }}>
            Good morning, Dr. Khaled. 👋
          </h1>
          <p className="text-sm" style={{ color: C.textSec }}>
            You have <strong style={{ color: C.error }}>{totalWaiting} questions</strong> waiting for your response today.
          </p>
        </div>

        {/* Rewards banner */}
        {(() => {
          const tier = getMentorTier(MENTOR.points);
          return (
            <Card className="p-5 mb-6 fade-in flex items-end justify-between gap-5 flex-wrap lg:flex-nowrap">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: tier.bg }}
              >
                {tier.emoji}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="stat-numeral" style={{ color: tier.color }}>
                    {MENTOR.points}
                  </span>
                  <span className="text-xs font-medium" style={{ color: C.textSec }}>
                    reward points
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MentorTierBadge points={MENTOR.points} size="md" />
                  {tier.next && (
                    <span className="text-xs" style={{ color: C.textSec }}>
                      {tier.next.min - MENTOR.points} points to {tier.next.label}
                    </span>
                  )}
                </div>
                {tier.next && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.borderLight, maxWidth: 280 }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tier.progress}%`, backgroundColor: tier.color, transition: "width 0.4s ease" }}
                    />
                  </div>
                )}
              </div>
              <div className="w-full lg:w-auto lg:min-w-[330px] rounded-2xl p-4" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-xs font-bold" style={{ color: C.text }}>How to score points</h3>
                  <Button variant="secondary" size="sm" onClick={() => onNavigate("leaderboard")}>
                    🏆 Leaderboard
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: C.textSec }}>
                  <div><strong style={{ color: C.text }}>+5</strong> Answer a question</div>
                  <div><strong style={{ color: C.text }}>+2</strong> Helpful vote</div>
                  <div><strong style={{ color: C.text }}>+3</strong> Answer within 24h</div>
                  <div><strong style={{ color: C.text }}>+1</strong> Ask Any Mentor response</div>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* Dashboard filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 fade-in">
          {STATS.map((s) => {
            const section =
              s.label === "Assigned Mentees"
                ? "mentees"
                : s.label === "Awaiting Response"
                  ? "waiting"
                  : s.label === "Ask Any Mentor"
                    ? "any"
                    : s.label === "Anonymous"
                      ? "anon"
                      : "all";
            const active = activeSection === section;

            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setActiveSection(section)}
                className="rounded-xl p-4 flex flex-col text-left transition-all duration-150 cursor-pointer hover:-translate-y-0.5"
                style={{
                  backgroundColor: s.bg,
                  border: `1px solid ${s.color}22`,
                  boxShadow: active ? `0 0 0 2px ${s.color}33, 0 4px 12px rgba(30,27,58,0.08)` : "none",
                  transform: active ? "translateY(-1px)" : undefined,
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <span className="stat-numeral" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
                <div className="stat-label" style={{ color: s.color }}>
                  {s.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* MY MENTEES */}
        {(activeSection === "all" || activeSection === "mentees") && (
          <section className="mb-8 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="section-accent-bar" style={{ backgroundColor: C.success, minHeight: 24 }} />
                <h2 className="text-sm font-bold" style={{ color: C.text }}>My Mentees</h2>
              </div>
              <button
                type="button"
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: C.primary }}
                onClick={() => setShowAllMentees(true)}
              >
                View all <Icons.ChevronRight />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {displayMentees.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot available={m.active} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: C.text }}>
                        {m.name}
                      </div>
                      <div className="text-xs" style={{ color: C.textSec }}>
                        {m.year} · {m.track}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: m.active ? C.success : C.textSec }}>
                        {m.active ? "● Active now" : `Last active: ${m.lastActivity}`}
                      </div>
                    </div>
                  </div>

                  <div
                    className="text-xs leading-snug mb-3 px-3 py-2 rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: C.bg,
                      border: `1px solid ${C.border}`,
                      color: C.textSec,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    <strong style={{ color: C.text }}>Latest: </strong>
                    {m.lastQuestion}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { setMessageTarget(m); setMessageText(""); }}
                    >
                      <Icons.MessageCircle />
                      Message
                    </Button>
                    <span className="text-xs ml-auto" style={{ color: C.textSec }}>
                      {m.totalQuestions} questions
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* QUESTIONS WAITING FOR RESPONSE */}
        {(activeSection === "all" || activeSection === "waiting") && (
          <section className="mb-8 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="section-accent-bar" style={{ backgroundColor: C.error, minHeight: 24 }} />
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: C.text }}>
                    Questions Waiting for Response
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: C.error }}
                  >
                    {waitingQuestions.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {waitingQuestions.map((q) => (
                <MentorQuestionCard
                  key={q.id}
                  q={q}
                  onAnswer={onAnswerQuestion}
                  onReport={(question) => {
                    if (typeof question.id === "string") setReportingQuestion(question);
                  }}
                  reported={reportedQuestionIds.has(q.id) || Boolean(q.reportedByMe)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ASK ANY MENTOR + ANONYMOUS — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASK ANY MENTOR */}
          {(activeSection === "all" || activeSection === "any") && (
            <section className="fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="section-accent-bar" style={{ backgroundColor: C.primary, minHeight: 24 }} />
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold" style={{ color: C.text }}>
                      Ask Any Mentor
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: C.primary }}
                    >
                      {anyQuestions.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {anyQuestions.map((q) => (
                  <MentorQuestionCard
                  key={q.id}
                  q={q}
                  onAnswer={onAnswerQuestion}
                  onReport={(question) => {
                    if (typeof question.id === "string") setReportingQuestion(question);
                  }}
                  reported={reportedQuestionIds.has(q.id) || Boolean(q.reportedByMe)}
                  compact
                />
                ))}
                <p className="text-xs px-1" style={{ color: C.textSec }}>
                  These questions were submitted to all mentors at the school. Your response will be visible to the student and their peers.
                </p>
              </div>
            </section>
          )}

          {/* ANONYMOUS QUESTIONS */}
          {(activeSection === "all" || activeSection === "anon") && (
            <section className="fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="section-accent-bar" style={{ backgroundColor: C.pending, minHeight: 24 }} />
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold" style={{ color: C.text }}>
                      Anonymous Questions
                    </h2>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: C.pending }}
                    >
                      {anonQuestions.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {anonQuestions.map((q) => (
                  <MentorQuestionCard
                  key={q.id}
                  q={q}
                  onAnswer={onAnswerQuestion}
                  onReport={(question) => {
                    if (typeof question.id === "string") setReportingQuestion(question);
                  }}
                  reported={reportedQuestionIds.has(q.id) || Boolean(q.reportedByMe)}
                  compact
                />
                ))}
                {/* Privacy reminder */}
                <div
                  className="flex items-start gap-2 px-3 py-3 rounded-xl text-xs"
                  style={{ backgroundColor: "#FFF8ED", border: `1px solid #FCD34D` }}
                >
                  <span className="flex-shrink-0">🔒</span>
                  <span style={{ color: "#78350F" }}>
                    <strong>Student identities are always hidden.</strong> You will never see a student's name, email, photo, or ID on anonymous questions — not even after responding. The student can continue the conversation while remaining anonymous.
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {reportingQuestion && typeof reportingQuestion.id === "string" && (
        <ReportQuestionModal
          questionId={reportingQuestion.id}
          questionTitle={reportingQuestion.question}
          onClose={() => setReportingQuestion(null)}
          onReported={() => {
            setReportedQuestionIds((prev) => new Set(prev).add(reportingQuestion.id as string));
          }}
          onToast={onToast}
        />
      )}

      {showAllMentees && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllMentees(false);
          }}
        >
          <div
            className="bg-white rounded-2xl card-shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid " + C.border }}
            >
              <div>
                <h3 className="text-base font-bold" style={{ color: C.text }}>All My Mentees</h3>
                <p className="text-xs mt-0.5" style={{ color: C.textSec }}>
                  {displayMentees.length} assigned mentees
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllMentees(false)}
                className="text-lg px-2 hover:opacity-70"
                style={{ color: C.textSec }}
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex flex-col gap-3">
              {displayMentees.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: C.bg, border: "1px solid " + C.border }}
                >
                  <div className="relative flex-shrink-0">
                    <img src={m.photo} alt={m.name} className="w-11 h-11 rounded-full object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot available={m.active} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</div>
                    <div className="text-xs" style={{ color: C.textSec }}>{m.year} · {m.track}</div>
                    <div className="text-xs mt-0.5" style={{ color: m.active ? C.success : C.textSec }}>
                      {m.active ? "● Active now" : "Last active: " + m.lastActivity}
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: C.textSec }}>
                    {m.totalQuestions} questions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {messageTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMessageTarget(null);
              setMessageText("");
            }
          }}
        >
          <div
            className="bg-white rounded-2xl card-shadow-lg w-full max-w-md fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <img src={messageTarget.photo} alt={messageTarget.name} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>Message {messageTarget.name}</div>
                  <div className="text-xs" style={{ color: C.textSec }}>{messageTarget.year} · {messageTarget.track}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setMessageTarget(null); setMessageText(""); }}
                className="p-1.5 rounded-lg hover:opacity-70"
                style={{ color: C.textSec }}
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <textarea
                autoFocus
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write a message to your mentee…"
                className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: "#fff" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(91,78,191,0.12)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setMessageTarget(null); setMessageText(""); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!messageText.trim()}
                  onClick={sendMentorMessage}
                  disabled={!messageText.trim() || messageSending}
                >
                  {messageSending ? "Sending…" : "Send Message"}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN COMPONENTS ────────────────────────────────────────────────────────





type AdminSection = "dashboard" | "users" | "mentors" | "questions" | "moderation" | "reports" | "settings";

const ADMIN_NAV: { id: AdminSection; label: string; icon: React.ReactNode; badge?: number }[] = [
  {
    id: "dashboard", label: "Dashboard",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    id: "users", label: "Users",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.5 7.5c1.105 0 2-.895 2-2s-.895-2-2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 12c1.326.37 2 1.08 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    id: "mentors", label: "Mentors",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14.5c0-3 2.686-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M6 6l1.5 1.5L10 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: "questions", label: "Questions",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8c0 3-2.686 5.5-6 5.5-.8 0-1.56-.14-2.25-.4L2 14.5l.7-3a5.5 5.5 0 01-.7-2.5C2 6 4.686 3.5 8 3.5s6 2.5 6 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
  {
    id: "moderation", label: "Moderation",
    badge: MODERATION_ITEMS.filter(m => m.status === "pending").length,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.854 3.757 4.146.603-3 2.925.708 4.13L8 10.757l-3.708 1.958.708-4.13L2 5.86l4.146-.603L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
  {
    id: "reports", label: "Reports",
    badge: MODERATION_ITEMS.filter(m => m.status === "reported").length,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v5m0 2.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2 13.5l5.134-9.802A1 1 0 0114 14H2a1 1 0 01-.866-1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
  {
    id: "settings", label: "Settings",
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.222 3.222l1.414 1.414M11.364 11.364l1.414 1.414M3.222 12.778l1.414-1.414M11.364 4.636l1.414-1.414" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
];

function AdminShell({
  section,
  onNavigate,
  onFullNavigate,
  children,
}: {
  section: AdminSection;
  onNavigate: (s: AdminSection) => void;
  onFullNavigate: (s: Screen) => void;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminStats, setAdminStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stats = await getAdminStats();
        if (active) setAdminStats(stats);
      } catch {
        if (active) setAdminStats(null);
      }
    };
    void load();
    const interval = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const sectionToScreen: Record<AdminSection, Screen> = {
    dashboard: "admin-dashboard",
    users: "admin-users",
    mentors: "admin-mentors",
    questions: "admin-questions",
    moderation: "admin-moderation",
    reports: "admin-reports",
    settings: "admin-settings",
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: C.bg }}>
      {/* Sidebar */}
      <aside
        className="glass-chrome flex-shrink-0 flex flex-col transition-all duration-200"
        style={{
          width: sidebarOpen ? 220 : 60,
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${C.primaryMid} 0%, #A78BFA 100%)` }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3 3.5.5-2.5 2.5.6 3.5L7 9l-3.1 1.5.6-3.5L2 4.5l3.5-.5L7 1z" fill="white"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-xs font-bold text-white leading-tight">MedMentor</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Admin Console</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="ml-auto p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity text-white"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5">
          {ADMIN_NAV.map(({ id, label, icon, badge }) => {
            const active = section === id || (id === "mentors" && section === "users");
            const liveBadge =
              adminStats == null
                ? 0
                : id === "moderation"
                  ? adminStats.pendingModeration
                  : id === "reports"
                    ? adminStats.reportedContent
                    : badge ?? 0;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onFullNavigate(sectionToScreen[id]); }}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl w-full text-left transition-all"
                style={{
                  backgroundColor: active ? "rgba(91,78,191,0.25)" : "transparent",
                  color: active ? "#7EB3FF" : "rgba(255,255,255,0.5)",
                }}
                title={!sidebarOpen ? label : undefined}
              >
                <span className="flex-shrink-0">{icon}</span>
                {sidebarOpen && <span className="text-xs font-medium flex-1">{label}</span>}
                {sidebarOpen && liveBadge > 0 && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: C.error, color: "#fff", fontSize: "10px" }}
                  >
                    {liveBadge}
                  </span>
                )}
                {!sidebarOpen && liveBadge > 0 && (
                  <span
                    className="absolute left-7 top-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: C.error }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: switch role */}
        <div className="px-2 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          <button
            onClick={() => onFullNavigate("dashboard")}
            className="flex items-center gap-3 px-2.5 py-2 rounded-xl w-full text-left transition-all opacity-50 hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.6)" }}
            title={!sidebarOpen ? "Exit Admin" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="text-xs font-medium">Exit to App</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-3.5 bg-white flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex-1">
            <h1 className="text-sm font-bold capitalize" style={{ color: C.text }}>
              {section === "dashboard" ? "Admin Dashboard" : section.charAt(0).toUpperCase() + section.slice(1)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
              Admin
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #7B61FF 100%)` }}
              >
                A
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold" style={{ color: C.text }}>Admin</div>
                <div className="text-xs" style={{ color: C.textSec }}>medmentor.edu</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── ADMIN MODALS ──────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  width = 480,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl card-shadow-lg w-full fade-in"
        style={{ maxWidth: width }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <h3 className="text-sm font-bold" style={{ color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: C.textSec }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ApproveModal({
  item,
  onClose,
  onConfirm,
}: {
  item: ModerationItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Approve anonymous question?" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: C.textSec }}>
        This question will be published to the{" "}
        <strong style={{ color: C.text }}>{item.visibility === "public" ? "public feed" : "private mentor pool"}</strong>.
        The student's identity will remain permanently hidden.
      </p>
      <div
        className="rounded-xl p-3 mb-4 text-sm leading-relaxed"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
      >
        "{item.questionText}"
      </div>
      <div className="flex items-center gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={onConfirm}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7l3 3.5L11.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Approve &amp; Publish
        </Button>
      </div>
    </Modal>
  );
}

function RejectModal({
  item,
  onClose,
  onConfirm,
}: {
  item: ModerationItem;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  return (
    <Modal title="Reject this question?" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: C.textSec }}>
        Select a reason for rejection. The student will receive a generic notice — the reason is for internal records only.
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {REJECT_REASONS.map(r => (
          <label
            key={r}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
            style={{
              border: `1.5px solid ${reason === r ? C.error : C.border}`,
              backgroundColor: reason === r ? C.errorLight : "transparent",
            }}
          >
            <input
              type="radio"
              name="reject-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-red-500"
            />
            <span className="text-sm" style={{ color: C.text }}>{r}</span>
          </label>
        ))}
      </div>
      {reason === "Other" && (
        <textarea
          rows={2}
          placeholder="Describe reason…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-4 resize-none"
          style={{ border: `1.5px solid ${C.border}`, color: C.text }}
        />
      )}
      <div className="flex items-center gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="danger" size="sm" disabled={!reason} onClick={() => onConfirm(reason === "Other" ? custom || "Other" : reason)}>
          Reject
        </Button>
      </div>
    </Modal>
  );
}

function ActionModal({
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} width={400}>
      <p className="text-sm mb-5" style={{ color: C.textSec }}>{description}</p>
      <div className="flex items-center gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

function ReportQuestionModal({
  questionId,
  questionTitle,
  onClose,
  onReported,
  onToast,
}: {
  questionId: string;
  questionTitle: string;
  onClose: () => void;
  onReported: () => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [reason, setReason] = useState<ReportReasonValue | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const REASONS: Array<{ value: ReportReasonValue; label: string }> = [
    { value: "SPAM", label: "Spam" },
    { value: "HARASSMENT", label: "Harassment or abuse" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
    { value: "MISINFORMATION", label: "Misinformation" },
    { value: "PRIVACY", label: "Privacy or personal information" },
    { value: "OFF_TOPIC", label: "Off-topic" },
    { value: "OTHER", label: "Other" },
  ];

  async function submit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await reportQuestion(questionId, {
        reason,
        details: details.trim() || undefined,
      });
      onReported();
      onClose();
      onToast("success", "Post reported. An admin will review it.");
    } catch (error) {
      onToast(
        "error",
        error instanceof Error ? error.message : "Unable to report this post."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Report post" onClose={onClose} width={520}>
      <p className="text-sm mb-1 font-semibold" style={{ color: C.text }}>
        Why are you reporting this post?
      </p>
      <p className="text-xs mb-4" style={{ color: C.textSec }}>
        Reports are reviewed by admins. The post stays visible until an admin takes action.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {REASONS.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
            style={{
              border: `1px solid ${reason === item.value ? C.primary : C.border}`,
              backgroundColor: reason === item.value ? C.primaryLight : "#fff",
            }}
          >
            <input
              type="radio"
              name="report-reason"
              value={item.value}
              checked={reason === item.value}
              onChange={() => setReason(item.value)}
            />
            <span className="text-sm" style={{ color: C.text }}>{item.label}</span>
          </label>
        ))}
      </div>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Add details for the admin (optional)…"
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-1"
        style={{ border: `1.5px solid ${C.border}`, color: C.text }}
      />
      <p className="text-xs mb-5 text-right" style={{ color: C.textSec }}>
        {details.length}/1000
      </p>

      <div
        className="rounded-xl px-3 py-2.5 mb-5 text-xs"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.textSec }}
      >
        <strong style={{ color: C.text }}>Post:</strong> {questionTitle}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="danger" size="sm" disabled={!reason || submitting} onClick={submit}>
          {submitting ? "Reporting…" : "Report post"}
        </Button>
      </div>
    </Modal>
  );
}



// ─── MODERATION REVIEW PANEL ───────────────────────────────────────────────────

function ModerationReviewPanel({
  item,
  onClose,
  onApprove,
  onReject,
  onToast,
}: {
  item: ModerationItem;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [modal, setModal] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const reason = REJECT_REASONS[0];

  function handleApprove() {
    setModal(null);
    setDone("approved");
    onApprove(item.id);
    onToast("success", "Question approved and published.");
  }

  function handleReject(r: string) {
    setModal(null);
    setDone("rejected");
    onReject(item.id, r);
    onToast("info", `Question rejected: ${r}`);
  }

  const statusBg: Record<ModerationStatus, string> = {
    pending: C.pendingLight,
    approved: C.successLight,
    rejected: C.errorLight,
    reported: "#FEE2E2",
  };
  const statusColor: Record<ModerationStatus, string> = {
    pending: C.pending,
    approved: C.success,
    rejected: C.error,
    reported: C.error,
  };

  return (
    <div
      className="fixed inset-0 z-40 flex"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ml-auto w-full max-w-lg h-full bg-white flex flex-col"
        style={{ boxShadow: "-8px 0 32px rgba(0,0,0,0.12)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div>
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Review Submission</h3>
            <p className="text-xs" style={{ color: C.textSec }}>#{item.id} · {item.type.replace(/-/g, " ")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: C.textSec }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-4">
          {done === "approved" && (
            <div className="flex flex-col items-center text-center py-12 fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: C.successLight }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 16l5 6L24 10" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="font-bold text-base mb-1" style={{ color: C.text }}>Question approved and published.</h4>
              <p className="text-sm" style={{ color: C.textSec }}>
                {item.visibility === "public" ? "It is now visible in the public feed." : "It is now available to mentors."}
              </p>
              <Button variant="secondary" size="sm" onClick={onClose} className="mt-6">Close</Button>
            </div>
          )}
          {done === "rejected" && (
            <div className="flex flex-col items-center text-center py-12 fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: C.errorLight }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M10 10l12 12M22 10L10 22" stroke={C.error} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h4 className="font-bold text-base mb-1" style={{ color: C.text }}>Question rejected.</h4>
              <p className="text-sm" style={{ color: C.textSec }}>
                It will never appear publicly. The student receives a generic notice.
              </p>
              <Button variant="secondary" size="sm" onClick={onClose} className="mt-6">Close</Button>
            </div>
          )}
          {!done && (
            <>
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                  style={{ backgroundColor: statusBg[item.status], color: statusColor[item.status] }}
                >
                  {item.status}
                </span>
                <CategoryBadge category={item.category} />
                <span className="text-xs ml-auto" style={{ color: C.textSec }}>{item.submittedDate}</span>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-2">
                {item.visibility === "public"
                  ? <PrivacyBadge type="public" />
                  : <PrivacyBadge type="mentors" />
                }
                <span className="text-xs" style={{ color: C.textSec }}>
                  {item.visibility === "public" ? "Would be visible in public feed" : "Visible to mentors only"}
                </span>
              </div>

              {/* Anonymous indicator */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ backgroundColor: C.pendingLight, border: `1px solid #FCD34D` }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="3" y="7" width="8" height="6.5" rx="1.5" stroke="#92400E" strokeWidth="1.2"/>
                  <path d="M5 7V5.5a3 3 0 016 0V7" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="8" cy="10" r="0.8" fill="#92400E"/>
                </svg>
                <span style={{ color: "#92400E" }}>
                  <strong>Anonymous submission.</strong> Student identity is not visible to mentors or students — only internal admin metadata is accessible.
                </span>
              </div>

              {/* Question text */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: C.textSec }}>
                  Question Content
                </label>
                <div
                  className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                >
                  {item.questionTitle ?? item.questionText}
                </div>
              </div>

              {/* Report info */}
              {(item.flagCount != null || item.reportReason) && (
                <div
                  className="px-4 py-3 rounded-xl text-xs"
                  style={{ backgroundColor: C.errorLight, border: `1px solid ${C.error}33` }}
                >
                  <div className="font-semibold mb-1" style={{ color: C.error }}>
                    Reported · {item.flagCount} flag{item.flagCount !== 1 ? "s" : ""}
                  </div>
                  <div style={{ color: C.error }}>Reason: {item.reportReason} · By: {item.reportedBy}</div>
                </div>
              )}

              {/* Internal note */}
              {item.internalNote && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: C.textSec }}>
                    Internal Moderation Info <span style={{ color: C.error }}>(Admin only)</span>
                  </label>
                  <div
                    className="px-4 py-3 rounded-xl text-xs leading-relaxed font-mono"
                    style={{ backgroundColor: "#0F1117", color: "#7EB3FF", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {item.internalNote}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!done && item.status === "pending" && (
          <div
            className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <Button variant="danger" size="md" onClick={() => setModal("reject")}>
              Reject
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={() => setModal("approve")}>
              Approve &amp; Publish
            </Button>
          </div>
        )}
        {!done && item.status === "reported" && (
          <div
            className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            <Button variant="secondary" size="md" onClick={() => setModal("reject")}>
              Remove Content
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={handleApprove}>
              Dismiss Report
            </Button>
          </div>
        )}

        {modal === "approve" && (
          <ApproveModal item={item} onClose={() => setModal(null)} onConfirm={handleApprove} />
        )}
        {modal === "reject" && (
          <RejectModal item={item} onClose={() => setModal(null)} onConfirm={handleReject} />
        )}
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD VIEW ─────────────────────────────────────────────────────



function AdminDashboardView({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [liveStats, setLiveStats] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  const [livePending, setLivePending] = useState<Array<{
    id: string;
    content: string;
    category: string;
    createdAt: string;
  }>>([]);
  const [liveRecentUsers, setLiveRecentUsers] = useState<Array<{ id: string; name: string | null; email: string; role: string }>>([]);
  const [liveReports, setLiveReports] = useState<Array<{
    id: string;
    questionText: string;
    reportCount: number;
    reportReason: string;
  }>>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [stats, moderation, reports, recentUsers] = await Promise.all([
          getAdminStats(),
          getModerationQueue({ limit: 50 }),
          getAdminReports({ status: "PENDING", limit: 5 }),
          getAdminUsers({ page: 1, limit: 5 }),
        ]);

        if (!active) return;

        setLiveStats(stats);
        setLiveRecentUsers(recentUsers.items);
        setLivePending(moderation.items.map((item) => ({
          id: item.id,
          content: item.content,
          category: item.category.replaceAll("_", " "),
          createdAt: item.createdAt,
        })));
        setLiveReports(reports.items.map((report) => ({
          id: report.id,
          questionText: report.question.title || report.question.content,
          reportCount: report.question._count.reports,
          reportReason: report.reason.replaceAll("_", " "),
        })));
      } catch {
        // Keep the dashboard usable while the data is loading or unavailable.
      }
    };

    void load();
    const interval = window.setInterval(load, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const STATS = [
    { label: "Total Students", value: liveStats?.totalStudents ?? "—", color: C.primary, bg: C.primaryLight,
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M2 18c0-3.5 2.686-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M14 11v6M11 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { label: "Total Mentors", value: liveStats?.totalMentors ?? "—", color: C.success, bg: C.successLight,
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M3 18c0-3.5 3.134-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 6.5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Pending Mentors", value: liveStats?.pendingMentors ?? "—", color: C.pending, bg: C.pendingLight,
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M3 18c0-3.5 3.134-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M15 12v3.5M15 17.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { label: "Questions Submitted", value: liveStats?.totalQuestions ?? "—", color: "#7C3AED", bg: "#EDE9FE",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17 10c0 3.5-3.134 6.5-7 6.5-.9 0-1.76-.15-2.53-.43L3 18l.8-3.5A6.5 6.5 0 013 10c0-3.5 3.134-6.5 7-6.5s7 3 7 6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { label: "Questions Answered", value: liveStats?.questionsAnswered ?? "—", color: C.success, bg: C.successLight,
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17 10c0 3.5-3.134 6.5-7 6.5-.9 0-1.76-.15-2.53-.43L3 18l.8-3.5A6.5 6.5 0 013 10c0-3.5 3.134-6.5 7-6.5s7 3.5 7 6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7 10l2 2.5 4-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "Pending Moderation", value: liveStats?.pendingModeration ?? "—", color: C.error, bg: C.errorLight,
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.3 4.67 5.14.748-3.72 3.624.879 5.118L10 13.75l-4.599 2.41.879-5.118L2.56 7.418l5.14-.748L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { label: "Reported Content", value: liveStats?.reportedContent ?? "—", color: "#DC2626", bg: "#FEE2E2",
      icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v7M10 13.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M3.5 17.5l5.768-12.5a.8.8 0 011.464 0l5.768 12.5a.8.8 0 01-.732 1.13H4.232a.8.8 0 01-.732-1.13z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
  ];

  const pendingModerationItems = livePending;
  const reportedItems = liveReports;
  const statDestinations: Record<string, Screen> = {
    "Total Students": "admin-users",
    "Total Mentors": "admin-mentors",
     "Pending Mentors": "admin-mentors",
    "Questions Submitted": "admin-questions",
    "Questions Answered": "admin-questions",
    "Pending Moderation": "admin-moderation",
    "Reported Content": "admin-reports",
  };

  return (
    <div className="fade-in flex flex-col gap-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <button
            type="button"
            key={s.label}
            onClick={() => onNavigate(statDestinations[s.label])}
            className="rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            style={{ backgroundColor: s.bg, border: `1px solid ${s.color}20` }}
          >
            <div className="flex items-start justify-between mb-1">
              <div style={{ color: s.color }}>{s.icon}</div>
              <span className="stat-numeral" style={{ color: s.color }}>{s.value}</span>
            </div>
            <div className="stat-label" style={{ color: s.color }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Two column: pending + recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending moderation */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Pending Moderation</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: C.error }}>
                {pendingModerationItems.length}
              </span>
            </div>
            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }} onClick={() => onNavigate("admin-moderation")}>
              View all <Icons.ChevronRight />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {pendingModerationItems.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                <span className="text-base flex-shrink-0">📝</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug overflow-hidden" style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.content}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CategoryBadge category={item.category} />
                    <span className="text-xs" style={{ color: C.textSec }}>{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
                <button className="text-xs font-semibold flex-shrink-0" style={{ color: C.primary }} onClick={() => onNavigate("admin-moderation")}>
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reported content */}
        <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Reported Content</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: C.pending }}>
                {reportedItems.length}
              </span>
            </div>
            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }} onClick={() => onNavigate("admin-reports")}>
              View all <Icons.ChevronRight />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {reportedItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0" style={{ color: C.error }}>
                  <path d="M8 2v5M8 9.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M2 14l4.8-10a1.286 1.286 0 012.4 0L14 14H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug overflow-hidden" style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.questionText}
                  </p>
                  <div className="text-xs mt-0.5" style={{ color: C.error }}>
                    {item.reportCount} report{item.reportCount !== 1 ? "s" : ""} · {item.reportReason}
                  </div>
                </div>
                <button className="text-xs font-semibold flex-shrink-0" style={{ color: C.primary }} onClick={() => onNavigate("admin-reports")}>
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Recent Users</h3>
          <button className="text-xs font-semibold flex items-center gap-1" style={{ color: C.primary }} onClick={() => onNavigate("admin-users")}>
            Manage all <Icons.ChevronRight />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {liveRecentUsers.length > 0 ? liveRecentUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg }}>
              <Avatar name={u.name ?? u.email} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: C.text }}>{u.name ?? "Unnamed user"}</div>
                <div className="text-xs" style={{ color: C.textSec }}>{u.email}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: u.role === "MENTOR" ? C.successLight : C.primaryLight, color: u.role === "MENTOR" ? C.success : C.primary }}>
                {u.role === "MENTOR" ? "Mentor" : u.role === "STUDENT" ? "Student" : "Admin"}
              </span>
            </div>
          )) : (
            <div className="text-sm py-6 text-center" style={{ color: C.textSec }}>No users yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN USERS VIEW ──────────────────────────────────────────────────────────

function AdminUsersView({
  section,
  onToast,
}: {
  section: "users" | "mentors";
  onToast: (t: ToastType, msg: string) => void;
}) {
  type LiveUser = Awaited<ReturnType<typeof getAdminUsers>>["items"][number];
  const [users, setUsers] = useState<LiveUser[]>([]);
  const [mentors, setMentors] = useState<Awaited<ReturnType<typeof getAdminMentors>>["items"]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const isMentorsSection = section === "mentors";
  const role = isMentorsSection ? "MENTOR" : "STUDENT";
  const title = isMentorsSection ? "Mentors" : "Students";
  const searchPlaceholder = isMentorsSection
    ? "Search mentors by name or email…"
    : "Search students by name or email…";

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = window.setTimeout(() => {
      const userRequest = getAdminUsers({
        role,
        q: search.trim() || undefined,
        limit: 100,
      });

      const mentorRequest = isMentorsSection ? Promise.resolve(null) : getAdminMentors();

      Promise.all([userRequest, mentorRequest])
        .then(([userResponse, mentorResponse]) => {
          if (!active) return;
          setUsers(userResponse.items);
          if (mentorResponse) setMentors(mentorResponse.items);
        })
        .catch((error) => {
          if (active) onToast("error", error instanceof Error ? error.message : `Unable to load ${title.toLowerCase()}.`);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [role, search, isMentorsSection, title, onToast]);

  async function changeMentor(user: LiveUser, mentorId: string) {
    try {
      const updated = mentorId
        ? await assignMentor(user.id, mentorId)
        : await unassignMentor(user.id);
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, assignedMentor: updated.item.assignedMentor } : item
        )
      );
      onToast("success", mentorId ? "Mentor assigned." : "Mentor unassigned.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to update mentor assignment.");
    }
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>{title}</h2>
          <p className="text-xs mt-1" style={{ color: C.textSec }}>
            {isMentorsSection
              ? "All mentor accounts. Search by mentor name or email."
              : "All student accounts. Search by student name or email."}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
          {users.length} {isMentorsSection ? "mentors" : "students"}
        </span>
      </div>

      <div className="mb-4">
        {isMentorsSection && users.some((u) => u.mentorStatus === "PENDING") && (
          <div className="mb-4 rounded-2xl p-4" style={{ backgroundColor: C.pendingLight, border: `1px solid ${C.pending}30` }}>
            <div className="text-sm font-bold mb-2" style={{ color: C.text }}>Pending mentor applications</div>
            {users.filter((u) => u.mentorStatus === "PENDING").map((user) => (
              <div key={user.id} className="flex items-center gap-3 py-2">
                <Avatar name={user.name ?? user.email} size={32} />
                <div className="flex-1 min-w-0"><div className="text-xs font-semibold">{user.name ?? "Unnamed user"}</div><div className="text-xs" style={{ color: C.textSec }}>{user.email}</div></div>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.success, color: "#fff" }} onClick={async () => { try { await updateMentorApproval(user.id, "APPROVED"); setUsers(prev => prev.filter(u => u.id !== user.id)); onToast("success", "Mentor approved."); } catch(e) { onToast("error", e instanceof Error ? e.message : "Unable to approve mentor."); } }}>Approve</button>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.error, color: "#fff" }} onClick={async () => { try { await updateMentorApproval(user.id, "REJECTED"); setUsers(prev => prev.filter(u => u.id !== user.id)); onToast("success", "Mentor application rejected."); } catch(e) { onToast("error", e instanceof Error ? e.message : "Unable to reject mentor."); } }}>Reject</button>
              </div>
            ))}
          </div>
        )}
        <div className="relative max-w-xl">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none bg-white"
            style={{ border: `1.5px solid ${C.border}`, color: C.text }}
          />
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: C.textSec }}>
          Admin search includes email.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm" style={{ color: C.textSec }}>Loading {title.toLowerCase()}…</Card>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center text-sm" style={{ color: C.textSec }}>No {title.toLowerCase()} found.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Avatar name={user.name ?? user.email} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: C.text }}>
                    {user.name ?? "Unnamed user"}
                  </div>
                  <div className="text-xs" style={{ color: C.textSec }}>{user.email}</div>
                  <div className="text-xs mt-1" style={{ color: C.textSec }}>
                    {user.questionCount} questions · {user.answerCount} answers
                  </div>
                </div>

                {!isMentorsSection && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: C.textSec }}>Mentor</span>
                    <select
                      value={user.assignedMentor?.id ?? ""}
                      onChange={(e) => void changeMentor(user, e.target.value)}
                      className="px-2.5 py-2 rounded-lg text-xs outline-none"
                      style={{ backgroundColor: C.bg, border: "1px solid " + C.border, color: C.text }}
                    >
                      <option value="">Unassigned</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.name ?? mentor.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN MODERATION VIEW ─────────────────────────────────────────────────────

function AdminModerationView({ onToast }: { onToast: (t: ToastType, msg: string) => void }) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<ModerationStatus | "all">("pending");
  const [reviewItem, setReviewItem] = useState<ModerationItem | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);
    try {
      const response = await getModerationQueue({ limit: 50 });
      setItems(
        response.items.map((item) => ({
          id: item.id,
          type: item.isAnonymous
            ? item.visibility === "PUBLIC" ? "anon-question" : "private-question"
            : item.visibility === "PUBLIC" ? "any-mentor-question" : "private-question",
          questionText: item.content,
          questionTitle: item.title,
          category: item.category.replaceAll("_", " "),
          submittedDate: formatDateTime(item.createdAt),
          visibility: item.visibility.toLowerCase() as "public" | "private",
           submittedBy: item.student,
          status: "pending",
        }))
      );
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to load moderation queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
    const interval = window.setInterval(() => {
      void loadQueue();
    }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  async function handleApprove(id: string | number) {
    if (typeof id !== "string") return;
    try {
      await approveQuestion(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      setReviewItem(null);
      onToast("success", "Question approved and published.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to approve question.");
    }
  }

  async function handleReject(id: string | number) {
    if (typeof id !== "string") return;
    try {
      await rejectQuestion(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      setReviewItem(null);
      onToast("success", "Question rejected.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to reject question.");
    }
  }

  const filtered = items.filter(m => filterStatus === "all" || m.status === filterStatus);

  const STATUS_TABS: { v: ModerationStatus | "all"; label: string }[] = [
    { v: "pending", label: `Pending (${items.filter(m => m.status === "pending").length})` },
    { v: "approved", label: "Approved (0)" },
    { v: "rejected", label: "Rejected (0)" },
    { v: "all", label: `All (${items.length})` },
  ];

  return (
    <div className="fade-in flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: C.textSec }}>
          Review student questions before publication. Only direct private mentee → assigned mentor questions bypass moderation.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void loadQueue()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: C.borderLight }}>
        {STATUS_TABS.map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setFilterStatus(v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: filterStatus === v ? "#fff" : "transparent",
              color: filterStatus === v ? C.text : C.textSec,
              boxShadow: filterStatus === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div
          className="grid text-xs font-semibold px-5 py-3"
          style={{
            gridTemplateColumns: "2.3fr 1.2fr 1fr 1.15fr 1fr 1fr auto",
            backgroundColor: C.bg,
            borderBottom: `1px solid ${C.border}`,
            color: C.textSec,
          }}
        >
          <div>QUESTION</div>
          <div>POSTED BY</div>
           <div>CATEGORY</div>
           <div>DATE</div>
           <div>VISIBILITY</div>
           <div>TYPE</div>
           <div>ACTION</div>
        </div>
        {loading && items.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>Loading moderation queue…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>No questions awaiting moderation.</div>
        )}
        {filtered.map((item, i) => {
          const typeLabel =
            item.type === "any-mentor-question"
              ? "Any Mentor"
              : item.type === "anon-question"
                ? "Anonymous · Public"
                : "Anonymous · Private";
          return (
            <div
              key={item.id}
              className="grid items-center px-5 py-3.5 gap-3"
              style={{
                gridTemplateColumns: "2.3fr 1.2fr 1fr 1.15fr 1fr 1fr auto",
                borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}`,
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-xs leading-snug overflow-hidden"
                  style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                >
                  {item.questionText}
                </p>
              </div>               <div className="min-w-0">
                 <div className="text-xs font-semibold truncate" style={{ color: C.text }}>
                   {item.submittedBy?.name ?? "Unnamed student"}
                 </div>
                 <div className="text-xs truncate" style={{ color: C.textSec }}>
                   {item.submittedBy?.email ?? ""}
                 </div>
               </div>

              <CategoryBadge category={item.category} />
              <div className="text-xs" style={{ color: C.textSec }}>{item.submittedDate}</div>
              <div>{item.visibility === "public" ? <PrivacyBadge type="public" /> : <PrivacyBadge type="private" />}</div>
              <Badge variant="pending">{typeLabel}</Badge>
              <button
                onClick={() => setReviewItem(item)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ backgroundColor: C.primaryLight, color: C.primary }}
              >
                Review
              </button>
            </div>
          );
        })}
      </div>

      {reviewItem && (
        <Modal title="Review question" onClose={() => setReviewItem(null)} width={620}>
          <p className="text-xs mb-4" style={{ color: C.textSec }}>
            This question is currently pending approval and is not visible to mentors or other students.
          </p>

          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <PrivacyBadge type={reviewItem.visibility === "public" ? "public" : "private"} />
              <Badge variant="pending">Pending approval</Badge>
            </div>
            <p className="text-base font-bold mb-2" style={{ color: C.text }}>
              {reviewItem.questionTitle ?? "Question"}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.textSec }}>
              {reviewItem.questionText}
            </p>
          </div>

           {reviewItem.submittedBy && (
             <div
               className="rounded-xl p-3 mb-4"
               style={{ backgroundColor: C.primaryLight, border: "1px solid " + C.border }}
             >
               <div className="text-xs font-semibold mb-1" style={{ color: C.primary }}>
                 Submitted by
               </div>
               <div className="text-sm font-semibold" style={{ color: C.text }}>
                 {reviewItem.submittedBy.name ?? "Unnamed student"}
               </div>
               <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                 {reviewItem.submittedBy.email}
               </div>
             </div>
           )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setReviewItem(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void handleReject(reviewItem.id)}>Reject</Button>
            <Button variant="primary" onClick={() => void handleApprove(reviewItem.id)}>Approve & Publish</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminReportsView({ onToast }: { onToast: (t: ToastType, msg: string) => void }) {
  type ReportItem = Awaited<ReturnType<typeof getAdminReports>>["items"][number];

  const [items, setItems] = useState<ReportItem[]>([]);
  const [counts, setCounts] = useState({ PENDING: 0, DISMISSED: 0, ACTION_TAKEN: 0 });
  const [filterStatus, setFilterStatus] = useState<ReportStatusValue>("PENDING");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [acting, setActing] = useState<"DISMISS" | "REMOVE_POST" | null>(null);

  async function loadReports(status: ReportStatusValue = filterStatus) {
    setLoading(true);
    try {
      const response = await getAdminReports({ status, page: 1, limit: 50 });
      setItems(response.items);
      setCounts(response.counts);
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports(filterStatus);
  }, [filterStatus]);

  async function handleAction(action: "DISMISS" | "REMOVE_POST") {
    if (!selected || acting) return;
    setActing(action);
    try {
      await updateAdminReport(selected.id, action);
      setSelected(null);
      await loadReports(filterStatus);
      onToast("success", action === "DISMISS" ? "Report dismissed." : "Post removed and related pending reports were actioned.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to update report.");
    } finally {
      setActing(null);
    }
  }

  const tabs: Array<{ value: ReportStatusValue; label: string }> = [
    { value: "PENDING", label: `Pending (${counts.PENDING})` },
    { value: "DISMISSED", label: `Dismissed (${counts.DISMISSED})` },
    { value: "ACTION_TAKEN", label: `Action taken (${counts.ACTION_TAKEN})` },
  ];

  const reasonLabel: Record<ReportReasonValue, string> = {
    SPAM: "Spam",
    HARASSMENT: "Harassment",
    INAPPROPRIATE_CONTENT: "Inappropriate content",
    MISINFORMATION: "Misinformation",
    PRIVACY: "Privacy",
    OFF_TOPIC: "Off-topic",
    OTHER: "Other",
  };

  const statusMeta: Record<ReportStatusValue, { label: string; bg: string; color: string }> = {
    PENDING: { label: "Pending", bg: C.pendingLight, color: C.pending },
    DISMISSED: { label: "Dismissed", bg: C.borderLight, color: C.textSec },
    ACTION_TAKEN: { label: "Action taken", bg: C.successLight, color: C.success },
  };

  return (
    <div className="fade-in flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium" style={{ color: C.text }}>Reported posts</p>
          <p className="text-xs mt-1" style={{ color: C.textSec }}>
            Review reports submitted by students and mentors.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadReports(filterStatus)} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: C.borderLight }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilterStatus(tab.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: filterStatus === tab.value ? "#fff" : "transparent",
              color: filterStatus === tab.value ? C.text : C.textSec,
              boxShadow: filterStatus === tab.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div
          className="grid text-xs font-semibold px-5 py-3 gap-3"
          style={{
            gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr auto",
            backgroundColor: C.bg,
            borderBottom: `1px solid ${C.border}`,
            color: C.textSec,
          }}
        >
          <div>POST</div><div>REASON</div><div>REPORTER</div><div>REPORTS</div><div>STATUS</div><div>ACTION</div>
        </div>

        {loading && items.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>Loading reports…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>No reports in this tab.</div>
        )}

        {items.map((item, i) => {
          const status = statusMeta[item.status];
          return (
            <div
              key={item.id}
              className="grid items-center px-5 py-3.5 gap-3"
              style={{
                gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr auto",
                borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}`,
              }}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug overflow-hidden" style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {item.question.title}
                </p>
                <p className="text-xs mt-1 truncate" style={{ color: C.textSec }}>
                  {item.question.isAnonymous ? "Anonymous student" : item.question.student.name ?? item.question.student.email}
                </p>
              </div>
              <div className="min-w-0">
                <Badge variant="error">{reasonLabel[item.reason as ReportReasonValue] ?? item.reason}</Badge>
                {item.details && <p className="text-xs mt-1 truncate" style={{ color: C.textSec }}>{item.details}</p>}
              </div>
              <div className="min-w-0">
                <p className="text-xs truncate" style={{ color: C.text }}>{item.reporter.name ?? item.reporter.email}</p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: C.textSec }}>{item.reporter.role.toLowerCase()}</p>
              </div>
              <div className="text-xs font-semibold" style={{ color: C.text }}>{item.question._count.reports}</div>
              <span className="text-xs px-2 py-1 rounded-full font-medium w-fit" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
              <button type="button" onClick={() => setSelected(item)} className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80" style={{ backgroundColor: C.primaryLight, color: C.primary }}>Review</button>
            </div>
          );
        })}
      </div>

      {selected && (
        <Modal title="Review report" onClose={() => !acting && setSelected(null)} width={650}>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="info">{selected.question.category.replaceAll("_", " ")}</Badge>
                <Badge variant={selected.question.isAnonymous ? "pending" : "neutral"}>{selected.question.isAnonymous ? "Anonymous" : "Identified student"}</Badge>
                <Badge variant="error">{reasonLabel[selected.reason as ReportReasonValue] ?? selected.reason}</Badge>
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>{selected.question.title}</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: C.text }}>{selected.question.content}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ border: `1px solid ${C.border}` }}>
                <div className="text-xs font-semibold mb-1" style={{ color: C.textSec }}>Reporter</div>
                <div className="text-sm" style={{ color: C.text }}>{selected.reporter.name ?? "Unnamed"}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{selected.reporter.email} · {selected.reporter.role.toLowerCase()}</div>
              </div>
              <div className="rounded-xl p-3" style={{ border: `1px solid ${C.border}` }}>
                <div className="text-xs font-semibold mb-1" style={{ color: C.textSec }}>Report</div>
                <div className="text-sm" style={{ color: C.text }}>{reasonLabel[selected.reason as ReportReasonValue] ?? selected.reason}</div>
                <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
            </div>
            {selected.details && (
              <div className="rounded-xl p-3" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="text-xs font-semibold mb-1" style={{ color: C.textSec }}>Reporter details</div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: C.text }}>{selected.details}</p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)} disabled={!!acting}>Close</Button>
              {selected.status === "PENDING" && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => void handleAction("DISMISS")} disabled={!!acting}>
                    {acting === "DISMISS" ? "Dismissing…" : "Dismiss report"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => void handleAction("REMOVE_POST")} disabled={!!acting}>
                    {acting === "REMOVE_POST" ? "Removing…" : "Remove post"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN QUESTIONS VIEW ──────────────────────────────────────────────────────

function AdminQuestionsView({
  onToast,
  onOpenQuestion,
}: {
  onToast: (t: ToastType, msg: string) => void;
  onOpenQuestion: (id: string) => void;
}) {
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    content: string;
    category: string;
    date: string;
    type: MentorQuestion["type"];
    asker: { name: string; email: string } | null;
    moderationStatus: string;
  }>>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadQuestions() {
    setLoading(true);
    try {
      const response = await getAdminQuestions();
      setQuestions(
        response.items.map((q) => ({
          id: q.id,
          question: q.title,
          content: q.content,
          category: q.category.replaceAll("_", " "),
          date: formatDateTime(q.createdAt),
          type: q.isAnonymous
            ? q.visibility === "PUBLIC" ? "anon-public" : "anon-private"
            : q.visibility === "PUBLIC" ? "any-mentor" : "private",
          asker: q.student
            ? { name: q.student.name ?? "Student", email: q.student.email }
            : null,
          moderationStatus: q.moderationStatus,
        }))
      );
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to load questions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  const needle = search.trim().toLowerCase();
  const filtered = questions.filter((q) => {
    if (!needle) return true;
    return (
      q.question.toLowerCase().includes(needle) ||
      q.content.toLowerCase().includes(needle) ||
      q.category.toLowerCase().includes(needle) ||
      (q.asker?.name.toLowerCase().includes(needle) ?? false) ||
      (q.asker?.email.toLowerCase().includes(needle) ?? false)
    );
  });

  const TYPE_LABEL: Record<MentorQuestion["type"], string> = {
    private: "Private",
    "any-mentor": "Any Mentor",
    "anon-public": "Anon · Public",
    "anon-private": "Anon · Private",
  };

  return (
    <div className="fade-in flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textSec }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search title, student name, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white outline-none"
            style={{ border: `1.5px solid ${C.border}`, color: C.text }}
          />
        </div>
        <span className="text-xs whitespace-nowrap" style={{ color: C.textSec }}>
          {filtered.length} questions
        </span>
        <Button variant="secondary" size="sm" onClick={() => void loadQuestions()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <p className="text-[11px] -mt-2" style={{ color: C.textSec }}>
        Admin search includes the student email for anonymous and non-anonymous posts.
      </p>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="grid text-xs font-semibold px-5 py-3"
          style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto", backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`, color: C.textSec }}>
          <div>QUESTION</div>
          <div>TYPE</div>
          <div>CATEGORY</div>
          <div>DATE</div>
          <div>STATUS</div>
        </div>
        {loading && questions.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>Loading questions…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: C.textSec }}>No questions found.</div>
        )}
        {filtered.map((q, i) => (
          <div
            key={q.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenQuestion(q.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenQuestion(q.id);
              }
            }}
            className="grid items-center px-5 py-3.5 gap-3 cursor-pointer transition-colors hover:bg-[#FAF9FE] focus:outline-none focus:bg-[#FAF9FE]"
            style={{ gridTemplateColumns: "3fr 1fr 1fr 1fr auto", borderTop: i === 0 ? "none" : `1px solid ${C.borderLight}` }}
          >
            <div className="flex items-start gap-2 min-w-0">
              {q.asker === null && <span className="text-base flex-shrink-0">🔒</span>}
              <div className="min-w-0">
                <p className="text-xs overflow-hidden" style={{ color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {q.question}
                </p>
                <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                  {q.asker?.name ?? "Anonymous Mentee"}
                </div>
                {q.asker?.email && (
                  <div className="text-xs mt-0.5" style={{ color: C.textSec }}>
                    {q.asker.email}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              {TYPE_LABEL[q.type]}
            </span>
            <CategoryBadge category={q.category} />
            <div className="text-xs" style={{ color: C.textSec }}>{q.date}</div>
            <Badge variant={q.moderationStatus === "PENDING" ? "pending" : q.moderationStatus === "REJECTED" ? "error" : "success"}>
              {q.moderationStatus}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN SETTINGS VIEW ───────────────────────────────────────────────────────

function AdminSettingsView({ onToast }: { onToast: (t: ToastType, msg: string) => void }) {
  const [anonApproval, setAnonApproval] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [autoFlag, setAutoFlag] = useState(true);

  function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${C.borderLight}` }}>
        <div>
          <div className="text-sm font-semibold" style={{ color: C.text }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: C.textSec }}>{desc}</div>
        </div>
        <button
          onClick={() => { onChange(!value); onToast("success", `Setting updated.`); }}
          className="relative w-10 h-6 rounded-full transition-all flex-shrink-0"
          style={{ backgroundColor: value ? C.primary : C.border }}
        >
          <span
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all"
            style={{ left: value ? "22px" : "4px" }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-xl flex flex-col gap-5">
      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Moderation Settings</h3>
        <Toggle label="Require approval for student questions" desc="All questions require admin approval except direct private mentee → assigned mentor questions." value={anonApproval} onChange={setAnonApproval} />
        <Toggle label="Auto-flag suspicious activity" desc="Automatically flag accounts with unusual posting patterns." value={autoFlag} onChange={setAutoFlag} />
        <Toggle label="Email notifications for reports" desc="Send an email alert when new reports are filed." value={emailNotifs} onChange={setEmailNotifs} />
      </div>
      <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Platform</h3>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={() => onToast("info", "Exporting user data…")}>Export User Data (CSV)</Button>
          <Button variant="secondary" size="sm" onClick={() => onToast("info", "Exporting question log…")}>Export Question Log (CSV)</Button>
          <Button variant="danger" size="sm" onClick={() => onToast("error", "Contact system administrator to perform this action.")}>Purge Rejected Content</Button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN SCREEN WRAPPER ──────────────────────────────────────────────────────

function AdminScreen({
  initialSection,
  onFullNavigate,
  onOpenQuestion,
  onToast,
}: {
  initialSection: AdminSection;
  onFullNavigate: (s: Screen) => void;
  onOpenQuestion: (id: string) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [section, setSection] = useState<AdminSection>(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  function handleNav(s: AdminSection) {
    setSection(s);
    const map: Record<AdminSection, Screen> = {
      dashboard: "admin-dashboard",
      users: "admin-users",
      mentors: "admin-mentors",
      questions: "admin-questions",
      moderation: "admin-moderation",
      reports: "admin-reports",
      settings: "admin-settings",
    };
    onFullNavigate(map[s]);
  }

  return (
    <AdminShell section={section} onNavigate={setSection} onFullNavigate={onFullNavigate}>
      {section === "dashboard" && <AdminDashboardView onNavigate={onFullNavigate} />}
      {section === "users" && <AdminUsersView section="users" onToast={onToast} />}
       {section === "mentors" && <AdminUsersView section="mentors" onToast={onToast} />}
       {section === "questions" && <AdminQuestionsView onToast={onToast} onOpenQuestion={onOpenQuestion} />}
      {section === "moderation" && <AdminModerationView onToast={onToast} />}
      {section === "reports" && <AdminReportsView onToast={onToast} />}
      {section === "settings" && <AdminSettingsView onToast={onToast} />}
    </AdminShell>
  );
}

// ─── PROFILE DATA ─────────────────────────────────────────────────────────────

interface MenteeProfileData {
  name: string;
  photo: string;
  email: string;
  school: string;
  year: string;
  track: string;
  bio: string;
  interests: string[];
  mentor: { name: string; specialty: string; photo: string };
  questionsAsked: number;
  questionsAnswered: number;
  memberSince: string;
}

interface MentorProfileData {
  name: string;
  photo: string;
  email: string;
  school: string;
  specialty: string;
  subspecialty: string;
  bio: string;
  yearsInPractice: number;
  mentoringYears: number;
  menteesActive: number;
  totalMentored: number;
  expertise: string[];
  availability: "available" | "busy" | "offline";
  memberSince: string;
  education: string;
  publications: number;
}

const MENTEE_PROFILE_DATA: MenteeProfileData = {
  name: "Alex Johnson",
  photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
  email: "alex.j@med.ucsf.edu",
  school: "UCSF School of Medicine",
  year: "M2",
  track: "Preclinical",
  bio: "Second-year medical student passionate about internal medicine and global health. Working toward a career in hospital medicine with a focus on underserved populations.",
  interests: ["Internal Medicine", "Global Health", "Step 2 CK", "Research", "Clinical Skills"],
  mentor: {
    name: "Dr. Mariam Khaled",
    specialty: "Internal Medicine",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop",
  },
  questionsAsked: 4,
  questionsAnswered: 3,
  memberSince: "August 2024",
};

const MENTOR_PROFILE_DATA: MentorProfileData = {
  name: "Dr. Mariam Khaled",
  photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
  email: "m.khaled@umc.edu",
  school: "University Medical Center",
  specialty: "Internal Medicine",
  subspecialty: "Hospital Medicine",
  bio: "Board-certified internist with 14 years of clinical experience in academic hospital medicine. I am passionate about medical education, evidence-based practice, and supporting the next generation of physicians through meaningful mentorship.",
  yearsInPractice: 14,
  mentoringYears: 6,
  menteesActive: 3,
  totalMentored: 19,
  expertise: ["Internal Medicine", "Hospital Medicine", "Step 2 CK", "Residency Applications", "Clinical Reasoning", "Work-Life Balance"],
  availability: "available",
  memberSince: "June 2024",
  education: "MD, Johns Hopkins University School of Medicine",
  publications: 12,
};

// ─── MENTEE PROFILE SCREEN ────────────────────────────────────────────────────

function MenteeProfileScreen({
  onNavigate,
  onToast,
}: {
  onNavigate: (s: Screen) => void;
  onToast: (t: ToastType, msg: string) => void;
}) {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);
  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof getQuestions>>>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    Promise.all([getMe(), getQuestions()])
      .then(([me, qs]) => {
        setUser(me);
        setName(me.name ?? "");
        setQuestions(qs);
      })
      .catch(() => onToast("error", "Unable to load your profile."));
  }, []);

  async function saveName() {
    try {
      const updated = await updateMe(name.trim() || null);
      setUser(updated);
      onToast("success", "Profile updated successfully.");
    } catch (error) {
      onToast("error", error instanceof Error ? error.message : "Unable to update profile.");
    }
  }

  const answered = questions.filter((q) => q.status === "ANSWERED").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ color: C.textSec, backgroundColor: C.borderLight }}>
            <Icons.ArrowLeft /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <Logo size="sm" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name || user?.email?.split("@")[0] || "User"} size={80} />
            <div className="flex-1">
              <h2 className="text-xl font-bold" style={{ color: C.text }}>{user?.name || "Your Profile"}</h2>
              <p className="text-sm" style={{ color: C.textSec }}>{user?.email || ""}</p>
              <span className="inline-flex mt-2 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.primaryLight, color: C.primary }}>Medical Student</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <InputField label="Name" value={name} onChange={setName} placeholder="Your name" />
            <div className="pt-6"><Button size="sm" onClick={saveName}>Save</Button></div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Questions Asked" value={questions.length} />
          <StatCard label="Answered" value={answered} />
          <StatCard label="Pending" value={questions.length - answered} />
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Assigned Mentor</h3>
          {user?.assignedMentor ? (
            <div className="flex items-center gap-3">
              <Avatar name={user.assignedMentor.name || "Mentor"} size={48} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: C.text }}>{user.assignedMentor.name || "Mentor"}</div>
                <div className="text-xs" style={{ color: C.textSec }}>Your assigned mentor</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate("ask-my-mentor")}>Ask a Question</Button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: C.textSec }}>No mentor has been assigned yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Questions Asked</h3>
          {questions.length === 0 ? (
            <p className="text-sm" style={{ color: C.textSec }}>No questions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {questions.map((q) => (
                <button key={q.id} type="button" onClick={() => {}} className="text-left px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                  <p className="text-xs font-medium" style={{ color: C.text }}>{q.title}</p>
                  <p className="text-xs mt-1" style={{ color: C.textSec }}>{new Date(q.createdAt).toLocaleString()} · {q.status}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: C.primaryLight }}>
      <div className="stat-numeral" style={{ color: C.primary }}>{value}</div>
      <div className="text-xs mt-0.5 font-medium" style={{ color: C.primary }}>{label}</div>
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
  const [user, setUser] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);
  const [mentees, setMentees] = useState<Awaited<ReturnType<typeof getMentorMentees>>["items"]>([]);
  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof getMentorQueue>>>([]);

  useEffect(() => {
    Promise.all([getMe(), getMentorMentees(), getMentorQueue()])
      .then(([me, ms, qs]) => {
        setUser(me);
        setMentees(ms.items);
        setQuestions(qs);
      })
      .catch(() => onToast("error", "Unable to load your mentor profile."));
  }, []);

  const answered = questions.filter((q) => q.responses > 0).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => onNavigate("mentor-dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium" style={{ color: C.textSec, backgroundColor: C.borderLight }}>
            <Icons.ArrowLeft /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <Logo size="sm" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name || user?.email?.split("@")[0] || "Mentor"} size={80} />
            <div>
              <h2 className="text-xl font-bold" style={{ color: C.text }}>{user?.name || "Mentor Profile"}</h2>
              <p className="text-sm" style={{ color: C.textSec }}>{user?.email || ""}</p>
              <span className="inline-flex mt-2 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: C.successLight, color: C.success }}>Mentor</span>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Mentees" value={mentees.length} />
          <StatCard label="Questions" value={questions.length} />
          <StatCard label="Answered" value={answered} />
        </div>
        <Card className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Assigned Mentees</h3>
          {mentees.length === 0 ? <p className="text-sm" style={{ color: C.textSec }}>No mentees assigned.</p> : (
            <div className="flex flex-col gap-2">
              {mentees.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: C.bg }}>
                  <Avatar name={m.name || "Mentee"} size={40} />
                  <div><div className="text-sm font-semibold" style={{ color: C.text }}>{m.name || "Mentee"}</div><div className="text-xs" style={{ color: C.textSec }}>{m.email}</div></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
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
          {([] as typeof LEADERBOARD_MENTORS).map((m, idx) => {
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
  notifCount,
}: {
  role: Role;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  notifCount: number;
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
      s: "notifications-page" as Screen,
      label: "Alerts",
      badge: notifCount,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 3a6 6 0 016 6v3.5l1.5 2.5H3.5L5 12.5V9a6 6 0 016-6z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0}/>
          <path d="M9 18a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
      s: "notifications-page" as Screen,
      label: "Questions",
      badge: MENTOR_WAITING_QUESTIONS.length,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M19 11c0 3.5-3.582 7-8 7-.9 0-1.76-.14-2.53-.4L3 19.5l.8-3.5A7 7 0 014 11c0-3.5 3.582-7 8-7s7 3.5 7 7z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0}/>
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
    if (s === "notifications-page" && screen === "notifications-page") return true;
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
  const [authEmail, setAuthEmail] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [mentorPending, setMentorPending] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number>(101);
  const [questionToAnswer, setQuestionToAnswer] = useState<MentorQuestion | null>(null);
  let toastId = 0;

  async function handleLogout() {
    try {
      await logout();
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

  async function handleRoleSelect(r: Role) {
    if (!r || !authEmail) return;
    try {
      await login(authEmail, r);
      const me = await getMe();
      const actualRole: Role =
        me.role === "STUDENT" ? "mentee" :
        me.role === "MENTOR" ? "mentor" :
        "admin";
      setRole(actualRole);
      setScreen(
        actualRole === "mentee"
          ? "dashboard"
          : actualRole === "mentor"
            ? "mentor-dashboard"
            : "admin-dashboard",
      );
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  async function continueAfterVerification() {
    const roles = availableRoles;
    if (roles.length === 0) {
      if (mentorPending) {
        addToast("info", "Your mentor application is still pending admin approval. Mentor access will be available after approval.");
        setScreen("login");
        return;
      }
      await handleRoleSelect("mentee");
      return;
    }
    if (roles.length === 1) {
      const only = roles[0];
      await handleRoleSelect(only === "STUDENT" ? "mentee" : only === "MENTOR" ? "mentor" : "admin");
      return;
    }
    setScreen("onboarding-role");
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
        <LoginScreen
          onSignup={() => setScreen("mentor-signup")}
          onNext={async (email) => {
            try {
              const roles = await getAvailableRoles(email);
              setAuthEmail(email);
              setAvailableRoles(roles.roles);
              setMentorPending(roles.mentorPending);
              setScreen("verify");
            } catch (error) {
              addToast("error", error instanceof Error ? error.message : "Unable to check this account.");
            }
          }}
          onSignup={() => setScreen("mentor-signup")}
          onDemoLogin={async (demoRole) => {
            try {
              // The admin demo must create a real NextAuth session so protected
              // admin API routes recognize the demo user as an ADMIN.
              if (demoRole === "admin") {
                await login("admin@demo.medmentor.edu", "admin");
              }

              setRole(demoRole);
              setScreen(
                demoRole === "mentee"
                  ? "dashboard"
                  : demoRole === "mentor"
                    ? "mentor-dashboard"
                    : "admin-dashboard",
              );
              addToast(
                "info",
                `Demo mode: signed in as ${demoRole === "mentee" ? "student" : demoRole} with placeholder data.`,
              );
            } catch (error) {
              addToast(
                "error",
                error instanceof Error ? error.message : "Unable to start the admin demo session.",
              );
            }
          }}
        />
      )}
      {screen === "mentor-signup" && <MentorSignupScreen onBack={() => setScreen("login")} onSubmitted={(email) => { setAuthEmail(email); setScreen("login"); }} />}
      {screen === "mentor-signup" && (
        <MentorSignupScreen
          onBack={() => setScreen("login")}
          onSubmitted={(email) => {
            setAuthEmail(email);
            setScreen("login");
            addToast("success", "Mentor signup submitted. An admin must approve the mentor account before mentor access is enabled.");
          }}
        />
      )}
      {screen === "verify" && (
        <VerifyScreen
          onNext={() => {
            addToast("success", "Email verified successfully!");
            void continueAfterVerification();
          }}
        />
      )}
      {screen === "onboarding-role" && (
        <OnboardingRoleScreen onSelect={handleRoleSelect} availableRoles={availableRoles} />
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
          onOpenQuestion={openQuestion}
          onToast={addToast}
        />
      )}
      {screen === "ask-my-mentor" && (
        <AskQuestionScreen
          initialStep="my-mentor"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onOpenQuestion={openQuestion}
          onToast={addToast}
        />
      )}
      {screen === "ask-any-mentor" && (
        <AskQuestionScreen
          initialStep="any-mentor"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onOpenQuestion={openQuestion}
          onToast={addToast}
        />
      )}
      {screen === "ask-anonymous" && (
        <AskQuestionScreen
          initialStep="anonymous"
          onBack={() => setScreen("dashboard")}
          onNavigate={setScreen}
          onOpenQuestion={openQuestion}
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
          onBack={() => setScreen(role === "admin" ? "admin-questions" : "feed")}
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
          onOpenQuestion={openQuestion}
          onToast={addToast}
        />
      )}
      {(screen === "admin-dashboard" || screen === "admin-users" || screen === "admin-mentors" || screen === "admin-questions" || screen === "admin-moderation" || screen === "admin-reports" || screen === "admin-settings") && (
        <AdminScreen
          initialSection={
            screen === "admin-dashboard" ? "dashboard"
            : screen === "admin-users" ? "users"
             : screen === "admin-mentors" ? "mentors"
             : screen === "admin-questions" ? "questions"
            : screen === "admin-moderation" ? "moderation"
            : screen === "admin-reports" ? "reports"
            : "settings"
          }
          onFullNavigate={setScreen}
           onOpenQuestion={openQuestion}
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
