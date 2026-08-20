import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../js/state.js';
import { calculateCards } from '../js/cartoes.js';
import { calculateBenefits } from '../js/beneficios.js';
import { calculateAll } from '../js/calculos.js';

test('Cartoes: beneficio mensal e anual por taxa seguem a diferenca Atual x Cielo', () => {
  const s = createDefaultState();
  s.cards.modalities['Débito'].valor = 10000;
  s.cards.faturamentoTotal = 10000;
  s.cards.detalharBandeiras = false;
  s.cards.modalities['Débito'].taxaAtualGeral = 1.50;
  s.cards.modalities['Débito'].taxaCieloGeral = 1.00;
  const r = calculateCards(s);
  const row = r.detail.find((x) => x.modalidade === 'Débito');
  assert.equal(r.complete, true);
  assert.equal(row.impactoMensalCents, 5000);
  assert.equal(row.impacto12Cents, 60000);
  assert.equal(row.taxaAtual - row.taxaCielo, 0.5);
});

test('Livelo: referencia de R$ 70 por 1.000 pontos gera equivalencia sem somar ao resultado financeiro', () => {
  const s = createDefaultState();
  s.cards.modalities['Débito'].valor = 100000;
  s.cards.faturamentoTotal = 100000;
  s.cards.detalharBandeiras = false;
  s.cards.modalities['Débito'].taxaAtualGeral = 1.20;
  s.cards.modalities['Débito'].taxaCieloGeral = 0.80;
  s.package.tipoInstituicaoAtual = 'Sem pacote';
  s.package.statusValidacao = 'NÃO ELEGÍVEL';
  const cards = calculateCards(s);
  assert.equal(cards.complete, true);
  const b = calculateBenefits(s, { cardsVolumeCents: cards.totalVolumeCents });
  assert.equal(b.mensal, 1000);
  assert.equal(b.livelo.valorReferenciaMensalCents, 7000);
  assert.equal(b.livelo.valorReferencia12Cents, 84000);
  const total = calculateAll(s);
  assert.equal(total.ready, true);
  assert.equal(total.totals.impactMonthlyCents, 40000);
});
