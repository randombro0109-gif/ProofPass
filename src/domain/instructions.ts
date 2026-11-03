import type { JourneyTask } from '@/types';

export const MAX_INSTRUCTION_BYTES = 1024 * 1024;
export const MAX_UNMATCHED_TASKS = 6;
const MAX_INSTRUCTION_LINES = 12;

export const INSTRUCTION_HINTS: { pattern: RegExp; taskIds: string[] }[] = [
  { pattern: /passport/i, taskIds: ['passport'] },
  { pattern: /photo|photograph|picture/i, taskIds: ['photo'] },
  { pattern: /address|tenancy|ejari|residence|home/i, taskIds: ['reuse', 'address'] },
  { pattern: /contact|phone|email|sms/i, taskIds: ['reuse', 'contact'] },
  { pattern: /sponsor/i, taskIds: ['sponsor'] },
  { pattern: /medical|biometric|appointment|attend/i, taskIds: ['appointment'] },
  { pattern: /transcript|degree|certificate|qualification/i, taskIds: ['academic'] },
  { pattern: /licen[cs]e|business name|trade name/i, taskIds: ['business'] },
  { pattern: /statement|essay/i, taskIds: ['statement'] },
];

export function splitInstructionLines(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((line) => line.length >= 4);
  return [...new Set(lines)].slice(0, MAX_INSTRUCTION_LINES);
}

export function isPlainTextFile(file: File): boolean {
  return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
}

export function matchInstructionLine(line: string, tasks: JourneyTask[]): JourneyTask | undefined {
  for (const hint of INSTRUCTION_HINTS) {
    if (!hint.pattern.test(line)) continue;
    for (const id of hint.taskIds) {
      const match = tasks.find((task) => task.id === id);
      if (match) return match;
    }
  }
  return undefined;
}

