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
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
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
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
