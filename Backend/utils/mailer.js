import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const SMTP_TIMEOUT_MS = 12000;

const createTransport = ({ host, user, pass, port }) =>
  nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

const getMailConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  return { host, user, pass, port };
};

export const sendMail = async (to, subject, html) => {
  const { host, user, pass, port } = getMailConfig();
  const from = process.env.EMAIL_FROM || `"Exam Admin" <${user}>`;
  const portsToTry = port === 465 ? [465] : [port, 465];

  let lastError;
  for (const tryPort of portsToTry) {
    try {
      const transporter = createTransport({ host, user, pass, port: tryPort });
      const info = await transporter.sendMail({ from, to, subject, html });
      console.log("Message sent: %s (port %s)", info.messageId, tryPort);
      return info;
    } catch (error) {
      lastError = error;
      console.error(`Error sending email on port ${tryPort}:`, error.message);
    }
  }

  throw lastError;
};
