
import { logger } from './loggerService';
import { StorageService } from './storageService';
import { TokenRequest } from '../types';

export const CommunicationService = {
  // Format token into groups of 4 characters for readability
  formatToken: (token: string): string => {
    return token.match(/.{1,4}/g)?.join('-') || token;
  },

  // Generate the text for copying to clipboard
  getShareMessage: (username: string, token: string): string => {
    const url = window.location.origin + window.location.pathname;
    return `CRUZPHAM TRIVIA STUDIOS LOGIN\n\nUsername: ${username}\nToken: ${token}\n\nLogin at: ${url}`;
  },

  // Generate a standard reply message for TikTok/Email
  generateResponseTemplate: (request: TokenRequest): string => {
    return `Hello ${request.firstName}! Thanks for requesting access to CruzPham Trivia.\n\nYour application for username "${request.preferredUsername}" has been received. To activate your account, a one-time access fee is required. Please reply for payment details.\n\nOnce confirmed, we will issue your secure token immediately.\n\n- CruzPham Admin Team`;
  },

  // Simulate Sending Email (Admin-only action)
  sendLoginEmail: async (adminId: string, userId: string, email: string, username: string, token: string): Promise<boolean> => {
    // In a real app, this would call a Cloud Function
    logger.info('SIMULATED_EMAIL_SEND', { to: email, username });
    
    // Simulate network latency
    await new Promise(r => setTimeout(r, 1500));
    
    // Log Audit
    StorageService.logAudit(adminId, 'SHARE_CREDENTIALS_EMAIL', userId, undefined, { email });
    
    // Simulate 90% success rate
    return Math.random() > 0.1;
  },

  // Simulate Sending SMS (Admin-only action)
  sendLoginSms: async (adminId: string, userId: string, phone: string, username: string, token: string): Promise<boolean> => {
    // In a real app, this would call Twilio via backend
    logger.info('SIMULATED_SMS_SEND', { to: phone, username });
    
    await new Promise(r => setTimeout(r, 1500));
    
    StorageService.logAudit(adminId, 'SHARE_CREDENTIALS_SMS', userId, undefined, { phone });
    
    return Math.random() > 0.1;
  },

  // Send Admin Notification for Token Request
  sendAdminRequestNotification: async (request: TokenRequest): Promise<boolean> => {
    const admins = ['CRUZPHAMNETWORK@GMAIL.COM', 'ELDECODER@GMAIL.COM'];
    
    // Simulate email body construction
    const emailBody = `
      NEW TOKEN REQUEST [${request.id}]
      -----------------------------------
      Timestamp: ${new Date(request.createdAt).toLocaleString()}
      
      APPLICANT:
      Name: ${request.firstName} ${request.lastName}
      TikTok: ${request.tiktokHandle}
      Phone: ${request.phoneNumber}
      Preferred Username: ${request.preferredUsername}
      
      Status: ${request.status}
      
      [APPROVE LINK PLACEHOLDER]
    `;

    // In a real app, this would be an API call
    console.group('%c[EMAIL SIMULATION] SENDING TO ADMINS', 'color: #3498db; font-weight: bold;');
    console.log(`To: ${admins.join(', ')}`);
    console.log(`Subject: CruzPham Trivia Token Request — ${request.preferredUsername}`);
    console.log(emailBody);
    console.groupEnd();

    logger.info('EMAIL_SENT_ADMIN_REQUEST', { requestId: request.id, to: admins });
    
    await new Promise(r => setTimeout(r, 1200)); // Latency
    return true;
  }
};
