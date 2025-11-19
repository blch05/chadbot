import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserSession } from './types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hashed password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT token for user session
 */
export function generateToken(user: UserSession): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: '7d', // Token válido por 7 días
    }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Validate name
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}
