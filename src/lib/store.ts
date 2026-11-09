import { addDays, todayStr } from './dates';
import { adjust, type Adjustment } from './engine';
import type { AppState, Entry, Plan } from './types';

/**
 * 第一版数据只存在浏览器 localStorage 里。
 * 之后接入账号和云端同步时，只需要替换这个文件里的读写。
 */

const KEY = 'rings:v1';
/** 回顾提交后，把系统调整暂存给结果页 */
export const ADJ_KEY = 'rings:last-adjustment';
const EMPTY: AppState = { version: 1, plan: null, entries: [] };

let cache: AppState | undefined;
const listeners = new Set<() => void>();

function read(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && s.version === 1) return s;
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

/** 写入今天的回顾，返回系统给出的调整 */
export function saveEntry(entry: Entry): Adjustment {
  const s = getState();
  if (!s.plan) throw new Error('还没有设置成长主题');
  const entries = [...s.entries.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const adj = adjust(s.plan, entries);
  write({ ...s, entries, plan: { ...s.plan, level: adj.nextLevel } });
  return adj;
}

export function resetAll() {
  write(EMPTY);
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
  write({ version: 1, plan, entries });
}
