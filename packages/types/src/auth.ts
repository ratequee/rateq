import type { UserRole } from './enums';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface MessageResponse {
  message: string;
}
