import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRing } from './ring';
import type { Entry } from './types';

const geo = { cx: 150, cy: 150, r0: 46, gap: 7.5 };
const entry = (date: string, x: Partial<Entry> = {}): Entry => ({
  date,
  level: 1,
  outcome: 'done',
  feel: 'right',
  note: '',
  energy: 4,
  ...x,
});

test('完成的一天按状态颜色分组', () => {
  const r = buildRing([entry('2026-10-19'), entry('2026-10-20', { energy: 1 })], '2026-10-19', '2026-10-21', geo);
  assert.equal((r.energy[4].match(/M/g) ?? []).length, 1);
  assert.equal((r.energy[1].match(/M/g) ?? []).length, 1);
});

test('今天没回顾时画出今天那一段，回顾后不再画', () => {
  const before = buildRing([], '2026-10-19', '2026-10-19', geo);
  assert.notEqual(before.today, '');
  const after = buildRing([entry('2026-10-19')], '2026-10-19', '2026-10-19', geo);
  assert.equal(after.today, '');
});

test('高亮的那一天单独返回，并给出位置', () => {
  const r = buildRing([entry('2026-10-19')], '2026-10-19', '2026-10-19', geo, '2026-10-19');
  assert.notEqual(r.highlight, '');
  assert.equal(r.energy[4], '');
  assert.ok(r.highlightPoint);
});

test('休息日是一个点，做了一部分是细纹', () => {
  const r = buildRing(
    [entry('2026-10-19', { outcome: 'skipped', reason: 'tired' }), entry('2026-10-20', { outcome: 'partial' })],
    '2026-10-19',
    '2026-10-21',
    geo,
  );
  assert.notEqual(r.rest, '');
  assert.notEqual(r.partial, '');
});

test('第一周在最里圈，第二周往外一圈', () => {
  const r1 = buildRing([entry('2026-10-19')], '2026-10-19', '2026-10-30', geo);
  const r2 = buildRing([entry('2026-10-26')], '2026-10-19', '2026-10-30', geo);
  const radius = (d: string) => Number(d.split('A')[1].trim().split(' ')[0]);
  assert.ok(radius(r2.energy[4]) > radius(r1.energy[4]) + 5);
});

test('90 天以外的记录不画', () => {
  const r = buildRing([entry('2027-02-01')], '2026-10-19', '2027-02-01', geo);
  assert.equal(r.energy[4], '');
  assert.equal(r.today, '');
});
