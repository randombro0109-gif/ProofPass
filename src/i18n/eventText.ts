import type { TrailEvent } from '@/types';
import type { Translate } from '@/i18n';

export function trailMessage(event: TrailEvent, t: Translate): string {
  const labels = Object.fromEntries(Object.entries(event.labelParams ?? {}).map(([name, key]) => [name, t(key)]));
  return t(event.key, { ...event.params, ...labels });
}
