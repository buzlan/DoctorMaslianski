import { useLayoutEffect } from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { parseInviteToken, setPendingInviteToken } from '@/modules/invite';

import AccessScreen from '../access';

export default function InviteDeepLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const raw = Array.isArray(token) ? token[0] : token;
  const parsed = typeof raw === 'string' ? parseInviteToken(raw) : null;

  useLayoutEffect(() => {
    setPendingInviteToken(parsed);
  }, [parsed]);

  if (parsed === null) {
    return <Redirect href="/access" />;
  }

  return <AccessScreen inviteToken={parsed} />;
}
