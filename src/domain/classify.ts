import type { Category } from '@/types';

const RULES: { category: Category; pattern: RegExp }[] = [
  { category: 'visa', pattern: /visa|residen|permit|emirates id|entry|sponsor/i },
  { category: 'university', pattern: /univers|college|degree|admission|study|school/i },
  { category: 'business', pattern: /business|company|startup|start-up|trade licen|open a shop|firm/i },
  { category: 'housing', pattern: /home|house|flat|apartment|move|moving|address|housing|property|rent|lease|register/i },
];

export function classifyGoal(text: string): Category {
  return RULES.find((rule) => rule.pattern.test(text))?.category ?? 'other';
}
