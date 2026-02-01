import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { getPasswordResetTemplate, getVerificationTemplate } from './email.templates';

// 定义邮件配置接口
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  senderEmail: string;
  type?: 'smtp' | 'resend';
  resendApiKey?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static resendClient: Resend | null = null;

  // 初始化传输器 (支持 SMTP 和 Resend)
  private static initTransporter(config: EmailConfig) {
    if (config.type === 'resend' && config.resendApiKey) {
      this.resendClient = new Resend(config.resendApiKey);
      this.transporter = null;
      return;
    }

    // 默认 SMTP
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  // ✅ 发送通用邮件 (内部核心方法)
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    config?: EmailConfig
  ): Promise<void> {
    // 1. 如果传入了配置，先初始化
    // 优先使用传入的 config (测试连接时)，否则尝试读环境变量
    const activeConfig = config || this.getEnvConfig();
    
    if (!activeConfig) {
      throw new Error('未配置邮件服务');
    }

    this.initTransporter(activeConfig);

    const from = `"${activeConfig.senderName}" <${activeConfig.senderEmail}>`;

    // 2. 使用 Resend 发送
    if (activeConfig.type === 'resend' && this.resendClient) {
      const { error } = await this.resendClient.emails.send({
        from,
        to,
        subject,
        html,
      });
      if (error) throw error;
      return;
    }

    // 3. 使用 SMTP 发送
    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return;
    }

    throw new Error('邮件服务初始化失败');
  }

  // ✅ 发送找回密码邮件
  static async sendPasswordResetEmail(
    email: string,
    token: string,
    siteUrl: string = process.env.NEXTAUTH_URL || 'https://moontv.app'
  ): Promise<void> {
    const resetLink = `${siteUrl}/login?resetToken=${token}`;
    const html = getPasswordResetTemplate(resetLink, 'MoonTV 用户');
    await this.sendEmail(email, '【MoonTV】重置您的密码', html);
  }

  // ✅ 发送验证码邮件 (预留)
  static async sendVerificationEmail(email: string, code: string): Promise<void> {
    const html = getVerificationTemplate(code);
    await this.sendEmail(email, '【MoonTV】验证码', html);
  }

  // ✅✅✅ 补全这个缺失的方法！用于后台测试连接 ✅✅✅
  static async sendTestEmail(config: EmailConfig, to: string, siteName: string): Promise<void> {
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>📧 邮件服务配置成功！</h2>
        <p>恭喜！如果您收到这封邮件，说明 <strong>${siteName}</strong> 的邮件发送服务 (SMTP/Resend) 已配置正确。</p>
        <p>发送时间：${new Date().toLocaleString()}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `;
    // 强制使用传入的 config 进行发送，验证配置是否有效
    await this.sendEmail(to, `【${siteName}】邮件服务测试`, html, config);
  }

  // 从环境变量获取配置 (兜底)
  private static getEnvConfig(): EmailConfig | null {
    if (process.env.RESEND_API_KEY) {
      return {
        type: 'resend',
        resendApiKey: process.env.RESEND_API_KEY,
        senderEmail: process.env.RESEND_FROM || 'onboarding@resend.dev',
        senderName: 'MoonTV',
        smtpHost: '', smtpPort: 0, smtpSecure: false, smtpUser: '', smtpPass: ''
      };
    }
    if (process.env.SMTP_HOST) {
      return {
        type: 'smtp',
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '465'),
        smtpSecure: process.env.SMTP_SECURE === 'true',
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
        senderEmail: process.env.SMTP_FROM || '',
        senderName: 'MoonTV',
      };
    }
    return null;
  }
}
