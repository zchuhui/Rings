import { applyPlanChange, type PlanChange } from './coach';
import { addDays, todayStr } from './dates';
import { adjust, type Adjustment } from './engine';
import type { AppState, Card, ChatMessage, Entry, Level, Origin, Plan, Review } from './types';

/**
 * 第一版数据只存在浏览器 localStorage 里。
 * 之后接入账号和云端同步时，只需要替换这个文件里的读写。
 */

const KEY = 'rings:v1';
/** 回顾提交后，把系统调整暂存给结果页 */
export const ADJ_KEY = 'rings:last-adjustment';
const EMPTY: AppState = { version: 1, plan: null, origin: null, entries: [], cards: [], reviews: [] };

let cache: AppState | undefined;
const listeners = new Set<() => void>();

/** 补齐旧版本数据里没有的字段；不认识的数据返回 null */
export function normalize(x: unknown): AppState | null {
  if (!x || typeof x !== 'object') return null;
  const s = x as Partial<AppState>;
  if (s.version !== 1 || !Array.isArray(s.entries)) return null;
  return {
    version: 1,
    plan: s.plan ?? null,
    origin: s.origin ?? null,
    entries: s.entries,
    cards: Array.isArray(s.cards) ? s.cards : [],
    reviews: Array.isArray(s.reviews) ? s.reviews : [],
  };
}

function read(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = normalize(JSON.parse(raw));
      if (s) return s;
    }
  } catch {
    // 隐私模式或数据损坏时回到空状态
  }
  return EMPTY;
}

export function getState(): AppState {
  if (cache === undefined) cache = read();
  return cache;
}

function write(next: AppState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 写不进去也不影响本次使用
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function savePlan(plan: Plan) {
  write({ ...getState(), plan });
}

export function saveOrigin(origin: Origin) {
  write({ ...getState(), origin });
}

/** 记下教练对某一天记录的回应 */
export function saveEcho(date: string, echo: string) {
  const s = getState();
  write({ ...s, entries: s.entries.map((e) => (e.date === date ? { ...e, echo } : e)) });
}

/**
 * 写入一次回顾，返回系统给出的调整。
 * 修改同一天的回顾时，先回到第一次提交前的等级再重新计算，调整不会叠加。
 */
export function saveEntry(entry: Entry): Adjustment {
  const s = getState();
  if (!s.plan) throw new Error('还没有设置成长主题');
  const prev = s.entries.find((e) => e.date === entry.date);
  const base = prev?.planLevel ?? s.plan.level;
  const plan = { ...s.plan, level: base };
  // 记录改了，之前的回应就不再对得上
  const saved: Entry = { ...entry, planLevel: base, echo: prev && prev.note === entry.note ? prev.echo : undefined };
  const entries = [...s.entries.filter((e) => e.date !== entry.date), saved].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const adj = adjust(plan, entries);
  write({ ...s, entries, plan: { ...plan, level: adj.nextLevel } });
  return adj;
}

/** 手动调整等级（PRD F4：手动优先于系统规则），之后修改回顾也不会覆盖它 */
export function setLevel(level: Level) {
  const s = getState();
  if (!s.plan) return;
  const entries = s.entries.map(({ planLevel: _p, ...e }) => e);
  write({ ...s, entries, plan: { ...s.plan, level } });
}

export function resetAll() {
  write(EMPTY);
}

/* ---------- 每周复盘与认知卡片 ---------- */

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 新开或继续一次复盘：返回最近 7 天内没完成的那次，没有就新建 */
export function startReview(today: string): Review {
  const s = getState();
  const open = s.reviews.find((r) => !r.done && r.date >= addDays(today, -6));
  if (open) return open;
  const review: Review = { date: today, messages: [], done: false };
  write({ ...s, reviews: [...s.reviews.filter((r) => r.date !== today), review] });
  return review;
}

export function saveReviewMessages(date: string, messages: ChatMessage[]) {
  const s = getState();
  write({ ...s, reviews: s.reviews.map((r) => (r.date === date ? { ...r, messages } : r)) });
}

/** 复盘结束：收下用户选中的卡片，应用用户确认的调整 */
export function finishReview(date: string, cards: Array<Pick<Card, 'text' | 'source'>>, changes: PlanChange[]) {
  const s = getState();
  if (!s.plan) return;
  const plan = changes.reduce(applyPlanChange, s.plan);
  const newCards: Card[] = cards.map((c) => ({
    id: newId(),
    text: c.text,
    source: c.source,
    date,
    pinned: false,
    theme: s.plan!.theme,
  }));
  write({
    ...s,
    plan,
    cards: [...newCards, ...s.cards],
    reviews: s.reviews.map((r) => (r.date === date ? { ...r, done: true } : r)),
  });
}

export function updateCard(id: string, patch: Partial<Pick<Card, 'text' | 'pinned'>>) {
  const s = getState();
  write({ ...s, cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
}

export function deleteCard(id: string) {
  const s = getState();
  write({ ...s, cards: s.cards.filter((c) => c.id !== id) });
}

/* ---------- 导出与导入（PRD 9.3） ---------- */

export function exportJSON(): string {
  return JSON.stringify(getState(), null, 2);
}

/** 用备份文件覆盖本地数据，格式不对返回 false */
export function importJSON(text: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return false;
  }
  const s = normalize(parsed);
  if (!s) return false;
  write(s);
  return true;
}

/** 示例数据：一个已经练了 20 天的主题，方便直接看到长出来的年轮 */
export function seedDemo() {
  const today = todayStr();
  const startDate = addDays(today, -20);
  const plan: Plan = {
    theme: '在会议上说出自己的观点',
    identity: '我是一个会说出自己想法的人。',
    trigger: '会议开始后的前 10 分钟内',
    environment: '会前写一个要点，放在笔记本第一页',
    ladder: ['会议中说一句话', '在会议上提一个问题', '表达一个完整的观点', '补充或提出不同意见', '主持一个议题的讨论'],
    startDate,
    level: 2,
  };
  const rows: Array<[Entry['outcome'], Entry['energy'], Entry['feel'] | Entry['reason'], 1 | 2]> = [
    ['done', 3, 'right', 1], ['done', 3, 'easy', 1], ['skipped', 2, 'tired', 1], ['done', 4, 'easy', 1],
    ['done', 3, 'easy', 1], ['done', 4, 'easy', 1], ['partial', 2, 'right', 2],
    ['done', 3, 'right', 2], ['done', 4, 'right', 2], ['done', 4, 'easy', 2], ['partial', 3, 'hard', 2],
    ['done', 5, 'right', 2], ['skipped', 2, 'noscene', 2], ['done', 4, 'right', 2],
    ['done', 4, 'right', 2], ['done', 4, 'easy', 2], ['done', 5, 'right', 2], ['partial', 3, 'right', 2],
    ['skipped', 1, 'tired', 2], ['done', 4, 'easy', 2],
  ];
  const notes = ['周会上说了一句同意', '站会上补充了一个数据', '', '问了上线时间', '', '', '想问，只说了半句',
    '周会上问了上线时间', '站会上问了一个细节', '', '大家都在争论，插不进话', '产品会上问了排期，主管说问得好', '',
    '', '', '读书会上问了一个问题', '', '', '', '志愿者例会上问了一个问题'];
  const entries: Entry[] = rows.map(([outcome, energy, x, level], i) => ({
    date: addDays(startDate, i),
    level,
    outcome,
    energy,
    note: notes[i],
    ...(outcome === 'skipped' ? { reason: x as Entry['reason'] } : { feel: x as Entry['feel'] }),
  }));
  const origin: Origin = {
    date: startDate,
    struggle: '开会时总是不敢说话，明明有想法，散会后又后悔',
    ratings: { cognition: 3, ability: 3, mind: 2 },
    stuck: 'restart',
    persistence: 'weeks',
    energy: 3,
    selfTalk: 'again',
  };
  write({ version: 1, plan, origin, entries, cards: [], reviews: [] });
}
