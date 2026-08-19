import test from 'node:test';
import assert from 'node:assert/strict';

import { fmtBRL, fmtNumber, fmtPct, fmtPp, parseDecimal } from '../js/formatters.js';

test('parseDecimal entende padrão brasileiro com vírgula', () => {
  assert.equal(parseDecimal('2,46'), 2.46);
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('2,00%'), 2);
});

test('fmtPct exibe percentuais digitados com vírgula', () => {
  assert.equal(fmtPct('2,46'), '2,46%');
  assert.equal(fmtPct('2,00'), '2,00%');
  assert.equal(fmtPct('0,85'), '0,85%');
});

test('formatadores monetário e numérico aceitam padrão brasileiro', () => {
  assert.match(fmtBRL('1.234,56'), /1\.234,56/);
  assert.equal(fmtNumber('1.234,56'), '1.234,56');
  assert.equal(fmtPp('0,35'), '0,35 p.p.');
});
