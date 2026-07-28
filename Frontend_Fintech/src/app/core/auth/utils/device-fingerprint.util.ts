export function buildDeviceFingerprint(): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const raw = `${ua}|${screen}|${navigator.language}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}
