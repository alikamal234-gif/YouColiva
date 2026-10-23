import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, Campus, UserRole } from '../types/index';
import { fetchGraphQLMobile } from '../lib/api-client';

export interface RegisterPayloadInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  campus: Campus;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (input: RegisterPayloadInput) => Promise<void>;
  loginWithGoogle: (idToken: string, campus?: Campus, role?: UserRole) => Promise<void>;
  loginAsDemoStudent: (campus?: Campus) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  loginWithCredentials: async () => {},
  registerWithCredentials: async () => {},
  loginWithGoogle: async () => {},
  loginAsDemoStudent: () => {},
  logout: () => {},
  updateUser: () => {},
});

const DEFAULT_DEMO_STUDENT: User = {
  id: 'usr_student_demo_1',
  email: 'karim.bennani@youcode.ma',
  firstName: 'Karim',
  lastName: 'Bennani',
  role: 'STUDENT',
  campus: 'YOUSSOUFIA',
  phone: '+212 6 12 34 56 78',
  bio: 'Apprenant YouCode Promo 2026 en Développement Web & Mobile. Recherche une colocation calme et studieuse.',
  isVerified: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start as unauthenticated by default so "Connexion" button appears in header
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  }, []);

  const loginAsDemoStudent = useCallback((campus: Campus = 'YOUSSOUFIA') => {
    setUser({
      ...DEFAULT_DEMO_STUDENT,
      campus,
    });
    setToken('demo_student_token');
  }, []);

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    try {
      const query = `
        mutation MobileLogin($input: LoginInput!) {
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
              bio
              isVerified
              avatarUrl
            }
          }
        }
      `;

      const data = await fetchGraphQLMobile<{
        login: { accessToken: string; user: User };
      }>(query, { input: { email, password } });

      if (data.login?.accessToken && data.login?.user) {
        setToken(data.login.accessToken);
        setUser(data.login.user);
      }
    } catch (err: unknown) {
      // If server is unreachable or credentials invalid, throw message
      const msg = err instanceof Error ? err.message : 'Identifiants invalides';
      throw new Error(msg);
    }
  }, []);

  const registerWithCredentials = useCallback(async (input: RegisterPayloadInput) => {
    try {
      const query = `
        mutation MobileRegister($input: RegisterInput!) {
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
              isVerified
            }
          }
        }
      `;

      const data = await fetchGraphQLMobile<{
        register: { accessToken: string; user: User };
      }>(query, { input });

      if (data.register?.accessToken && data.register?.user) {
        setToken(data.register.accessToken);
        setUser(data.register.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      throw new Error(msg);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (idToken: string, campus: Campus = 'YOUSSOUFIA', role: UserRole = 'STUDENT') => {
      try {
        const query = `
          mutation MobileLoginWithGoogle($idToken: String!, $campus: Campus, $role: UserRole) {
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
                bio
                isVerified
                avatarUrl
              }
            }
          }
        `;

        const data = await fetchGraphQLMobile<{
          loginWithGoogle: { accessToken: string; user: User };
        }>(query, { idToken, campus, role });

        if (data.loginWithGoogle?.accessToken && data.loginWithGoogle?.user) {
          setToken(data.loginWithGoogle.accessToken);
          setUser(data.loginWithGoogle.user);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur de connexion avec Google';
        throw new Error(msg);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        loginWithCredentials,
        registerWithCredentials,
        loginWithGoogle,
        loginAsDemoStudent,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
