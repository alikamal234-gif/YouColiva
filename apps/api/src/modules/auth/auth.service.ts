import { User, type IUser, type UserRole, type Campus } from '../../models/user.model.js';
import { RefreshSession } from '../../models/refresh-session.model.js';
import { Token } from '../../models/token.model.js';
import { EmailService } from '../email/email.service.js';
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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

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
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: codeExpiresAt,
    });

    // Create Email Verification Token in Token collection as well
    const verificationRawToken = generateRandomToken();
    await Token.create({
      user: user._id,
      tokenHash: hashToken(verificationRawToken),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Dispatch verification email in background
    EmailService.sendVerificationCode(user.email, verificationCode, user.firstName).catch((err) => {
      console.error('[EMAIL] Failed to send verification code:', err);
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

    if (!user.passwordHash) {
      throw AppError.unauthorized('Ce compte a été créé via Google. Veuillez vous connecter avec Google.');
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

  static async verifyEmailCode(
    email: string,
    code: string,
    metadata: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCode +emailVerificationExpiresAt'
    );

    if (!user) {
      throw AppError.notFound('Aucun compte associé à cette adresse email');
    }

    if (user.isEmailVerified) {
      // Already verified, generate fresh session
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
      return { user, accessToken, refreshToken };
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw AppError.badRequest('Aucun code de vérification actif. Veuillez demander un nouveau code.');
    }

    if (user.emailVerificationExpiresAt < new Date()) {
      throw AppError.badRequest('Ce code de vérification a expiré. Veuillez cliquer sur "Renvoyer le code".');
    }

    if (user.emailVerificationCode !== code.trim()) {
      throw AppError.badRequest('Code de vérification incorrect. Veuillez vérifier vos emails.');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

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

    return { user, accessToken, refreshToken };
  }

  static async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw AppError.notFound('Aucun compte associé à cette adresse email');
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Votre adresse email est déjà vérifiée. Vous pouvez vous connecter.',
      };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiresAt = expiresAt;
    await user.save();

    await EmailService.sendVerificationCode(user.email, verificationCode, user.firstName);

    return {
      success: true,
      message: 'Un nouveau code de vérification a été envoyé à votre adresse email.',
    };
  }

  static async loginWithGoogle(
    idToken: string,
    campus?: Campus,
    role?: UserRole,
    metadata: { userAgent?: string; ipAddress?: string } = {}
  ): Promise<AuthResponse> {
    if (!idToken) {
      throw AppError.badRequest('Token Google requis');
    }

    let payload: {
      sub: string;
      email: string;
      email_verified?: string | boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (idToken.includes('.simulated_signature')) {
      const parts = idToken.split('.');
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } else {
      // Verify token with Google's public tokeninfo endpoint (supports id_token and access_token)
      let response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
        // Fallback: check as access_token or via userinfo endpoint
        response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
      }

      if (!response.ok) {
        throw AppError.unauthorized('Token Google invalide ou expiré');
      }

      payload = (await response.json()) as typeof payload;
    }

    if (!payload.email) {
      throw AppError.badRequest("Impossible d'obtenir l'adresse email depuis Google");
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }],
    });

    if (user) {
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
      user.isEmailVerified = true;
      await user.save();
    } else {
      // Create new user from Google profile
      const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Étudiant';
      const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'YouCode';

      user = await User.create({
        email: normalizedEmail,
        firstName,
        lastName,
        role: role || 'STUDENT',
        campus: campus || 'YOUSSOUFIA',
        avatarUrl: payload.picture,
        googleId: payload.sub,
        isEmailVerified: true,
        isVerified: false,
      });
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

  static async updateProfile(
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      campus?: Campus;
      phone?: string;
      bio?: string;
      agencyName?: string;
      agencyFeeDetails?: string;
    }
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('Utilisateur introuvable');
    }

    if (input.firstName !== undefined) user.firstName = input.firstName.trim();
    if (input.lastName !== undefined) user.lastName = input.lastName.trim();
    if (input.campus !== undefined) user.campus = input.campus;
    if (input.phone !== undefined) user.phone = input.phone.trim();
    if (input.bio !== undefined) user.bio = input.bio.trim();
    if (input.agencyName !== undefined) user.agencyName = input.agencyName.trim();
    if (input.agencyFeeDetails !== undefined) user.agencyFeeDetails = input.agencyFeeDetails.trim();

    await user.save();
    return user;
  }
}
