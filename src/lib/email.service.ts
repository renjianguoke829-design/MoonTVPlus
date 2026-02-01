import nodemailer from 'nodemailer';
import { getConfig } from './config';
import type { AdminConfig } from './admin.types';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendViaSMTP(
    config: NonNullable<AdminConfig['EmailConfig']>['smtp'],
    options: EmailOptions
  ): Promise<void> {
    if (!config) throw new Error('SMTP配置不存在');
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
    });
    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  static async sendViaResend(
    config: NonNullable<AdminConfig['EmailConfig']>['resend'],
    options: EmailOptions
  ): Promise<void> {
    if (!config) throw new Error('Resend配置不存在');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API错误: ${response.statusText} - ${errorText}`);
    }
  }

  static async send(
    emailConfig: AdminConfig['EmailConfig'],
    options: EmailOptions
  ): Promise<void> {
    if (!emailConfig || !emailConfig.enabled) {
      console.log('邮件通知未启用');
      return;
    }
    if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
      await this.sendViaSMTP(emailConfig.smtp, options);
    } else if (emailConfig.provider === 'resend' && emailConfig.resend) {
      await this.sendViaResend(emailConfig.resend, options);
    } else {
      throw new Error('邮件配置不完整');
    }
  }

  /**
   * ✅ 系统自动发送邮件 (优先读库，没有则读环境变量)
   */
  static async sendSystemEmail(options: EmailOptions): Promise<void> {
    try {
      const dbConfig = await getConfig();
      const emailConfig = dbConfig.SiteConfig?.EmailConfig || (dbConfig as any).EmailConfig;

      if (emailConfig && emailConfig.enabled) {
        await this.send(emailConfig, options);
        return;
      }

      if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
        console.log('[System] 使用环境变量 Resend 发送');
        await this.sendViaResend({
          apiKey: process.env.RESEND_API_KEY,
          from: process.env.RESEND_FROM,
        }, options);
        return;
      }

      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        await this.sendViaSMTP({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASS || '',
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
        }, options);
        return;
      }

      throw new Error('未配置邮件服务');
    } catch (error) {
      console.error('系统邮件发送失败:', error);
      throw error;
    }
  }
}
