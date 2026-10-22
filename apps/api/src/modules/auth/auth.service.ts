import { User, type IUser, type UserRole, type Campus } from '../../models/user.model.js';
import { RefreshSession } from '../../models/refresh-session.model.js';
import { Token } from '../../models/token.model.js';
import {
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken,
} from '../../utils/crypto.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../../utils/auth-tokens.js';
import { AppError } from '../../errors/app-error.js';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  campus: Campus;
  phone?: string;
  agencyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
  emailVerificationToken?: string;
}

export class AuthService {
  static async register(
    input: RegisterInput,
    metadata: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (input.password.length < 8) {
      throw AppError.badRequest('Password must be at least 8 characters long');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw AppError.badRequest('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: input.role || 'STUDENT',
      campus: input.campus,
      phone: input.phone?.trim(),
      agencyName: input.agencyName?.trim(),
      isEmailVerified: false,
      isVerified: false,
    });

    // Create Email Verification Token (stored hashed)
    const verificationRawToken = generateRandomToken();
    await Token.create({
      user: user._id,
      tokenHash: hashToken(verificationRawToken),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      campus: user.campus,
    };

    const accessToken = signAccessToken(tokenPayload);

    // Create persistent Refresh Session
    const refreshRawToken = generateRandomToken();
    const session = await RefreshSession.create({
      user: user._id,
      tokenHash: hashToken(refreshRawToken),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const refreshToken = signRefreshToken({
      ...tokenPayload,
      sessionId: session._id.toString(),
    });

    return {
      user,
      accessToken,
      refreshToken,
      emailVerificationToken: verificationRawToken,
    };
  }

  static async login(
    input: LoginInput,
    metadata: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthResponse> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Prevent user enumeration by taking similar execution time
      await hashPassword('dummy_timing_padding');
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      campus: user.campus,
    };

    const accessToken = signAccessToken(tokenPayload);

    const refreshRawToken = generateRandomToken();
    const session = await RefreshSession.create({
      user: user._id,
      tokenHash: hashToken(refreshRawToken),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const refreshToken = signRefreshToken({
      ...tokenPayload,
      sessionId: session._id.toString(),
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshTokenStr: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshTokenStr);

    if (!payload.sessionId) {
      throw AppError.unauthorized('Invalid refresh token payload');
    }

    const session = await RefreshSession.findById(payload.sessionId);
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw AppError.unauthorized('Session has been revoked or expired');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized('User associated with session not found');
    }

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      campus: user.campus,
    };

    const accessToken = signAccessToken(tokenPayload);
    return { accessToken };
  }

  static async logout(refreshTokenStr: string): Promise<boolean> {
    try {
      const payload = verifyRefreshToken(refreshTokenStr);
      if (payload.sessionId) {
        await RefreshSession.findByIdAndUpdate(payload.sessionId, { isRevoked: true });
      }
      return true;
    } catch {
      return false;
    }
  }

  static async verifyEmail(tokenStr: string): Promise<boolean> {
    const hashed = hashToken(tokenStr);

    const tokenDoc = await Token.findOne({
      tokenHash: hashed,
      type: 'EMAIL_VERIFICATION',
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!tokenDoc) {
      throw AppError.badRequest('Invalid or expired email verification token');
    }

    await User.findByIdAndUpdate(tokenDoc.user, { isEmailVerified: true });
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    return true;
  }

  static async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    let resetToken: string | undefined;

    if (user) {
      resetToken = generateRandomToken();
      await Token.create({
        user: user._id,
        tokenHash: hashToken(resetToken),
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });
    }

    // Always return constant message to avoid enumeration
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      resetToken, // for testing / development
    };
  }

  static async resetPassword(tokenStr: string, newPassword: string): Promise<boolean> {
    if (newPassword.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters long');
    }

    const hashed = hashToken(tokenStr);
    const tokenDoc = await Token.findOne({
      tokenHash: hashed,
      type: 'PASSWORD_RESET',
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!tokenDoc) {
      throw AppError.badRequest('Invalid or expired password reset token');
    }

    const newHash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(tokenDoc.user, { passwordHash: newHash });

    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Revoke all active sessions for security
    await RefreshSession.updateMany({ user: tokenDoc.user }, { isRevoked: true });

    return true;
  }
}
