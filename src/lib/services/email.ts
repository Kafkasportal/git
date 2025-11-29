/**
 * Email Service
 * Handles email sending via SMTP using Nodemailer
 */

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getServerEnv, hasEmailConfig } from '@/lib/env-validation';
import logger from '@/lib/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  template?: string;
  templateData?: Record<string, any>;
}

// Load email templates from filesystem
function loadEmailTemplate(templateName: string): string | null {
  try {
    const templatePath = join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`);
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    logger.warn(`Email template not found: ${templateName}`, { error });
    return null;
  }
}

// Email Templates - fallback to inline templates if files don't exist
const inlineEmailTemplates: Record<string, string> = {
  welcome: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0066cc;">Hoş Geldiniz!</h1>
      <p>Merhaba {{name}},</p>
      <p>Dernek Yönetim Sistemi'ne hoş geldiniz.</p>
      <p>Kullanıcı adınız: <strong>{{email}}</strong></p>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">Bu otomatik bir mesajdır. Lütfen yanıtlamayınız.</p>
    </div>
  `,
};

// Get email template (from file or inline fallback)
function getEmailTemplate(templateName: string): string | null {
  // Try to load from filesystem first
  const fileTemplate = loadEmailTemplate(templateName);
  if (fileTemplate) {
    return fileTemplate;
  }

  // Fallback to inline template
  return inlineEmailTemplates[templateName] || null;
}

// Create reusable transporter (singleton)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const env = getServerEnv();

  if (!hasEmailConfig(env)) {
    logger.warn('Email configuration missing');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(String(env.SMTP_PORT)) : 587,
    secure: env.SMTP_PORT ? String(env.SMTP_PORT) === '465' : false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send email via SMTP using Nodemailer
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const env = getServerEnv();

  if (!hasEmailConfig(env)) {
    logger.warn('Email not configured - email will not be sent', {
      service: 'email',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    });
    return false;
  }

  try {
    const transport = getTransporter();
    if (!transport) {
      throw new Error('Failed to create email transporter');
    }

    // Compile template if provided
    let htmlContent = options.html;
    if (options.template && emailTemplates[options.template]) {
      const template = Handlebars.compile(emailTemplates[options.template]);
      htmlContent = template(options.templateData || {});
    }

    // Send email
    const info = await transport.sendMail({
      from: options.from || env.SMTP_FROM || env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: htmlContent || options.text,
    });

    logger.info('Email sent successfully', {
      service: 'email',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      messageId: info.messageId,
    });

    return true;
  } catch (error) {
    logger.error('Email sending failed', error, {
      service: 'email',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    });
    return false;
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  content: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient,
      subject,
      text: content,
    });

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
