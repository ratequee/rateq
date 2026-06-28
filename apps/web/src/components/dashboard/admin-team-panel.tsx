'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/admin-platform-api';
import { ApiError, usersApi } from '@/lib/api';
import { ensureValidAccessToken } from '@/lib/auth-session';
import {
  AdminPermission,
  GRANTABLE_ADMIN_PERMISSIONS,
  hasAdminPermission,
  UserRole,
  type UserProfile,
} from '@rateq/types';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PERMISSION_LABEL_KEYS: Record<AdminPermission, string> = {
  [AdminPermission.STATS]: 'stats',
  [AdminPermission.COMPANIES]: 'companies',
  [AdminPermission.DIRECTORY]: 'directory',
  [AdminPermission.MODERATION]: 'moderation',
  [AdminPermission.CONTENT]: 'content',
  [AdminPermission.INVITATIONS]: 'invitations',
  [AdminPermission.TEAM]: 'team',
};

export function AdminTeamPanel() {
  const t = useTranslations('adminTeam');
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [demotingId, setDemotingId] = useState<string | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, AdminPermission[]>>({});
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promotePermissions, setPromotePermissions] = useState<AdminPermission[]>([
    AdminPermission.DIRECTORY,
  ]);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;
      const data = await adminApi.listTeam(token);
      setMembers(data);
      setDraftPermissions(
        Object.fromEntries(data.map((member) => [member.id, [...member.adminPermissions]])),
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('loadError');
      toast.error(message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePermission = (memberId: string, permission: AdminPermission) => {
    setDraftPermissions((current) => {
      const existing = current[memberId] ?? [];
      const next = existing.includes(permission)
        ? existing.filter((item) => item !== permission)
        : [...existing, permission];
      return { ...current, [memberId]: next };
    });
  };

  const handleSave = async (member: UserProfile) => {
    const permissions = draftPermissions[member.id] ?? [];

    if (permissions.length === 0) {
      toast.error(t('permissionsRequired'));
      return;
    }

    setSavingId(member.id);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      await adminApi.updateUser(token, member.id, { adminPermissions: permissions });
      await load();
      toast.success(t('saved'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('saveError');
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  const handlePromote = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = promoteEmail.trim().toLowerCase();

    if (!email || promotePermissions.length === 0) {
      toast.error(t('promoteInvalid'));
      return;
    }

    setPromoting(true);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      const params = new URLSearchParams({ search: email, limit: '10', page: '1' });
      const result = await usersApi.list(token, params);
      const match = result.data.find((user) => user.email.toLowerCase() === email);

      if (!match) {
        toast.error(t('promoteNotFound'));
        return;
      }

      await adminApi.updateUser(token, match.id, {
        role: UserRole.ADMIN,
        adminPermissions: promotePermissions,
      });

      setPromoteEmail('');
      await load();
      toast.success(t('promoted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('promoteError');
      toast.error(message);
    } finally {
      setPromoting(false);
    }
  };

  const togglePromotePermission = (permission: AdminPermission) => {
    setPromotePermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const handleDemote = async (member: UserProfile) => {
    if (member.id === currentUser?.id) {
      toast.error(t('demoteSelf'));
      return;
    }

    if (!window.confirm(t('demoteConfirm', { email: member.email }))) {
      return;
    }

    setDemotingId(member.id);
    try {
      const token = await ensureValidAccessToken();
      if (!token) return;

      await adminApi.updateUser(token, member.id, { role: UserRole.USER });
      await load();
      toast.success(t('demoted'));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('demoteError');
      toast.error(message);
    } finally {
      setDemotingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handlePromote} className="surface-card space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-primary">{t('promoteTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('promoteSubtitle')}</p>
        </div>
        <Input
          type="email"
          value={promoteEmail}
          onChange={(e) => setPromoteEmail(e.target.value)}
          placeholder={t('promoteEmailPlaceholder')}
          className="h-11"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {GRANTABLE_ADMIN_PERMISSIONS.map((permission) => (
            <label
              key={`promote-${permission}`}
              className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={promotePermissions.includes(permission)}
                onChange={() => togglePromotePermission(permission)}
              />
              <span>{t(`permissions.${PERMISSION_LABEL_KEYS[permission]}`)}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={promotePermissions.includes(AdminPermission.TEAM)}
              onChange={() => togglePromotePermission(AdminPermission.TEAM)}
            />
            <span>{t('permissions.team')}</span>
          </label>
        </div>
        <Button type="submit" disabled={promoting}>
          {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('promoteAction')}
        </Button>
      </form>

      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-secondary">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
            const permissions = draftPermissions[member.id] ?? member.adminPermissions;
            const isSuperAdmin = hasAdminPermission(permissions, AdminPermission.TEAM);
            const isCurrentUser = member.id === currentUser?.id;

            return (
              <div key={member.id} className="surface-card p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary">{member.displayName ?? member.email}</p>
                    <p className="text-sm text-secondary">{member.email}</p>
                  </div>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                      <Shield className="h-3.5 w-3.5" />
                      {t('superAdmin')}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {GRANTABLE_ADMIN_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(permission)}
                        onChange={() => togglePermission(member.id, permission)}
                      />
                      <span>{t(`permissions.${PERMISSION_LABEL_KEYS[permission]}`)}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={permissions.includes(AdminPermission.TEAM)}
                      onChange={() => togglePermission(member.id, AdminPermission.TEAM)}
                    />
                    <span>{t('permissions.team')}</span>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingId === member.id || demotingId === member.id}
                    onClick={() => void handleSave(member)}
                  >
                    {savingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('save')
                    )}
                  </Button>
                  {!isCurrentUser ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={demotingId === member.id || savingId === member.id}
                      onClick={() => void handleDemote(member)}
                    >
                      {demotingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t('demoteAction')
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
