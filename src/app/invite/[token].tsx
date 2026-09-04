import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { parseInviteToken, setPendingInviteToken } from '@/modules/invite';
import { copy } from '@/shared/copy';
import { AppText, Screen } from '@/shared/ui';

export default function InviteDeepLinkScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();

  useEffect(() => {
    const raw = Array.isArray(token) ? token[0] : token;
    const parsed = typeof raw === 'string' ? parseInviteToken(raw) : null;
    if (parsed !== null) {
      setPendingInviteToken(parsed);
    }
    router.replace('/access');
  }, [router, token]);

  return (
    <Screen>
      <AppText>{copy.access.loading}</AppText>
    </Screen>
  );
}
