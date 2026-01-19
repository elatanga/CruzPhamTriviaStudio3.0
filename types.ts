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

export interface Template {
  id: string;
  name: string;
  rows: number;
  cols: number;
  categories: Category[];
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
  templateId: string | null;
  categories: Category[];
  players: Player[];
  activePlayerIndex: number;
  currentQuestion: { categoryId: string; questionId: string } | null;
  activityLog: string[];
  timer: number;
  isTimerRunning: boolean;
  directorMode: boolean; // Is director panel open
}

export interface User {
  username: string;
  passwordHash: string; // Stored securely
  salt: string;
  createdAt: number;
}

export interface Session {
  sessionId: string;
  username: string;
  userAgent: string;
  createdAt: number;
  lastHeartbeat: number;
  expiresAt: number;
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
