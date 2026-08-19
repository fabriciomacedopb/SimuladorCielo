import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultState } from '../js/state.js';
import { calculateBenefits } from '../js/beneficios.js';

test('Benefícios: estratifica pontos e sinaliza potencial estimado para Livelo', () => {
  const s = createDefaultState();
  const r = calculateBenefits(s, { cardsVolumeCents: 10_000_000 }); // R$ 100 mil em Cielo

  assert.equal(r.cielo, 1000);
  assert.equal(r.pix, 0);
  assert.equal(r.cobranca, 0);
  assert.equal(r.mensal, 1000);
  assert.equal(r.anual, 12000);
  assert.equal(r.livelo.potencialTransferenciaMensal, 1000);
  assert.equal(r.livelo.minimoTransferenciaPontos, 1000);
  assert.equal(r.livelo.limiteTransferenciaMensalPontos, 500000);
  assert.equal(r.livelo.atendeMinimoTransferencia, true);
});

test('Benefícios: potencial Livelo permanece estimativa e não altera total financeiro', () => {
  const s = createDefaultState();
  s.pix.volumeMensal = 500000;
  const r = calculateBenefits(s, { cardsVolumeCents: 0 });

  assert.equal(r.pix, 1000);
  assert.equal(r.mensal, 1000);
  assert.equal(r.livelo.pontosEstimadosMensal, r.mensal);
  assert.equal(r.livelo.pontosEstimados12M, r.anual);
});
