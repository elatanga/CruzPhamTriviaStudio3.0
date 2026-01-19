
import { Template, User, Session, AppError, GameState, Admin, AuthToken, AuditLogEntry, UserStatus, TokenRequest, TokenRequestStatus, Production } from '../types';
import { logger } from './loggerService';

// --- CONSTANTS ---
const KEYS = {
  ADMINS: 'cruzphamtrivia_admins_v1',
  USERS: 'cruzphamtrivia_users_v3',
  TOKENS: 'cruzphamtrivia_tokens_v1',
  SESSIONS: 'cruzphamtrivia_sessions_v3',
  AUDIT_LOGS: 'cruzphamtrivia_audit_v1',
  TEMPLATES: 'cruzphamtrivia_templates_v2',
  PRODUCTIONS: 'cruzphamtrivia_productions_v1',
  ACTIVE_CONTEXT: 'cruzphamtrivia_active_context_v1',
  TICKETS: 'cruzphamtrivia_detach_tickets_v1',
  GAME_STATE: 'cruzphamtrivia_gamestate_v2',
  REQUESTS: 'cruzphamtrivia_token_requests_v1',
  DEVICE_ID: 'cruzphamtrivia_device_id_v1' // Simple tracker for device
};

const SESSION_TTL = 60 * 60 * 1000; // 1 Hour
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TEMPLATES_PER_PRODUCTION = 40;

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

const generateSecureToken = (): string => {
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

// Helper: Normalize token input (remove dashes, spaces, make lowercase)
const normalizeToken = (token: string): string => {
  return token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};

// Helper: Normalize username (trim, lowercase)
const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
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

// Interface for Ticket
interface DetachTicket {
  ticket: string;
  sessionId: string;
  expiresAt: number;
}

// --- INIT DEFAULT ADMIN ---
const initDefaultAdmin = async () => {
  const admins = getDB<Admin>(KEYS.ADMINS);
  if (admins.length === 0) {
    const salt = generateSalt();
    // Default: admin / admin (Developers should change this in production flow)
    const token = generateSecureToken();
    const hash = await hashPassword(token, salt);
    
    const newAdmin: Admin = {
      id: crypto.randomUUID(),
      username: 'admin',
      passwordHash: hash,
      salt: salt,
      createdAt: Date.now(),
      lastLoginAt: null
    };
    
    saveDB(KEYS.ADMINS, [newAdmin]);
    console.group('%c[ADMIN SETUP] INITIAL CREDENTIALS GENERATED', 'color: gold; background: black; font-size: 14px; padding: 4px;');
    console.log('Username: admin');
    console.log(`Token: ${token}`);
    console.log('%cCOPY THIS TOKEN NOW. IT WILL NOT BE SHOWN AGAIN.', 'color: red; font-weight: bold;');
    console.groupEnd();
  }
};

// Run init
initDefaultAdmin();

// --- TEMPLATE INTERFACE WITH OWNER ---
interface StoredTemplate {
  owner: string;
  productionId?: string; // Newly added
  template: Template;
}

// --- DEVICE IDENTIFICATION (SIMULATED) ---
const getDeviceId = (): string => {
  let id = localStorage.getItem(KEYS.DEVICE_ID);
  if (!id) {
    id = generateSecureToken();
    localStorage.setItem(KEYS.DEVICE_ID, id);
  }
  return id;
};

export const StorageService = {
  
  getDeviceId, // Expose for API service

  // --- AUTHENTICATION ---

  login: async (username: string, token: string): Promise<{ success: boolean; session?: Session; error?: string; isAdmin?: boolean }> => {
    const cid = crypto.randomUUID();
    const cleanUsername = normalizeUsername(username);
    const cleanToken = normalizeToken(token);
    
    if (!checkRateLimit(`login_${cleanUsername}`)) {
      return { success: false, error: "Too many attempts. Please wait." };
    }

    // 1. CHECK ADMINS FIRST
    const admins = getDB<Admin>(KEYS.ADMINS);
    const admin = admins.find(a => normalizeUsername(a.username) === cleanUsername);

    if (admin) {
      const attemptHash = await hashPassword(cleanToken, admin.salt);
      if (attemptHash === admin.passwordHash) {
        // Success Admin Login
        const session: Session = {
          sessionId: crypto.randomUUID(),
          userId: admin.id,
          userType: 'ADMIN',
          username: admin.username,
          userAgent: navigator.userAgent,
          createdAt: Date.now(),
          lastHeartbeat: Date.now(),
          expiresAt: Date.now() + SESSION_TTL
        };
        
        let sessions = getDB<Session>(KEYS.SESSIONS);
        sessions = sessions.filter(s => s.userId !== admin.id);
        sessions.push(session);
        saveDB(KEYS.SESSIONS, sessions);

        admin.lastLoginAt = Date.now();
        saveDB(KEYS.ADMINS, admins.map(a => a.id === admin.id ? admin : a));

        logger.audit('ADMIN_LOGIN_SUCCESS', { adminId: admin.id }, cid);
        logger.setContext(session.sessionId, admin.username);
        return { success: true, session, isAdmin: true };
      }
    }

    // 2. CHECK USERS
    const users = getDB<User>(KEYS.USERS);
    const user = users.find(u => normalizeUsername(u.username) === cleanUsername);

    if (user) {
      if (user.status !== 'ACTIVE') {
        logger.warn('AUTH_USER_NOT_ACTIVE', { username: cleanUsername, status: user.status }, cid);
        return { success: false, error: "Account suspended or revoked." };
      }

      const allTokens = getDB<AuthToken>(KEYS.TOKENS);
      // Filter valid tokens for this user
      const userTokens = allTokens.filter(t => t.userId === user.id && !t.revokedAt);
      
      let validToken: AuthToken | null = null;
      
      for (const t of userTokens) {
        if (t.expiresAt && Date.now() > t.expiresAt) continue;
        const attemptHash = await hashPassword(cleanToken, t.salt);
        if (attemptHash === t.tokenHash) {
          validToken = t;
          break;
        }
      }

      if (validToken) {
        let sessions = getDB<Session>(KEYS.SESSIONS);
        sessions = sessions.filter(s => s.userId !== user.id);
        
        const session: Session = {
          sessionId: crypto.randomUUID(),
          userId: user.id,
          userType: 'USER',
          username: user.username,
          userAgent: navigator.userAgent,
          createdAt: Date.now(),
          lastHeartbeat: Date.now(),
          expiresAt: Date.now() + SESSION_TTL
        };
        
        sessions.push(session);
        saveDB(KEYS.SESSIONS, sessions);

        user.lastLoginAt = Date.now();
        validToken.lastUsedAt = Date.now();
        
        saveDB(KEYS.USERS, users.map(u => u.id === user.id ? user : u));
        saveDB(KEYS.TOKENS, allTokens.map(t => t.id === validToken!.id ? validToken! : t));

        logger.info('USER_LOGIN_SUCCESS', { userId: user.id }, cid);
        logger.setContext(session.sessionId, user.username);
        return { success: true, session, isAdmin: false };
      } else {
        logger.warn('AUTH_INVALID_TOKEN', { username: cleanUsername }, cid);
        return { success: false, error: "Invalid or expired token." };
      }
    }

    logger.warn('AUTH_UNKNOWN_USER', { username: cleanUsername }, cid);
    return { success: false, error: "Identity not found." };
  },

  restoreSession: async (sessionId: string): Promise<Session | null> => {
    const sessions = getDB<Session>(KEYS.SESSIONS);
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session) return null;
    if (Date.now() > session.expiresAt + 60000) return null;

    session.lastHeartbeat = Date.now();
    session.expiresAt = Date.now() + SESSION_TTL;
    saveDB(KEYS.SESSIONS, sessions.map(s => s.sessionId === sessionId ? session : s));
    
    logger.setContext(session.sessionId, session.username);
    return session;
  },

  logout: async (sessionId: string) => {
    const sessions = getDB<Session>(KEYS.SESSIONS);
    saveDB(KEYS.SESSIONS, sessions.filter(s => s.sessionId !== sessionId));
    localStorage.removeItem(KEYS.GAME_STATE);
    localStorage.removeItem(KEYS.ACTIVE_CONTEXT); // Clear context on logout
    logger.setContext(null, null);
  },

  heartbeat: async (sessionId: string): Promise<boolean> => {
    const sessions = getDB<Session>(KEYS.SESSIONS);
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
      saveDB(KEYS.SESSIONS, sessions.filter(s => s.sessionId !== sessionId));
      return false;
    }

    session.lastHeartbeat = Date.now();
    session.expiresAt = Date.now() + SESSION_TTL;
    saveDB(KEYS.SESSIONS, sessions.map(s => s.sessionId === sessionId ? session : s));
    return true;
  },

  // --- PRODUCTIONS & CONTEXT ---

  getProductions: (userId: string): Production[] => {
    const all = getDB<Production>(KEYS.PRODUCTIONS);
    return all.filter(p => p.userId === userId).sort((a,b) => b.createdAt - a.createdAt);
  },

  createProduction: (userId: string, name: string): Production => {
    const all = getDB<Production>(KEYS.PRODUCTIONS);
    const newProd: Production = {
      id: crypto.randomUUID(),
      userId,
      name: name.trim(),
      createdAt: Date.now()
    };
    saveDB(KEYS.PRODUCTIONS, [...all, newProd]);
    return newProd;
  },

  setActiveProduction: (userId: string, productionId: string) => {
    const all = getDB<Record<string, string>>(KEYS.ACTIVE_CONTEXT);
    // Note: getDB returns array but we want key-value for context? 
    // Actually simplicity: store array of {userId, productionId}
    interface UserContext { userId: string; productionId: string; }
    let contexts = getDB<UserContext>(KEYS.ACTIVE_CONTEXT);
    contexts = contexts.filter(c => c.userId !== userId);
    contexts.push({ userId, productionId });
    saveDB(KEYS.ACTIVE_CONTEXT, contexts);
  },

  getActiveProduction: (userId: string): Production | null => {
    interface UserContext { userId: string; productionId: string; }
    const contexts = getDB<UserContext>(KEYS.ACTIVE_CONTEXT);
    const ctx = contexts.find(c => c.userId === userId);
    if (!ctx) return null;
    
    const prods = getDB<Production>(KEYS.PRODUCTIONS);
    return prods.find(p => p.id === ctx.productionId) || null;
  },

  // --- MIGRATION LOGIC ---
  migrateLegacyTemplates: (userId: string, username: string) => {
    // 1. Get templates for user that HAVE NO productionId
    const allWrapper = getDB<StoredTemplate>(KEYS.TEMPLATES);
    const userLegacy = allWrapper.filter(t => t.owner === username && !t.productionId);

    if (userLegacy.length > 0) {
      // 2. Check if "My Show" exists
      let prods = getDB<Production>(KEYS.PRODUCTIONS);
      let defaultProd = prods.find(p => p.userId === userId && p.name === "My Show");
      
      if (!defaultProd) {
        defaultProd = {
          id: crypto.randomUUID(),
          userId,
          name: "My Show",
          createdAt: Date.now()
        };
        prods.push(defaultProd);
        saveDB(KEYS.PRODUCTIONS, prods);
      }

      // 3. Assign
      const updatedWrapper = allWrapper.map(t => {
        if (t.owner === username && !t.productionId) {
          return { ...t, productionId: defaultProd!.id };
        }
        return t;
      });
      saveDB(KEYS.TEMPLATES, updatedWrapper);
      logger.info('MIGRATION_COMPLETE', { count: userLegacy.length, production: defaultProd.name });
    }
  },

  // --- TEMPLATES (RBAC + PRODUCTION SCOPE) ---

  getTemplates: (username: string, role: 'ADMIN' | 'USER', productionId?: string): (Template & { ownerName?: string })[] => {
    const allWrapper = getDB<StoredTemplate>(KEYS.TEMPLATES);
    
    if (role === 'ADMIN') {
      return allWrapper.map(t => ({ ...t.template, ownerName: t.owner }));
    } else {
      let userTemplates = allWrapper.filter(t => t.owner === username);
      // Filter by production if provided
      if (productionId) {
        userTemplates = userTemplates.filter(t => t.productionId === productionId);
      }
      return userTemplates.map(t => t.template);
    }
  },

  saveTemplate: (username: string, template: Template, role: 'ADMIN' | 'USER', productionId?: string): boolean => {
    const cid = crypto.randomUUID();
    try {
      const allWrapper = getDB<StoredTemplate>(KEYS.TEMPLATES);
      const existingIndex = allWrapper.findIndex(t => t.template.id === template.id);
      
      // If saving a new template, productionId is mandatory for USER
      if (role !== 'ADMIN' && existingIndex === -1 && !productionId) {
        logger.error('TEMPLATE_SAVE_NO_PROD', new Error('Production ID required'));
        return false;
      }

      if (existingIndex >= 0) {
        // Update existing
        const existing = allWrapper[existingIndex];
        if (role !== 'ADMIN' && existing.owner !== username) {
          logger.warn('TEMPLATE_UPDATE_DENIED', { user: username, templateId: template.id }, cid);
          return false;
        }
        // Preserve production ID if not passed, or update if passed
        const finalProdId = productionId || existing.productionId;
        allWrapper[existingIndex] = { owner: existing.owner, productionId: finalProdId, template };
        if (role === 'ADMIN') logger.audit('ADMIN_EDIT_TEMPLATE', { templateId: template.id, originalOwner: existing.owner }, cid);
      } else {
        // Create New
        if (role !== 'ADMIN') {
          // Check limit for this production
          const prodTemplates = allWrapper.filter(t => t.owner === username && t.productionId === productionId);
          if (prodTemplates.length >= MAX_TEMPLATES_PER_PRODUCTION) {
             logger.warn('TEMPLATE_LIMIT_REACHED', { productionId }, cid);
             return false;
          }
        }
        allWrapper.push({ owner: username, productionId, template });
        if (role === 'ADMIN') logger.audit('ADMIN_CREATE_TEMPLATE', { templateId: template.id }, cid);
      }

      saveDB(KEYS.TEMPLATES, allWrapper);
      return true;
    } catch (e) {
      logger.error('TEMPLATE_SAVE_ERROR', e as Error, { templateId: template.id }, cid);
      return false;
    }
  },

  deleteTemplate: (username: string, id: string, role: 'ADMIN' | 'USER') => {
    try {
      let all = getDB<StoredTemplate>(KEYS.TEMPLATES);
      if (role === 'ADMIN') {
        const target = all.find(t => t.template.id === id);
        if (target) {
           all = all.filter(t => t.template.id !== id);
           StorageService.logAudit('ADMIN_SYS', 'ADMIN_DELETE_TEMPLATE', undefined, undefined, { templateId: id, owner: target.owner });
        }
      } else {
        all = all.filter(t => !(t.owner === username && t.template.id === id));
      }
      saveDB(KEYS.TEMPLATES, all);
    } catch (e) {
      logger.error('TEMPLATE_DELETE_ERROR', e as Error, { templateId: id });
    }
  },

  // --- TOKEN REQUESTS (DB OPERATIONS) ---
  
  getTokenRequests: (): TokenRequest[] => getDB<TokenRequest>(KEYS.REQUESTS),
  
  saveTokenRequest: (request: TokenRequest) => {
    const requests = getDB<TokenRequest>(KEYS.REQUESTS);
    saveDB(KEYS.REQUESTS, [...requests, request]);
  },

  updateTokenRequest: (request: TokenRequest) => {
    const requests = getDB<TokenRequest>(KEYS.REQUESTS);
    saveDB(KEYS.REQUESTS, requests.map(r => r.id === request.id ? request : r));
  },

  // --- ADMIN METHODS (UNCHANGED) ---
  adminUpdateRequestStatus: async (adminId: string, requestId: string, status: TokenRequestStatus): Promise<boolean> => {
    const requests = getDB<TokenRequest>(KEYS.REQUESTS);
    const target = requests.find(r => r.id === requestId);
    if (!target) return false;
    target.status = status;
    target.updatedAt = Date.now();
    saveDB(KEYS.REQUESTS, requests.map(r => r.id === requestId ? target : r));
    let auditAction = 'UPDATE_REQUEST';
    if (status === 'APPROVED') auditAction = 'APPROVE_REQUEST';
    else if (status === 'REJECTED') auditAction = 'REJECT_REQUEST';
    else if (status === 'CONTACTED') auditAction = 'CONTACT_REQUEST';
    StorageService.logAudit(adminId, auditAction, undefined, requestId, { status, applicant: target.preferredUsername });
    return true;
  },

  adminCreateUser: async (adminId: string, username: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanUsername = normalizeUsername(username);
    const users = getDB<User>(KEYS.USERS);
    if (users.find(u => normalizeUsername(u.username) === cleanUsername)) {
      return { success: false, error: "Username taken." };
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      username: cleanUsername, // Store normalized
      status: 'ACTIVE',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastLoginAt: null
    };
    saveDB(KEYS.USERS, [...users, newUser]);
    StorageService.logAudit(adminId, 'CREATE_USER', newUser.id, undefined, { username: cleanUsername });
    return { success: true, user: newUser };
  },

  adminIssueToken: async (adminId: string, userId: string, expiryDurationMs: number | null): Promise<string> => {
    const salt = generateSalt();
    const token = generateSecureToken(); // Raw hex token
    const hash = await hashPassword(token, salt);
    const newToken: AuthToken = {
      id: crypto.randomUUID(),
      userId,
      tokenHash: hash,
      salt,
      createdAt: Date.now(),
      expiresAt: expiryDurationMs ? Date.now() + expiryDurationMs : null,
      revokedAt: null,
      lastUsedAt: null,
      rotationCount: 0
    };
    const tokens = getDB<AuthToken>(KEYS.TOKENS);
    saveDB(KEYS.TOKENS, [...tokens, newToken]);
    StorageService.logAudit(adminId, 'ISSUE_TOKEN', userId, newToken.id, { expiry: expiryDurationMs });
    return token;
  },

  adminRevokeToken: (adminId: string, tokenId: string) => {
    const tokens = getDB<AuthToken>(KEYS.TOKENS);
    saveDB(KEYS.TOKENS, tokens.map(t => t.id === tokenId ? { ...t, revokedAt: Date.now() } : t));
    StorageService.logAudit(adminId, 'REVOKE_TOKEN', undefined, tokenId);
  },

  adminSetUserStatus: (adminId: string, userId: string, status: UserStatus) => {
    const users = getDB<User>(KEYS.USERS);
    saveDB(KEYS.USERS, users.map(u => u.id === userId ? { ...u, status, updatedAt: Date.now() } : u));
    if (status !== 'ACTIVE') {
      const sessions = getDB<Session>(KEYS.SESSIONS);
      saveDB(KEYS.SESSIONS, sessions.filter(s => s.userId !== userId));
    }
    StorageService.logAudit(adminId, 'SET_USER_STATUS', userId, undefined, { status });
  },

  adminForceLogout: (adminId: string, userId: string) => {
    const sessions = getDB<Session>(KEYS.SESSIONS);
    saveDB(KEYS.SESSIONS, sessions.filter(s => s.userId !== userId));
    StorageService.logAudit(adminId, 'FORCE_LOGOUT', userId);
  },

  getUsers: (): User[] => getDB(KEYS.USERS),
  getTokens: (userId: string): AuthToken[] => {
    const all = getDB<AuthToken>(KEYS.TOKENS);
    return all.filter(t => t.userId === userId).sort((a,b) => b.createdAt - a.createdAt);
  },
  getAuditLogs: (): AuditLogEntry[] => {
    const logs = getDB<AuditLogEntry>(KEYS.AUDIT_LOGS);
    return logs.sort((a,b) => b.timestamp - a.timestamp).slice(0, 100);
  },

  logAudit: (adminId: string, action: string, targetUserId?: string, targetTokenId?: string, metadata?: any) => {
    const logs = getDB<AuditLogEntry>(KEYS.AUDIT_LOGS);
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      adminId,
      action,
      targetUserId,
      targetTokenId,
      metadata
    };
    saveDB(KEYS.AUDIT_LOGS, [entry, ...logs].slice(0, 500));
  },

  // --- GAME STATE ---

  saveGameState: (sessionId: string, gameState: GameState) => {
    try {
      localStorage.setItem(`${KEYS.GAME_STATE}_${sessionId}`, JSON.stringify(gameState));
    } catch (e) {
      logger.error('GAME_STATE_SAVE_ERROR', e as Error);
    }
  },

  getGameState: (sessionId: string): GameState | null => {
    try {
      const data = localStorage.getItem(`${KEYS.GAME_STATE}_${sessionId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      logger.error('GAME_STATE_LOAD_ERROR', e as Error);
      return null;
    }
  },

  clearGameState: (sessionId: string) => {
    localStorage.removeItem(`${KEYS.GAME_STATE}_${sessionId}`);
  },

  // --- DETACH TICKETS ---
  createDetachTicket: (sessionId: string): string => {
    const ticket = generateSecureToken().substring(0, 16);
    const tickets = getDB<DetachTicket>(KEYS.TICKETS);
    const validTickets = tickets.filter(t => t.expiresAt > Date.now());
    validTickets.push({ ticket, sessionId, expiresAt: Date.now() + 60000 });
    saveDB(KEYS.TICKETS, validTickets);
    return ticket;
  },

  redeemDetachTicket: (ticket: string): Session | null => {
    const tickets = getDB<DetachTicket>(KEYS.TICKETS);
    const matchIndex = tickets.findIndex(t => t.ticket === ticket && t.expiresAt > Date.now());
    if (matchIndex === -1) return null;

    const match = tickets[matchIndex];
    const sessions = getDB<Session>(KEYS.SESSIONS);
    const session = sessions.find(s => s.sessionId === match.sessionId);

    if (!session) return null;

    tickets.splice(matchIndex, 1);
    saveDB(KEYS.TICKETS, tickets);
    
    logger.setContext(session.sessionId, session.username);
    return session;
  }
};
