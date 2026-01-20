

export enum QuestionState {
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',     // Currently displayed
  REVEALED = 'REVEALED', // Answer shown
  AWARDED = 'AWARDED',   // Points given
  VOIDED = 'VOIDED',     // Removed from play without score
  CLOSED = 'CLOSED'      // Returned without score
}

export interface Question {
  id: string;
  question: string;
  answer: string;
  points: number;
  state: QuestionState;
  isDoubleOrNothing: boolean;
}

export interface Category {
  id: string;
  name: string;
  questions: Question[]; // Ordered by points
}

export interface BoardConfig {
  version: number;
  columns: number; // 1-8
  rows: number;    // 1-10
  pointValues: number[];
}

export interface Template {
  id: string;
  name: string;
  rows: number; // Kept for legacy compatibility
  cols: number; // Kept for legacy compatibility
  boardConfig?: BoardConfig; // New config object
  categories: Category[];
  createdAt: number;
}

export interface Production {
  id: string;
  userId: string; // Links to User.id (not username)
  name: string;
  createdAt: number;
}

export interface Player {
  id: number;
  name: string;
  score: number;
  streak: number;
}

export interface GameState {
  isActive: boolean;
  eventName: string; // The specific event name (e.g., "Friday Night Trivia")
  gameTitle: string; // Usually the template name
  templateId: string | null;
  categories: Category[];
  players: Player[];
  activePlayerIndex: number;
  askedPlayerIndex?: number; // The player who was active when the question was selected
  currentQuestion: { categoryId: string; questionId: string } | null;
  currentQuestionState: QuestionState | null; 
  activityLog: string[];
  timer: number;
  isTimerRunning: boolean;
  directorMode: boolean; // Is director panel open
  productionName?: string; // Snapshot of production name
}

// --- AUTH & ADMIN SYSTEM ---

export type UserStatus = 'ACTIVE' | 'REVOKED' | 'SUSPENDED';

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface User {
  id: string;
  username: string;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
  notes?: string;
  passwordHash: string;
  salt: string;
}

export interface AuthToken {
  id: string;
  userId: string;
  tokenHash: string;
  salt: string;
  label?: string;
  createdAt: number;
  expiresAt: number | null; // null = never
  revokedAt: number | null;
  lastUsedAt: number | null;
  rotationCount: number;
}

export interface Session {
  sessionId: string;
  userId: string;
  userType: 'ADMIN' | 'USER';
  username: string;
  userAgent: string;
  createdAt: number;
  lastHeartbeat: number;
  expiresAt: number;
}

export type TokenRequestStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED';

export interface TokenRequest {
  id: string;
  firstName: string;
  lastName: string;
  tiktokHandle: string;
  phoneNumber: string; // New field for contact
  preferredUsername: string;
  status: TokenRequestStatus;
  emailStatus: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  deviceHash: string; // For rate limiting
  ipHash?: string; // Simulated IP hash
  adminNotes?: string;
  lastError?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  adminId: string;
  action: string;
  targetUserId?: string;
  targetTokenId?: string;
  metadata?: any;
}

// For AI Generation
export interface GeneratedCategory {
  name: string;
  questions: {
    q: string;
    a: string;
  }[];
}

// --- LOGGING & ERROR HANDLING ---

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  correlationId?: string;
  sessionId?: string;
  username?: string; // Non-sensitive
  data?: any;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly isRecoverable: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', isRecoverable: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isRecoverable = isRecoverable;
  }
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}