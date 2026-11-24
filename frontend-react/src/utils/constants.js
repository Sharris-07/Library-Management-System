// Application wide constants. Every other file imports from here,
// so a value is changed in one place only.

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const ROLES = Object.freeze({
  STUDENT: "student",
  LIBRARIAN: "librarian",
  ADMIN: "admin",
});

export const COPY_STATUS = Object.freeze({
  AVAILABLE: "available",
  BORROWED: "borrowed",
  RESERVED: "reserved",
  LOST: "lost",
});

export const LOAN_STATUS = Object.freeze({
  ACTIVE: "active",
  RETURNED: "returned",
  OVERDUE: "overdue",
});

export const PAYMENT_STATUS = Object.freeze({
  PAID: "paid",
  UNPAID: "unpaid",
});

export const BORROW_POLICY = Object.freeze({
  LOAN_DAYS: 14,
  FINE_PER_DAY: 5,
  MAX_ACTIVE_LOANS: 5,
});

export const ROUTES = Object.freeze({
  LOGIN: "/login",
  REGISTER: "/register",

  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_CATALOGUE: "/student/catalogue",
  STUDENT_HISTORY: "/student/history",
  STUDENT_FINES: "/student/fines",

  LIBRARIAN_DASHBOARD: "/librarian/dashboard",
  LIBRARIAN_BOOKS: "/librarian/books",
  LIBRARIAN_ISSUE_RETURN: "/librarian/issue-return",
  LIBRARIAN_RESERVATIONS: "/librarian/reservations",
  LIBRARIAN_OVERDUE: "/librarian/overdue",
  LIBRARIAN_MEMBERS: "/librarian/members",

  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_LOGS: "/admin/logs",
  ADMIN_SETTINGS: "/admin/settings",
});

// Home page of each role, used for redirection after login.
export const ROLE_HOME = Object.freeze({
  [ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD,
  [ROLES.LIBRARIAN]: ROUTES.LIBRARIAN_DASHBOARD,
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
});

export const STORAGE_KEYS = Object.freeze({
  TOKEN: "lms_token",
  USER: "lms_user",
});