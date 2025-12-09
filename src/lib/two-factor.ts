import { authenticator } from "otplib";
import QRCode from "qrcode";

// Configure authenticator options
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1,
};

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

/**
 * Generate a new 2FA secret and QR code for setup
 */
export async function generateTwoFactorSecret(
  email: string
): Promise<TwoFactorSetup> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(
    email,
    "ThinkHuge B2B Tracker",
    secret
  );

  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    qrCodeUrl,
    otpauthUrl,
  };
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTwoFactorCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Generate the current TOTP code (for testing purposes)
 */
export function generateCurrentCode(secret: string): string {
  return authenticator.generate(secret);
}
