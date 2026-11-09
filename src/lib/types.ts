/** 难度等级，对应生长阶段：1 种子 · 2 发芽 · 3 幼苗 · 4 小树 · 5 成林 */
export type Level = 1 | 2 | 3 | 4 | 5;

/** 当天状态，1 低 → 5 高，决定年轮上这一道的颜色 */
export type Energy = 1 | 2 | 3 | 4 | 5;

export type Outcome = 'done' | 'partial' | 'skipped';
export type Feel = 'easy' | 'right' | 'hard';
export type SkipReason = 'hard' | 'forgot' | 'tired' | 'noscene' | 'other';

/** 一个 90 天成长主题对应的执行系统（PRD F1、F2） */
export interface Plan {
  theme: string;
  identity: string;
  trigger: string;
  environment: string;
  /** 五级难度阶梯，ladder[0] 是最小行为 */
  ladder: [string, string, string, string, string];
  /** 主题开始日期 YYYY-MM-DD */
  startDate: string;
  /** 当前难度 */
  level: Level;
}

/** 一次晚间回顾（PRD F3、F5） */
export interface Entry {
  date: string;
  level: Level;
  outcome: Outcome;
  feel?: Feel;
  reason?: SkipReason;
  note: string;
  energy?: Energy;
}

export interface AppState {
  version: 1;
  plan: Plan | null;
  entries: Entry[];
}

export const STAGES: Record<Level, string> = {
  1: '种子',
  2: '发芽',
  3: '幼苗',
  4: '小树',
  5: '成林',
};

export const THEME_DAYS = 90;
