import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export function getMailTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function getMailFrom(): string {
  const from = process.env.MAIL_FROM?.trim();
  if (from) return from;
  const user = process.env.SMTP_USER?.trim();
  if (user) return `"Pradeep Jewellers" <${user}>`;
  return "Pradeep Jewellers <noreply@localhost>";
}

export function getOwnerEmail(): string | null {
  const owner = process.env.OWNER_EMAIL?.trim();
  if (owner) return owner;
  return process.env.SMTP_USER?.trim() ?? null;
}
