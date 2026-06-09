import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from './services/email.service';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { FirebaseAdminAccessService } from './services/firebase-admin-access.service';
import { TokenService } from './services/token.service';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<
    Pick<
      AuthRepository,
      | 'findUserByEmail'
      | 'createUser'
      | 'replaceEmailVerification'
      | 'findEmailVerificationByHash'
      | 'deleteEmailVerificationsByUserId'
      | 'markUserVerified'
    >
  >;
  let tokenService: jest.Mocked<Pick<TokenService, 'createTokenPair' | 'getVerificationExpiry'>>;
  let emailService: jest.Mocked<Pick<EmailService, 'sendVerificationEmail'>>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    displayName: null,
    firebaseUid: null,
    passwordHash: '',
    role: UserRole.USER,
    isVerified: false,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('SecurePass123', 4);

    authRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      replaceEmailVerification: jest.fn(),
      findEmailVerificationByHash: jest.fn(),
      deleteEmailVerificationsByUserId: jest.fn(),
      markUserVerified: jest.fn(),
    };

    tokenService = {
      createTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
      getVerificationExpiry: jest.fn().mockReturnValue(new Date(Date.now() + 86400000)),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: TokenService, useValue: tokenService },
        { provide: EmailService, useValue: emailService },
        {
          provide: FirebaseAdminService,
          useValue: { verifyIdToken: jest.fn() },
        },
        {
          provide: FirebaseAdminAccessService,
          useValue: {
            isWhitelisted: jest.fn().mockReturnValue(false),
            hasAnyAdmin: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'SecurePass123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns tokens', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'SecurePass123',
      });

      expect(authRepository.createUser).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe('access');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'SecurePass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens for valid credentials', async () => {
      authRepository.findUserByEmail.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'SecurePass123',
      });

      expect(result.tokens.refreshToken).toBe('refresh');
      expect(tokenService.createTokenPair).toHaveBeenCalledWith(mockUser);
    });
  });
});
