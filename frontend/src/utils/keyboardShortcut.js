/**
 * SparkX Platform-Aware Keyboard Shortcut Utility
 * Automatically displays '⌘' for macOS and 'Ctrl' for Windows / Linux
 */

export function isMacUser() {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '';
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

export function getModifierKey() {
  return isMacUser() ? '⌘' : 'Ctrl';
}

export function formatShortcut(letter) {
  const isMac = isMacUser();
  return isMac ? `⌘${letter}` : `Ctrl+${letter}`;
}
