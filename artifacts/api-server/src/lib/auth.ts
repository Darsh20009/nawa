import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const RAW_SECRET = process.env.SESSION_SECRET?.trim();

if (process.env.NODE_ENV === "production" && (!RAW_SECRET || RAW_SECRET.length < 32)) {
  throw new Error(
    "SESSION_SECRET must be set to a strong value (>=32 chars) in production. Refusing to start.",
  );
}

const JWT_SECRET = RAW_SECRET || "dev-only-insecure-secret-change-me-in-production";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}
