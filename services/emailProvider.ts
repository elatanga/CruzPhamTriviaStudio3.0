
import { logger } from './loggerService';

// --- SIMULATED SENDGRID PROVIDER ---
// In production, this would use @sendgrid/mail inside a Cloud Function.
// Here we simulate the provider interaction and security.

const PROVIDER_CONFIG = {
  name: 'SendGrid',
  apiKey: process.env.SENDGRID_API_KEY || 'SG.simulated_secret_key_********', // Simulated secret
  fromEmail: 'no-reply@cruzphamtrivia.com',
  adminEmails: ['CRUZPHAMNETWORK@GMAIL.COM', 'ELDECODER@GMAIL.COM']
};

export interface EmailPayload {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

export const EmailProvider = {
  /**
   * Sends an email via the provider.
   * Simulates network request and provider response.
   */
  sendEmail: async (payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const correlationId = crypto.randomUUID();
    
    logger.info('EMAIL_PROVIDER_REQUEST', { 
      provider: PROVIDER_CONFIG.name, 
      recipientCount: payload.to.length,
      subject: payload.subject
    }, correlationId);

    try {
      // 1. Simulate API Key check (Internal Logic)
      if (!PROVIDER_CONFIG.apiKey.startsWith('SG.')) {
        throw new Error('Invalid Provider Configuration');
      }

      // 2. Simulate Network Latency
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Simulate Provider Response
      // 95% Success Rate simulation
      const isSuccess = Math.random() > 0.05; 

      if (isSuccess) {
        const messageId = `msg_${crypto.randomUUID()}`;
        logger.info('EMAIL_PROVIDER_SUCCESS', { messageId }, correlationId);
        
        // Log the actual content for "Delivery" verification in console
        console.group(`%c[${PROVIDER_CONFIG.name}] EMAIL DELIVERED`, 'color: #4CAF50; font-weight: bold; border: 1px solid #4CAF50; padding: 4px;');
        console.log(`To: ${payload.to.join(', ')}`);
        console.log(`From: ${PROVIDER_CONFIG.fromEmail}`);
        console.log(`Subject: ${payload.subject}`);
        console.log(`Body: \n${payload.text}`);
        console.groupEnd();

        return { success: true, messageId };
      } else {
        throw new Error('Upstream Provider Error: Rate Limit Exceeded or Auth Failed');
      }

    } catch (error) {
      logger.error('EMAIL_PROVIDER_FAILURE', error as Error, { provider: PROVIDER_CONFIG.name }, correlationId);
      return { success: false, error: (error as Error).message };
    }
  },

  getAdmins: () => PROVIDER_CONFIG.adminEmails
};
