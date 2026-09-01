export const AUTH_STATE_EVENT = 'stepstyle-auth-state';

export type AuthState = 'signed-in' | 'signed-out';

export function notifyAuthState(state: AuthState) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AuthState>(AUTH_STATE_EVENT, { detail: state }));
}
