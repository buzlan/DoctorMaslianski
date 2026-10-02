export type DeferredInstallPrompt = {
  preventDefault?: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PromptTarget = {
  addEventListener: (type: string, listener: (event: Event) => void) => void;
};

let pending: DeferredInstallPrompt | null = null;

export function captureBeforeInstallPrompt(target: PromptTarget): void {
  target.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pending = event as Event & DeferredInstallPrompt;
  });
}

export function peekInstallPrompt(): DeferredInstallPrompt | null {
  return pending;
}

export function takeInstallPrompt(): DeferredInstallPrompt | null {
  const current = pending;
  pending = null;
  return current;
}

export async function completeInstallPrompt(
  prompt: DeferredInstallPrompt | null,
): Promise<'accepted' | 'dismissed' | 'manual'> {
  if (prompt === null) {
    return 'manual';
  }
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
}

export function registerPushFoundationWorker(
  nav: { serviceWorker?: { register: (url: string) => Promise<unknown> } } | null,
): void {
  if (nav?.serviceWorker === undefined) {
    return;
  }
  void nav.serviceWorker.register('/sw.js').catch(() => undefined);
}
