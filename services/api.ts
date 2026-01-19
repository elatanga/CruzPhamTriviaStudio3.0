
import { TokenRequest } from '../types';
import { StorageService } from './storageService';
import { EmailProvider } from './emailProvider';
import { logger } from './loggerService';

// --- BACKEND SERVICE SIMULATION ---
// This file represents the logic that would run in a Firebase Cloud Function or Next.js API Route.
// It is kept separate from client logic to enforce security boundaries in the architecture.

interface SubmitRequestPayload {
  firstName: string;
  lastName: string;
  tiktokHandle: string;
  phoneNumber: string;
  preferredUsername: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export const API = {
  
  /**
   * Cloud Function: submitTokenRequest
   * Validates input, checks rate limits, persists data, and triggers email.
   */
  submitTokenRequest: async (payload: SubmitRequestPayload): Promise<ApiResponse<TokenRequest>> => {
    const cid = crypto.randomUUID();
    logger.info('API_REQUEST_RECEIVED', { endpoint: 'submitTokenRequest' }, cid);

    try {
      // 1. INPUT VALIDATION (Zod-like)
      const { firstName, lastName, tiktokHandle, phoneNumber, preferredUsername } = payload;
      
      if (!firstName || firstName.length < 2) throw { code: 'ERR_VALIDATION', message: 'First name required.' };
      if (!lastName || lastName.length < 2) throw { code: 'ERR_VALIDATION', message: 'Last name required.' };
      if (!tiktokHandle || !tiktokHandle.startsWith('@') || tiktokHandle.length < 3) throw { code: 'ERR_VALIDATION', message: 'Valid TikTok handle starting with @ is required.' };
      if (!phoneNumber || phoneNumber.length < 7) throw { code: 'ERR_VALIDATION', message: 'Valid phone number is required.' };
      if (!preferredUsername || preferredUsername.length < 3 || preferredUsername.length > 20 || /\s/.test(preferredUsername)) {
        throw { code: 'ERR_VALIDATION', message: 'Username must be 3-20 characters, no spaces.' };
      }

      logger.debug('API_VALIDATION_PASSED', {}, cid);

      // 2. SERVER-SIDE RATE LIMITING & DUPLICATE CHECK
      // Note: In real backend, we'd query Firestore directly. Here we use StorageService as the DB interface.
      const existingRequests = StorageService.getTokenRequests(); // New method needed in StorageService to expose raw data for "server" usage
      
      // IP/Device Hash Simulation (In real app, req.ip)
      const ipHash = StorageService.getDeviceId(); // Reuse existing logic
      
      // Check 24h Rate Limit
      const recentRequests = existingRequests.filter(r => 
        r.deviceHash === ipHash && 
        (Date.now() - r.createdAt) < 24 * 60 * 60 * 1000
      );

      if (recentRequests.length >= 3) {
        logger.warn('API_RATE_LIMIT_EXCEEDED', { ipHash }, cid);
        throw { code: 'ERR_RATE_LIMIT', message: 'Too many requests. Please try again tomorrow.' };
      }

      // Check Duplicates (Pending)
      const isDuplicate = existingRequests.some(r => 
        r.status === 'PENDING' && 
        (r.tiktokHandle.toLowerCase() === tiktokHandle.toLowerCase() || 
         r.preferredUsername.toLowerCase() === preferredUsername.toLowerCase())
      );

      if (isDuplicate) {
        logger.warn('API_DUPLICATE_DETECTED', { handle: tiktokHandle }, cid);
        throw { code: 'ERR_DUPLICATE_REQUEST', message: 'A pending request already exists for this handle or username.' };
      }

      // 3. PERSISTENCE (Status: PENDING)
      const newRequest: TokenRequest = {
        id: crypto.randomUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        tiktokHandle: tiktokHandle.trim(),
        phoneNumber: phoneNumber.trim(),
        preferredUsername: preferredUsername.trim(),
        status: 'PENDING',
        emailStatus: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deviceHash: ipHash,
        ipHash: ipHash
      };

      // Atomic Write
      StorageService.saveTokenRequest(newRequest);
      logger.info('API_REQUEST_STORED', { requestId: newRequest.id }, cid);

      // 4. EMAIL NOTIFICATION (Async Transaction)
      const emailBody = `
        NEW TOKEN REQUEST [${newRequest.id}]
        -----------------------------------
        Timestamp: ${new Date().toISOString()}
        IP Hash: ${ipHash}
        
        APPLICANT DETAILS:
        Name: ${newRequest.firstName} ${newRequest.lastName}
        TikTok: ${newRequest.tiktokHandle}
        Phone: ${newRequest.phoneNumber}
        Desired Username: ${newRequest.preferredUsername}
        
        ACTION REQUIRED:
        Review this user in the Admin Console.
      `;

      const emailResult = await EmailProvider.sendEmail({
        to: EmailProvider.getAdmins(),
        subject: `CruzPham Trivia Token Request: ${newRequest.preferredUsername}`,
        text: emailBody
      });

      // 5. UPDATE STATUS BASED ON EMAIL RESULT
      if (emailResult.success) {
        newRequest.emailStatus = 'SENT';
        logger.info('API_EMAIL_SENT', { messageId: emailResult.messageId }, cid);
      } else {
        newRequest.emailStatus = 'FAILED';
        newRequest.lastError = emailResult.error;
        logger.error('API_EMAIL_FAILED', new Error(emailResult.error), { requestId: newRequest.id }, cid);
        // Note: We do NOT throw here, we return success to user but log failure internally
      }
      
      StorageService.updateTokenRequest(newRequest);

      return { success: true, data: newRequest };

    } catch (error: any) {
      const code = error.code || 'ERR_INTERNAL';
      const message = error.message || 'Internal Server Error';
      
      // Don't log validation errors as system errors
      if (code === 'ERR_INTERNAL') {
        logger.error('API_INTERNAL_ERROR', error, {}, cid);
      }

      return {
        success: false,
        error: { code, message }
      };
    }
  }
};
