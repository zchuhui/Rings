import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import * as store from './store';
import type { Entry, Plan } from './types';

// store 只在浏览器里运行，这里给它一个最小的 window.localStorage（store 用到时才读 window）
const mem = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
    },
    addEventListener() {},
    removeEventListener() {},
  },
});

const { getState, saveEntry, savePlan, setLevel, importJSON, exportJSON, finishReview, startReview, normalize } = store;

const plan: Plan = {
  theme: '在会议上说出自己的观点',
  identity: '我是一个会说出自己想法的人。',
  trigger: '会议开始后的前 10 分钟内',
  environment: '',
  ladder: ['L1', 'L2', 'L3', 'L4', 'L5'],
  startDate: '2026-10-19',
  level: 2,
};

const entry = (date: string, x: Partial<Entry>): Entry => ({ date, level: 2, outcome: 'done', feel: 'right', note: '', ...x });

beforeEach(() => {
  store.resetAll();
  savePlan(plan);
});

test('修改当天回顾时，之前的升级会撤销，不会叠加', () => {
  saveEntry(entry('2026-10-19', { feel: 'easy' }));
  saveEntry(entry('2026-10-20', { feel: 'easy' }));
  const up = saveEntry(entry('2026-10-21', { feel: 'easy' }));
  assert.equal(up.kind, 'up');
  assert.equal(getState().plan?.level, 3);

  const fixed = saveEntry(entry('2026-10-21', { feel: 'right' }));
  assert.equal(fixed.kind, 'keep');
  assert.equal(getState().plan?.level, 2);
});

test('同一天重复提交同样的回顾，结果不变', () => {
  saveEntry(entry('2026-10-20', { feel: 'hard' }));
  saveEntry(entry('2026-10-21', { feel: 'hard' }));
  assert.equal(getState().plan?.level, 1);
  saveEntry(entry('2026-10-21', { feel: 'hard' }));
  assert.equal(getState().plan?.level, 1);
});

test('手动调整等级之后，再修改回顾不会把它改回去', () => {
  saveEntry(entry('2026-10-21', { feel: 'right' }));
  setLevel(4);
  saveEntry(entry('2026-10-21', { feel: 'right', level: 2 }));
  assert.equal(getState().plan?.level, 4);
});

test('导出再导入，数据一致；格式不对的文件被拒绝', () => {
  saveEntry(entry('2026-10-21', { note: '问了上线时间' }));
  const backup = exportJSON();
  store.resetAll();
  assert.equal(importJSON('{"hello":1}'), false);
  assert.equal(importJSON('不是 JSON'), false);
  assert.equal(importJSON(backup), true);
  assert.equal(getState().entries[0].note, '问了上线时间');
});

test('旧版数据没有卡片和复盘字段，读取时补齐', () => {
  const s = normalize({ version: 1, plan: null, entries: [] });
  assert.deepEqual(s?.cards, []);
  assert.deepEqual(s?.reviews, []);
});

test('复盘完成：收下卡片、应用调整、标记完成', () => {
  const r = startReview('2026-10-25');
  finishReview(r.date, [{ text: '我怕的不是说错，是怕冷场。', source: '大家都在争论，插不进话' }], [
    { field: 'trigger', value: '每次站会轮到我之前', reason: '', quote: '站会上补充了一个数据' },
  ]);
  const s = getState();
  assert.equal(s.cards.length, 1);
  assert.equal(s.cards[0].theme, plan.theme);
  assert.equal(s.plan?.trigger, '每次站会轮到我之前');
  assert.equal(s.reviews[0].done, true);
});

test('没做完的复盘，一周内再打开会接着聊；超过一周重新开始', () => {
  const r = startReview('2026-10-25');
  store.saveReviewMessages(r.date, [{ role: 'assistant', content: '这周哪里走出了舒适区？' }]);
  assert.equal(startReview('2026-10-27').messages.length, 1);
  assert.equal(startReview('2026-11-02').date, '2026-11-02');
});
