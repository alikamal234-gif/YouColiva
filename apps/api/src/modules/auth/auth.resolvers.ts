import { AuthService, type RegisterInput, type LoginInput } from './auth.service.js';
import { User, type IUser } from '../../models/user.model.js';
import type { GraphQLContext } from '../../graphql/context.js';
import { AppError } from '../../errors/app-error.js';

export const authResolvers = {
  User: {
    id: (parent: IUser) => parent._id.toString(),
  },

  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        return null;
      }
      return User.findById(context.user.userId);
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      { input }: { input: RegisterInput },
      context: GraphQLContext
    ) => {
      const metadata = {
        userAgent: context.req.headers['user-agent'],
        ipAddress: context.req.ip,
      };

      const result = await AuthService.register(input, metadata);

      // Set refresh token in HttpOnly cookie if in browser context
      if (context.res.cookie) {
        context.res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return result;
    },

    login: async (_parent: unknown, { input }: { input: LoginInput }, context: GraphQLContext) => {
      const metadata = {
        userAgent: context.req.headers['user-agent'],
        ipAddress: context.req.ip,
      };

      const result = await AuthService.login(input, metadata);

      if (context.res.cookie) {
        context.res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }

      return result;
    },

    refreshToken: async (
      _parent: unknown,
      { refreshToken }: { refreshToken: string },
      context: GraphQLContext
    ) => {
      const token = refreshToken || context.req.cookies?.refreshToken;
      if (!token) {
        throw AppError.unauthorized('No refresh token provided');
      }
      return AuthService.refreshToken(token);
    },

    logout: async (
      _parent: unknown,
      { refreshToken }: { refreshToken: string },
      context: GraphQLContext
    ) => {
      const token = refreshToken || context.req.cookies?.refreshToken;
      if (context.res.clearCookie) {
        context.res.clearCookie('refreshToken');
      }
      if (token) {
        return AuthService.logout(token);
      }
      return true;
    },

    verifyEmail: async (_parent: unknown, { token }: { token: string }) => {
      return AuthService.verifyEmail(token);
    },

    requestPasswordReset: async (_parent: unknown, { email }: { email: string }) => {
      return AuthService.requestPasswordReset(email);
    },

    resetPassword: async (
      _parent: unknown,
      { token, newPassword }: { token: string; newPassword: string }
    ) => {
      return AuthService.resetPassword(token, newPassword);
    },

    updateProfile: async (
      _parent: unknown,
      { input }: { input: Parameters<typeof AuthService.updateProfile>[1] },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw AppError.unauthorized('Authentication required to update profile');
      }
      return AuthService.updateProfile(context.user.userId, input);
    },
  },
};
