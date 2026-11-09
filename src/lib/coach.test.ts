import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyPlanChange, extractJSON, hasCrisisSignal, parseDraft, parseSummary } from './coach';
import type { Plan } from './types';

const plan: Plan = {
  theme: 't',
  identity: 'i',
  trigger: 'old trigger',
  environment: '',
  ladder: ['a', 'b', 'c', 'd', 'e'],
  startDate: '2026-10-19',
  level: 1,
};

test('能从代码块里取出 JSON', () => {
  assert.deepEqual(extractJSON('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJSON('好的：{"a":2} 以上'), { a: 2 });
  assert.equal(extractJSON('没有 JSON'), null);
});

test('起步草稿：阶梯必须正好 5 级且都不为空', () => {
  const ok = { theme: '在会议上说一句话', identity: '我是…', trigger: '会议开始时', environment: '', ladder: ['1', '2', '3', '4', '5'] };
  assert.ok(parseDraft(ok));
  assert.equal(parseDraft({ ...ok, ladder: ['1', '2', '3', '4'] }), null);
  assert.equal(parseDraft({ ...ok, ladder: ['1', '', '3', '4', '5'] }), null);
  assert.equal(parseDraft({ ...ok, theme: '' }), null);
});

test('复盘产出：最多 2 张卡片、2 条调整，没有引用原话的调整被丢掉', () => {
  const s = parseSummary({
    cards: [{ text: 'a', source: 'x' }, { text: 'b' }, { text: 'c' }],
    changes: [
      { field: 'trigger', value: '新情境', quote: '原话' },
      { field: 'environment', value: '新环境', quote: '' },
      { field: 'ladder', level: 9, value: 'x', quote: '原话' },
      { field: 'ladder', level: 2, value: '新 L2', quote: '原话' },
      { field: 'nope', value: 'x', quote: '原话' },
    ],
  });
  assert.equal(s?.cards.length, 2);
  assert.deepEqual(s?.changes.map((c) => c.field), ['trigger', 'ladder']);
  assert.equal(s?.changes[1].level, 2);
  assert.equal(parseSummary({ cards: [], changes: [] }), null);
});

test('应用调整只改对应的那一项', () => {
  assert.equal(applyPlanChange(plan, { field: 'trigger', value: 'new', reason: '', quote: 'q' }).trigger, 'new');
  const p = applyPlanChange(plan, { field: 'ladder', level: 3, value: 'C', reason: '', quote: 'q' });
  assert.deepEqual(p.ladder, ['a', 'b', 'C', 'd', 'e']);
  assert.deepEqual(plan.ladder, ['a', 'b', 'c', 'd', 'e']);
});

test('危机信号识别', () => {
  assert.ok(hasCrisisSignal('最近真的不想活了'));
  assert.ok(!hasCrisisSignal('今天会议上说了一句话'));
});

import { echoRatings, pickRecall, principleFor } from './theory';

test('三层自评的回应：点出最低和最高的一层', () => {
  assert.match(echoRatings({ cognition: 3, ability: 4, mind: 2 }), /心性是你给分最低的（2 分），能力是你的底子（4 分）/);
  assert.match(echoRatings({ cognition: 3, ability: 3, mind: 3 }), /三层你都打了 3 分/);
  assert.equal(echoRatings({ cognition: 3 }), '');
});

test('首页回声：第一周是起点那句话，之后也会轮到以前的记录', () => {
  const origin = { date: '2026-10-01', struggle: '开会不敢说话' };
  const entries = [{ date: '2026-10-02', level: 1 as const, outcome: 'done' as const, note: '说了一句同意' }];
  assert.equal(pickRecall(origin, entries, '2026-10-01', '2026-10-03')?.text, '开会不敢说话');
  const texts = new Set(['2026-10-10', '2026-10-11'].map((d) => pickRecall(origin, entries, '2026-10-01', d)?.text));
  assert.deepEqual([...texts].sort(), ['开会不敢说话', '说了一句同意'].sort());
  assert.equal(pickRecall(null, [], '2026-10-01', '2026-10-03'), null);
});

test('系统调整对应到原理', () => {
  assert.equal(principleFor('recharge', false), 'energy');
  assert.equal(principleFor('trigger', true), 'environment');
  assert.equal(principleFor('keep', true), 'mind');
  assert.equal(principleFor('up', false), 'zone');
});

import { cleanEcho } from './coach';

test('回应只去掉包在整段外面的引号', () => {
  assert.equal(cleanEcho('“今天先如实记下这一次。”'), '今天先如实记下这一次。');
  assert.equal(cleanEcho('“会上一直走神”和状态对得上。'), '“会上一直走神”和状态对得上。');
  assert.equal(cleanEcho('第一句。\n\n第二句。'), '第一句。第二句。');
});
