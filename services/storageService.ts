import { Template, User, Session, AppError } from '../types';
import { logger } from './loggerService';

// --- CONSTANTS ---
const KEYS = {
  USERS: 'cruzphamtrivia_users_v2',
  SESSIONS: 'cruzphamtrivia_sessions_v2',
  TEMPLATES: 'cruzphamtrivia_templates_v2'
};

const SESSION_TTL = 30 * 60 * 1000; 
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 5;

// --- IN-MEMORY RATE LIMITER ---
const rateLimits: Record<string, number[]> = {};

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const attempts = rateLimits[key] || [];
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW);
  rateLimits[key] = [...recent, now];
  return recent.length < MAX_ATTEMPTS;
};

// --- CRYPTO HELPERS ---
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const generateSalt = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
};

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
};

// --- DB HELPERS ---
const getDB = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    logger.error('DB_READ_ERROR', e as Error, { key });
    return [];
  }
};

const saveDB = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    logger.error('DB_WRITE_ERROR', e as Error, { key });
    throw new AppError("Storage Quota Exceeded or Write Error", "STORAGE_ERROR", false);
  }
};

export const StorageService = {
  
  register: async (username: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    const cid = crypto.randomUUID();
    logger.info('AUTH_REGISTER_ATTEMPT', { username }, cid);

    if (!checkRateLimit('register')) {
      logger.warn('RATE_LIMIT_EXCEEDED', { action: 'register', ip: 'client' }, cid);
      return { success: false, error: "Rate limit exceeded. Try again later." };
    }
    
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) return { success: false, error: "Username too short." };

    try {
      const users = getDB<User>(KEYS.USERS);
      if (users.find(u => u.username === cleanUsername)) {
        logger.warn('AUTH_DUPLICATE_USER', { username: cleanUsername }, cid);
        return { success: false, error: "Username already exists." };
      }

      const token = generateToken();
      const salt = generateSalt();
      const passwordHash = await hashPassword(token, salt);

      const newUser: User = {
        username: cleanUsername,
        passwordHash,
        salt,
        createdAt: Date.now()
      };

      saveDB(KEYS.USERS, [...users, newUser]);
      logger.audit('USER_CREATED', { username: cleanUsername }, cid);

      return { success: true, token };
    } catch (e) {
      logger.error('AUTH_REGISTER_ERROR', e as Error, { username }, cid);
      return { success: false, error: "System Error during registration" };
    }
  },

  login: async (username: string, token: string): Promise<{ success: boolean; session?: Session; error?: string }> => {
    const cid = crypto.randomUUID();
    logger.info('AUTH_LOGIN_ATTEMPT', { username }, cid);

    if (!checkRateLimit('login')) {
      logger.warn('RATE_LIMIT_EXCEEDED', { action: 'login' }, cid);
      return { success: false, error: "Too many login attempts." };
    }

    const cleanUsername = username.trim().toLowerCase();
    
    try {
      const users = getDB<User>(KEYS.USERS);
      const user = users.find(u => u.username === cleanUsername);

      if (!user) {
        logger.warn('AUTH_INVALID_USER', { username: cleanUsername }, cid);
        return { success: false, error: "Invalid credentials." };
      }

      const attemptHash = await hashPassword(token, user.salt);
      if (attemptHash !== user.passwordHash) {
        logger.warn('AUTH_INVALID_PASSWORD', { username: cleanUsername }, cid);
        return { success: false, error: "Invalid credentials." };
      }

      // Revocation
      let sessions = getDB<Session>(KEYS.SESSIONS);
      const activeSessionCount = sessions.filter(s => s.username === cleanUsername).length;
      if (activeSessionCount > 0) {
        logger.audit('SESSION_REVOKED_CONFLICT', { username: cleanUsername, count: activeSessionCount }, cid);
        sessions = sessions.filter(s => s.username !== cleanUsername);
      }

      const newSession: Session = {
        sessionId: crypto.randomUUID(),
        username: cleanUsername,
        userAgent: navigator.userAgent,
        createdAt: Date.now(),
        lastHeartbeat: Date.now(),
        expiresAt: Date.now() + SESSION_TTL
      };

      sessions.push(newSession);
      saveDB(KEYS.SESSIONS, sessions);

      // Initialize Logger Context
      logger.setContext(newSession.sessionId, cleanUsername);
      logger.audit('SESSION_CREATED', { sessionId: newSession.sessionId }, cid);

      return { success: true, session: newSession };
    } catch (e) {
      logger.error('AUTH_LOGIN_ERROR', e as Error, { username }, cid);
      return { success: false, error: "System Error" };
    }
  },

  logout: async (sessionId: string) => {
    logger.info('AUTH_LOGOUT', { sessionId });
    try {
      const sessions = getDB<Session>(KEYS.SESSIONS);
      const newSessions = sessions.filter(s => s.sessionId !== sessionId);
      saveDB(KEYS.SESSIONS, newSessions);
      logger.setContext(null, null);
    } catch (e) {
      logger.error('AUTH_LOGOUT_ERROR', e as Error);
    }
  },

  heartbeat: async (sessionId: string): Promise<boolean> => {
    try {
      const sessions = getDB<Session>(KEYS.SESSIONS);
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);

      if (sessionIndex === -1) return false;

      const session = sessions[sessionIndex];
      if (Date.now() > session.expiresAt) {
        sessions.splice(sessionIndex, 1);
        saveDB(KEYS.SESSIONS, sessions);
        logger.info('SESSION_EXPIRED', { sessionId });
        return false;
      }

      session.lastHeartbeat = Date.now();
      session.expiresAt = Date.now() + SESSION_TTL;
      sessions[sessionIndex] = session;
      saveDB(KEYS.SESSIONS, sessions);
      return true;
    } catch (e) {
      logger.error('HEARTBEAT_ERROR', e as Error);
      return false;
    }
  },

  getTemplates: (username: string): Template[] => {
    const allTemplates = getDB<{owner: string, template: Template}>(KEYS.TEMPLATES);
    return allTemplates.filter(t => t.owner === username).map(t => t.template);
  },

  saveTemplate: (username: string, template: Template): boolean => {
    const cid = crypto.randomUUID();
    logger.info('TEMPLATE_SAVE_ATTEMPT', { templateId: template.id }, cid);
    
    try {
      const allWrapper = getDB<{owner: string, template: Template}>(KEYS.TEMPLATES);
      const userTemplates = allWrapper.filter(t => t.owner === username);

      if (userTemplates.length >= 40) {
        const existing = userTemplates.find(t => t.template.id === template.id);
        if (!existing) {
          logger.warn('TEMPLATE_LIMIT_REACHED', { count: userTemplates.length }, cid);
          return false;
        }
      }

      const otherTemplates = allWrapper.filter(t => !(t.owner === username && t.template.id === template.id));
      otherTemplates.push({ owner: username, template });
      saveDB(KEYS.TEMPLATES, otherTemplates);
      
      logger.audit('TEMPLATE_SAVED', { templateId: template.id, name: template.name }, cid);
      return true;
    } catch (e) {
      logger.error('TEMPLATE_SAVE_ERROR', e as Error, { templateId: template.id }, cid);
      return false;
    }
  },

  deleteTemplate: (username: string, id: string) => {
    const cid = crypto.randomUUID();
    try {
      const all = getDB<{owner: string, template: Template}>(KEYS.TEMPLATES);
      const filtered = all.filter(t => !(t.owner === username && t.template.id === id));
      saveDB(KEYS.TEMPLATES, filtered);
      logger.audit('TEMPLATE_DELETED', { templateId: id }, cid);
    } catch (e) {
      logger.error('TEMPLATE_DELETE_ERROR', e as Error, { templateId: id }, cid);
    }
  },

  exportTemplate: (username: string, id: string) => {
    logger.info('TEMPLATE_EXPORT', { templateId: id });
    const templates = StorageService.getTemplates(username);
    const t = templates.find(item => item.id === id);
    if (!t) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(t));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `cruzpham_trivia_${t.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};
