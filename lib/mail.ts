import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, code: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@primerflix.com";

  const mailOptions = {
    from: `"PrimerTV" <${from}>`,
    to: email,
    subject: "Código de Redefinição de Senha - PrimerTV",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; color: #ffffff; border-radius: 12px; border: 1px solid #27272a;">
        <h2 style="color: #3b82f6; text-align: center; font-size: 24px; margin-bottom: 8px;">PrimerTV</h2>
        <p style="text-align: center; font-size: 18px; color: #e4e4e7; margin-top: 0;">Redefinição de Senha</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Olá,</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Recebemos uma solicitação para redefinir a senha da sua conta no PrimerTV.</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5;">Utilize o código de 6 dígitos abaixo para concluir o processo. Este código expira em <strong>15 minutos</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; background-color: #18181b; padding: 14px 28px; border-radius: 10px; border: 1px solid #3b82f6; color: #60a5fa; display: inline-block;">${code}</span>
        </div>
        <p style="color: #71717a; font-size: 13px; line-height: 1.4;">Se você não realizou esta solicitação, pode ignorar este e-mail com segurança. Sua senha permanecerá inalterada.</p>
        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="text-align: center; font-size: 12px; color: #52525b;">&copy; ${new Date().getFullYear()} PrimerTV. Todos os direitos reservados.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
