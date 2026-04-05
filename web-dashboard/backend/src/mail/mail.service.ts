import * as nodemailer from 'nodemailer';

export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendMail(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: `"Voting System" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
}
