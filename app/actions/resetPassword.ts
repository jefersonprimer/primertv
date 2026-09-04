"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/mail";

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
  emailSent?: boolean;
  email?: string;
};

export async function requestPasswordReset(
  _prevState: ResetPasswordState | undefined,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();

  if (!email) {
    return { error: "emailRequired" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "userNotFound" };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

  try {
    // Delete any existing codes for this email
    await prisma.passwordResetCode.deleteMany({
      where: { email },
    });

    // Save new verification code
    await prisma.passwordResetCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send code via email
    await sendPasswordResetEmail(email, code);

    return { success: true, emailSent: true, email };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { error: "emailSendError" };
  }
}

export async function resetPasswordWithCode(
  _prevState: ResetPasswordState | undefined,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const code = (formData.get("code") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !code || !password || !confirmPassword) {
    return { error: "allFieldsRequired" };
  }

  if (password.length < 6) {
    return { error: "passwordTooShort" };
  }

  if (password !== confirmPassword) {
    return { error: "passwordsDoNotMatch" };
  }

  try {
    const validCode = await prisma.passwordResetCode.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!validCode) {
      return { error: "invalidOrExpiredCode" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    // Clean up reset code
    await prisma.passwordResetCode.deleteMany({
      where: { email },
    });

    return { success: true, emailSent: false };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "resetPasswordFailed" };
  }
}
