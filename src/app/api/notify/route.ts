import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireRole } from "@/lib/authz";

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "CROWD", "REQUESTER"]);
  if (!auth.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { to, subject, text } = body;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ ok: true, skipped: true, message: "SMTP not configured" });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: smtpUser,
    to,
    subject: subject ?? "DocFlow уведомление",
    text: text ?? "",
  });

  return NextResponse.json({ ok: true });
}
