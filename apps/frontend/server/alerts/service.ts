import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import twilio from "twilio";

dayjs.extend(utc); dayjs.extend(tz);

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "BevPro <noreply@example.com>";
const SMTP_HOST = process.env.EMAIL_FALLBACK_SMTP_HOST || "";
const SMTP_USER = process.env.EMAIL_FALLBACK_SMTP_USER || "";
const SMTP_PASS = process.env.EMAIL_FALLBACK_SMTP_PASS || "";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";

const TZ = process.env.VENUE_TIMEZONE || "America/Chicago";
const QUIET_START = 2;  // 2am local
const QUIET_END = 8;    // 8am local

function inQuietHours(now = dayjs().tz(TZ)) {
  const h = now.hour();
  return h >= QUIET_START && h < QUIET_END;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
      await sgMail.send({ to, from: EMAIL_FROM, subject, html });
      return;
    }
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const t = nodemailer.createTransport({
        host: SMTP_HOST, port: 465, secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
      await t.sendMail({ from: EMAIL_FROM, to, subject, html });
    }
  } catch {}
}

export async function sendSMS(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM || !to) return;
  try {
    const client = twilio(TWILIO_SID, TWILIO_TOKEN);
    await client.messages.create({ to, from: TWILIO_FROM, body });
  } catch {}
}

export function shouldNotifyNow(now = dayjs().tz(TZ)) {
  return { allowSMS: !inQuietHours(now), allowEmail: true };
}



