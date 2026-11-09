import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adjust, countGrooves, easyStreak, todayChallenge } from './engine';
import type { Entry, Level, Plan } from './types';

const plan = (level: Level): Plan => ({
  theme: '在会议上说出自己的观点',
  identity: '我是一个会说出自己想法的人。',
  trigger: '会议开始后的前 10 分钟内',
  environment: '',
  ladder: ['L1 说一句话', 'L2 提一个问题', 'L3 完整观点', 'L4 不同意见', 'L5 主持议题'],
  startDate: '2026-10-19',
  level,
});

const e = (date: string, level: Level, x: Partial<Entry>): Entry => ({
  date,
  level,
  outcome: 'done',
  feel: 'right',
  note: '',
  ...x,
});

test('连续 3 次太轻松升一级', () => {
  const entries = [
    e('2026-10-19', 2, { feel: 'easy' }),
    e('2026-10-20', 2, { feel: 'easy' }),
    e('2026-10-21', 2, { feel: 'easy' }),
  ];
  const a = adjust(plan(2), entries);
  assert.equal(a.kind, 'up');
  assert.equal(a.nextLevel, 3);
});

test('只有 2 次太轻松不升级，并提示还差几次', () => {
  const entries = [e('2026-10-20', 2, { feel: 'easy' }), e('2026-10-21', 2, { feel: 'easy' })];
  const a = adjust(plan(2), entries);
  assert.equal(a.kind, 'keep');
  assert.match(a.body, /再有 1 次/);
});

test('上一级的太轻松不计入当前等级', () => {
  const entries = [
    e('2026-10-19', 1, { feel: 'easy' }),
    e('2026-10-20', 1, { feel: 'easy' }),
    e('2026-10-21', 2, { feel: 'easy' }),
  ];
  assert.equal(easyStreak(entries, 2), 1);
  assert.equal(adjust(plan(2), entries).kind, 'keep');
});

test('连续 2 次太难降一级', () => {
  const entries = [e('2026-10-20', 3, { feel: 'hard' }), e('2026-10-21', 3, { outcome: 'skipped', feel: undefined, reason: 'hard' })];
  const a = adjust(plan(3), entries);
  assert.equal(a.kind, 'down');
  assert.equal(a.nextLevel, 2);
});

test('L1 不会再往下降', () => {
  const entries = [e('2026-10-20', 1, { feel: 'hard' }), e('2026-10-21', 1, { feel: 'hard' })];
  assert.equal(adjust(plan(1), entries).nextLevel, 1);
});

test('情境没出现：难度不变，建议调整触发情境', () => {
  const entries = [e('2026-10-21', 2, { outcome: 'skipped', feel: undefined, reason: 'noscene' })];
  const a = adjust(plan(2), entries);
  assert.equal(a.kind, 'trigger');
  assert.equal(a.nextLevel, 2);
});

test('忘了：难度不变，建议换提醒方式', () => {
  const entries = [e('2026-10-21', 2, { outcome: 'skipped', feel: undefined, reason: 'forgot' })];
  assert.equal(adjust(plan(2), entries).kind, 'reminder');
});

test('连续 3 天低能量：先修底座，但等级保留', () => {
  const entries = [
    e('2026-10-19', 3, { energy: 2 }),
    e('2026-10-20', 3, { energy: 1 }),
    e('2026-10-21', 3, { energy: 2 }),
  ];
  const a = adjust(plan(3), entries);
  assert.equal(a.kind, 'recharge');
  assert.equal(a.nextLevel, 3);
  const t = todayChallenge(plan(3), entries, '2026-10-22');
  assert.equal(t.recharging, true);
  assert.equal(t.level, 1);
});

test('隔了 3 天以上回来，今天从 L1 开始', () => {
  const entries = [e('2026-10-21', 3, {})];
  const t = todayChallenge(plan(3), entries, '2026-10-26');
  assert.equal(t.returning, true);
  assert.equal(t.level, 1);
  assert.equal(t.daysAway, 4);
});

test('正常情况下今天按当前等级', () => {
  const entries = [e('2026-10-21', 2, {})];
  const t = todayChallenge(plan(2), entries, '2026-10-22');
  assert.equal(t.returning, false);
  assert.equal(t.level, 2);
  assert.equal(t.text, 'L2 提一个问题');
});

test('道纹数：做了和一部分都算，没做不算', () => {
  const entries = [
    e('2026-10-19', 1, {}),
    e('2026-10-20', 1, { outcome: 'partial' }),
    e('2026-10-21', 1, { outcome: 'skipped', reason: 'tired' }),
  ];
  assert.equal(countGrooves(entries), 2);
});

test('因为没精力没做不算太难，不降级', () => {
  const entries = [
    e('2026-10-20', 3, { outcome: 'skipped', feel: undefined, reason: 'tired' }),
    e('2026-10-21', 3, { outcome: 'skipped', feel: undefined, reason: 'tired' }),
  ];
  const a = adjust(plan(3), entries);
  assert.equal(a.kind, 'keep');
  assert.equal(a.nextLevel, 3);
});
