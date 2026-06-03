let twilioClient: any = null;
let mailTransporter: any = null;

function getTwilio() {
  if (!twilioClient && process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

function getMailer() {
  if (!mailTransporter && process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return mailTransporter;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const client = getTwilio();
  if (!client) {
    console.log(`[SMS] To: ${to} — ${message}`);
    return false;
  }
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to,
    });
    console.log(`[SMS] Sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[SMS] Failed to ${to}:`, err.message);
    return false;
  }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const transporter = getMailer();
  if (!transporter) {
    console.log(`[Email] To: ${to} — Subject: ${subject} — ${body}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@clinic.com',
      to,
      subject,
      text: body,
    });
    console.log(`[Email] Sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Failed to ${to}:`, err.message);
    return false;
  }
}
