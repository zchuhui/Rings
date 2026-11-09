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
  /** 写入这条回顾之前的等级。修改当天回顾时，从这里重新计算，避免调整叠加 */
  planLevel?: Level;
  /** 教练读完这一句记录后的回应 */
  echo?: string;
}

/**
 * 起点：第一次进来时，看完成长理论留下的回答（PRD F1 自评）。
 * 之后在首页、复盘和第 90 天报告里反复被提起，让用户一直被看见。
 */
export interface Origin {
  date: string;
  /** 最近让你搞不定的事，原话 */
  struggle: string;
  /** 认知、能力、心性三层自评，1–5 */
  ratings?: { cognition?: number; ability?: number; mind?: number };
  stuck?: 'action' | 'feedback' | 'reflect' | 'restart';
  persistence?: 'days' | 'weeks' | 'month' | 'long';
  energy?: Energy;
  selfTalk?: 'again' | 'giveup' | 'later' | 'curious';
  /** 教练读完全部回答后写的一段话 */
  reflection?: string;
}

/** 认知卡片（PRD F7） */
export interface Card {
  id: string;
  /** 一句认知，例如“我怕的不是说错，是怕冷场。” */
  text: string;
  /** 来源记录：用户自己写过的原话 */
  source: string;
  date: string;
  pinned: boolean;
  /** 产生这张卡片时的主题，用于归档 */
  theme: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 每周复盘（PRD F6） */
export interface Review {
  /** 开始复盘的日期，也是这次复盘的 id */
  date: string;
  messages: ChatMessage[];
  /** 已经整理出卡片和调整，并由用户确认 */
  done: boolean;
}

export interface AppState {
  version: 1;
  plan: Plan | null;
  origin: Origin | null;
  entries: Entry[];
  cards: Card[];
  reviews: Review[];
}

export const STAGES: Record<Level, string> = {
  1: '种子',
  2: '发芽',
  3: '幼苗',
  4: '小树',
  5: '成林',
};

export const THEME_DAYS = 90;
