import { daysBetween } from './dates';
import type { Entry, Level, Plan } from './types';

/**
 * 自适应难度引擎（PRD F4）。规则引擎为主，阈值都是初始假设，上线后用数据校准。
 */
export const RULES = {
  /** 连续几次“太轻松”就升级 */
  easyToLevelUp: 3,
  /** 连续几次“太难”或因太难没做就降级 */
  hardToLevelDown: 2,
  /** 最近几次的状态均值 ≤ lowEnergy 时，临时降到最小版本 */
  energyWindow: 3,
  lowEnergy: 2,
  /** 隔了几天没来算“回归” */
  returnGapDays: 3,
} as const;

export type AdjustmentKind = 'up' | 'down' | 'keep' | 'recharge' | 'trigger' | 'reminder';

export interface Adjustment {
  kind: AdjustmentKind;
  nextLevel: Level;
  title: string;
  body: string;
}

const clampLevel = (n: number): Level => Math.max(1, Math.min(5, n)) as Level;

/** 只有“太难”算难度信号；没精力交给能量规则，其他原因不调难度 */
const isHard = (e: Entry) => e.feel === 'hard' || (e.outcome === 'skipped' && e.reason === 'hard');

const isEasy = (e: Entry) => e.outcome === 'done' && e.feel === 'easy';

/** 按日期排序后的最近 n 条 */
function lastN(entries: Entry[], n: number): Entry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-n);
}

/** 最近几次都记了状态，且均值偏低 */
export function isLowEnergy(entries: Entry[]): boolean {
  const recent = lastN(entries, RULES.energyWindow);
  if (recent.length < RULES.energyWindow || recent.some((e) => e.energy === undefined)) return false;
  const avg = recent.reduce((s, e) => s + (e.energy ?? 0), 0) / recent.length;
  return avg <= RULES.lowEnergy;
}

/** 当前等级下，最近连续“太轻松”的次数 */
export function easyStreak(entries: Entry[], level: Level): number {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let n = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const e = sorted[i];
    if (e.level !== level || !isEasy(e)) break;
    n++;
  }
  return n;
}

/**
 * 在刚写入一次回顾之后调用：根据全部记录（已包含最新一条）决定下一次的难度和要告诉用户的话。
 */
export function adjust(plan: Plan, entries: Entry[]): Adjustment {
  const latest = lastN(entries, 1)[0];
  const level = plan.level;
  if (!latest) return { kind: 'keep', nextLevel: level, title: `保持 L${level}`, body: '' };

  // 1. 情境没出现：不是能力问题，调整触发情境
  if (latest.outcome === 'skipped' && latest.reason === 'noscene') {
    return {
      kind: 'trigger',
      nextLevel: level,
      title: '难度不变，调整触发情境',
      body: `今天挑战没有机会发生。可以把触发情境从“${plan.trigger}”放宽一些，让它更常出现。`,
    };
  }

  // 2. 忘了：不是能力问题，调整提醒或环境
  if (latest.outcome === 'skipped' && latest.reason === 'forgot') {
    return {
      kind: 'reminder',
      nextLevel: level,
      title: '难度不变，换个提醒方式',
      body: '试试把提醒放到触发情境发生之前，或者在环境里留一个看得见的提示。',
    };
  }

  // 3. 连续低能量：先修底座。只是临时降到最小一步，等级本身保留
  if (level > 1 && isLowEnergy(entries)) {
    return {
      kind: 'recharge',
      nextLevel: level,
      title: '先修底座，明天回到最小一步',
      body: `这几天状态偏低。明天只做“${plan.ladder[0]}”，状态回来后自动回到 L${level}。`,
    };
  }

  // 4. 连续太难：降一级
  const lastHard = lastN(entries, RULES.hardToLevelDown);
  if (
    level > 1 &&
    lastHard.length === RULES.hardToLevelDown &&
    lastHard.every((e) => e.level === level && isHard(e))
  ) {
    const next = clampLevel(level - 1);
    return {
      kind: 'down',
      nextLevel: next,
      title: `明天降到 L${next}`,
      body: `先找回手感：${plan.ladder[next - 1]}。降一级不是退步，是让挑战回到学习区。`,
    };
  }

  // 5. 连续太轻松：升一级
  if (level < 5 && easyStreak(entries, level) >= RULES.easyToLevelUp) {
    const next = clampLevel(level + 1);
    return {
      kind: 'up',
      nextLevel: next,
      title: `明天升到 L${next}`,
      body: `连续 ${RULES.easyToLevelUp} 次觉得太轻松，你长高了。新挑战：${plan.ladder[next - 1]}。`,
    };
  }

  // 6. 保持
  const streak = easyStreak(entries, level);
  const left = RULES.easyToLevelUp - streak;
  let body = '“刚好”说明你正待在学习区，这是长得最快的地方。';
  if (latest.feel === 'easy' && level < 5) body = `再有 ${left} 次“太轻松”就升到 L${level + 1}。`;
  if (latest.feel === 'hard') body = '如果下次还是觉得太难，会自动降一级。你也可以手动调整。';
  if (latest.outcome === 'skipped') body = '已经记下了。没做不清零，明天继续。';
  return { kind: 'keep', nextLevel: level, title: `保持 L${level}`, body };
}

export interface TodayChallenge {
  level: Level;
  text: string;
  /** 隔了几天没来，今天从最小一步重新开始（PRD F9） */
  returning: boolean;
  daysAway: number;
  /** 最近状态偏低，今天临时降到最小一步（PRD F5） */
  recharging: boolean;
}

/** 计算今天的挑战 */
export function todayChallenge(plan: Plan, entries: Entry[], today: string): TodayChallenge {
  const before = entries.filter((e) => e.date < today);
  const last = lastN(before, 1)[0];
  const gap = last ? daysBetween(last.date, today) : 0;
  const returning = !!last && gap > RULES.returnGapDays;
  const recharging = !returning && plan.level > 1 && isLowEnergy(before);
  const level: Level = returning || recharging ? 1 : plan.level;
  return {
    level,
    text: plan.ladder[level - 1],
    returning,
    daysAway: returning ? gap - 1 : 0,
    recharging,
  };
}

/** 年轮上的“道纹”数：做了和做了一部分都算 */
export function countGrooves(entries: Entry[]): number {
  return entries.filter((e) => e.outcome !== 'skipped').length;
}
