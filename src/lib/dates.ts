/** 日期都用本地时区的 YYYY-MM-DD 字符串，避免跨时区错一天 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** b 比 a 晚几天 */
export function daysBetween(a: string, b: string): number {
  const ms = parse(b).getTime() - parse(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 例如 “11.08 周日” */
export function shortLabel(s: string): string {
  const d = parse(s);
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${WEEKDAYS[d.getDay()]}`;
}
