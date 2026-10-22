'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, Campus } from '../types/index.js';
import { fetchGraphQL } from '../lib/api-client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    campus: Campus;
    phone?: string;
    agencyName?: string;
  }) => Promise<void>;
  loginWithGoogle: (idToken: string, campus?: Campus, role?: UserRole) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  verifyEmailCode: async () => {},
  resendVerificationCode: async () => '',
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('youcoliva_access_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const query = `
        query GetMe {
          me {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            avatarUrl
            bio
            isEmailVerified
            isVerified
            agencyName
            agencyFeeDetails
            createdAt
          }
        }
      `;

      const data = await fetchGraphQL<{ me: User | null }>(query, {}, savedToken);
      if (data.me) {
        setUser(data.me);
        setToken(savedToken);
      } else {
        localStorage.removeItem('youcoliva_access_token');
        setUser(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem('youcoliva_access_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const mutation = `
      mutation LoginUser($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          user {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            isEmailVerified
            isVerified
            agencyName
            createdAt
          }
        }
      }
    `;

    const data = await fetchGraphQL<{
      login: { accessToken: string; refreshToken: string; user: User };
    }>(mutation, { input: { email, password } });

    localStorage.setItem('youcoliva_access_token', data.login.accessToken);
    localStorage.setItem('youcoliva_refresh_token', data.login.refreshToken);
    setToken(data.login.accessToken);
    setUser(data.login.user);
  };

  const register = async (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    campus: Campus;
    phone?: string;
    agencyName?: string;
  }) => {
    const mutation = `
      mutation RegisterUser($input: RegisterInput!) {
        register(input: $input) {
          accessToken
          refreshToken
          user {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            isEmailVerified
            isVerified
            agencyName
            createdAt
          }
        }
      }
    `;

    const data = await fetchGraphQL<{
      register: { accessToken: string; refreshToken: string; user: User };
    }>(mutation, { input });

    localStorage.setItem('youcoliva_access_token', data.register.accessToken);
    localStorage.setItem('youcoliva_refresh_token', data.register.refreshToken);
    setToken(data.register.accessToken);
    setUser(data.register.user);
  };

  const loginWithGoogle = async (idToken: string, campus?: Campus, role?: UserRole) => {
    const mutation = `
      mutation LoginWithGoogle($idToken: String!, $campus: Campus, $role: UserRole) {
        loginWithGoogle(idToken: $idToken, campus: $campus, role: $role) {
          accessToken
          refreshToken
          user {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            avatarUrl
            isEmailVerified
            isVerified
            agencyName
            createdAt
          }
        }
      }
    `;

    const data = await fetchGraphQL<{
      loginWithGoogle: { accessToken: string; refreshToken: string; user: User };
    }>(mutation, { idToken, campus, role });

    localStorage.setItem('youcoliva_access_token', data.loginWithGoogle.accessToken);
    localStorage.setItem('youcoliva_refresh_token', data.loginWithGoogle.refreshToken);
    setToken(data.loginWithGoogle.accessToken);
    setUser(data.loginWithGoogle.user);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    const mutation = `
      mutation VerifyEmailCode($email: String!, $code: String!) {
        verifyEmailCode(email: $email, code: $code) {
          accessToken
          refreshToken
          user {
            id
            email
            firstName
            lastName
            role
            campus
            phone
            avatarUrl
            isEmailVerified
            isVerified
            agencyName
            createdAt
          }
        }
      }
    `;

    const data = await fetchGraphQL<{
      verifyEmailCode: { accessToken: string; refreshToken: string; user: User };
    }>(mutation, { email, code });

    localStorage.setItem('youcoliva_access_token', data.verifyEmailCode.accessToken);
    localStorage.setItem('youcoliva_refresh_token', data.verifyEmailCode.refreshToken);
    setToken(data.verifyEmailCode.accessToken);
    setUser(data.verifyEmailCode.user);
  };

  const resendVerificationCode = async (email: string): Promise<string> => {
    const mutation = `
      mutation ResendCode($email: String!) {
        resendVerificationCode(email: $email) {
          success
          message
        }
      }
    `;

    const data = await fetchGraphQL<{
      resendVerificationCode: { success: boolean; message: string };
    }>(mutation, { email });

    return data.resendVerificationCode.message;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('youcoliva_refresh_token');
    if (refreshToken) {
      const mutation = `
        mutation LogoutUser($refreshToken: String!) {
          logout(refreshToken: $refreshToken)
        }
      `;
      fetchGraphQL(mutation, { refreshToken }).catch(() => {});
    }

    localStorage.removeItem('youcoliva_access_token');
    localStorage.removeItem('youcoliva_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        verifyEmailCode,
        resendVerificationCode,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
