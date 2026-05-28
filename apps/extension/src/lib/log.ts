// Silent by default so end users never see extension logs in their console.
// Enable for debugging by running `localStorage.lbp_debug = '1'` then reloading.
function debugEnabled(): boolean {
  try {
    return localStorage.getItem('lbp_debug') === '1';
  } catch {
    return false;
  }
}

export const log = (...args: unknown[]): void => {
  if (debugEnabled()) console.log('[Lama]', ...args);
};

export const warn = (...args: unknown[]): void => {
  if (debugEnabled()) console.warn('[Lama]', ...args);
};

export const error = (...args: unknown[]): void => {
  if (debugEnabled()) console.error('[Lama]', ...args);
};
