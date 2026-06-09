import { getFirebaseAuth } from '@/lib/firebase/client';
import { cachePendingDisplayName } from '@/lib/user-display-name';
import type { AuthenticatedUser } from '@rateq/types';

/** Persist Google/Firebase display name for profile prefill and header. */
export function syncFirebaseDisplayNameToClient(user: AuthenticatedUser): void {
  const firebaseName = getFirebaseAuth().currentUser?.displayName?.trim();
  if (firebaseName) {
    cachePendingDisplayName(firebaseName);
  } else if (user.displayName) {
    cachePendingDisplayName(user.displayName);
  }
}
