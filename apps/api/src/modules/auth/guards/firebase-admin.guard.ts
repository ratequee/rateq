import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '@rateq/types';
import { AuthRepository } from '../repositories/auth.repository';
import { FirebaseAdminAccessService } from '../services/firebase-admin-access.service';

@Injectable()
export class FirebaseAdminGuard implements CanActivate {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly firebaseAdminAccess: FirebaseAdminAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const dbUser = await this.authRepository.findUserById(user.id);

    if (!dbUser?.firebaseUid) {
      throw new ForbiddenException('Firebase admin access requires a linked Firebase account');
    }

    if (!this.firebaseAdminAccess.isWhitelisted(dbUser.firebaseUid)) {
      throw new ForbiddenException('You are not authorized for admin access');
    }

    return true;
  }
}
