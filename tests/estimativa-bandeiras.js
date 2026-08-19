import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultState } from '../js/state.js';
import { brandShare, brandVolumeCents, calculateCards } from '../js/cartoes.js';
import { validateState } from '../js/validacao.js';

function setCreditRates(state, modalidade = 'Crédito à vista') {
  const brands = state.cards.modalities[modalidade].brands;
  brands.visa.taxaAtual = 2.20; brands.visa.taxaCielo = 1.90;
  brands.mastercard.taxaAtual = 2.30; brands.mastercard.taxaCielo = 2.00;
  brands.elo.taxaAtual = 2.40; brands.elo.taxaCielo = 2.10;
  brands.dinersAmex.taxaAtual = 2.80; brands.dinersAmex.taxaCielo = 2.40;
}

test('Mix estimado Brasil distribui crédito sem preenchimento manual', () => {
  const s = createDefaultState();
  s.cards.modalities['Crédito à vista'].valor = 100000;
  s.cards.faturamentoTotal = 100000;
  s.cards.detalharBandeiras = true;
  s.cards.origemMixBandeiras = 'estimativaBrasil';
  setCreditRates(s);

  assert.equal(brandVolumeCents(s, 'Crédito à vista', 'mastercard'), 5_100_000);
  assert.equal(brandVolumeCents(s, 'Crédito à vista', 'visa'), 3_100_000);
  assert.equal(brandVolumeCents(s, 'Crédito à vista', 'elo'), 1_400_000);
  assert.equal(brandVolumeCents(s, 'Crédito à vista', 'dinersAmex'), 400_000);
  assert.equal(calculateCards(s).complete, true);
  assert.equal(calculateCards(s).mixEstimated, true);
});

test('Mix estimado Brasil normaliza Débito sem Diners/Amex', () => {
  const s = createDefaultState();
  s.cards.modalities['Débito'].valor = 100000;
  s.cards.faturamentoTotal = 100000;
  s.cards.detalharBandeiras = true;
  s.cards.origemMixBandeiras = 'estimativaBrasil';
  const debit = s.cards.modalities['Débito'].brands;
  debit.visa.taxaAtual = 1.20; debit.visa.taxaCielo = 0.80;
  debit.mastercard.taxaAtual = 1.30; debit.mastercard.taxaCielo = 0.90;
  debit.elo.taxaAtual = 1.40; debit.elo.taxaCielo = 1.00;

  const total = ['visa','mastercard','elo'].reduce((sum, id) => sum + brandVolumeCents(s, 'Débito', id), 0);
  assert.equal(total, 10_000_000);
  assert.equal(brandVolumeCents(s, 'Débito', 'dinersAmex'), 0);
  assert.ok(Math.abs(brandShare(s, 'Débito', 'mastercard') - 53.125) < 0.01);
  assert.equal(calculateCards(s).complete, true);
});

test('Validação aceita estimativa e informa que o mix é estimado', () => {
  const s = createDefaultState();
  s.meta.cliente = 'Empresa Teste';
  s.cards.modalities['Crédito à vista'].valor = 100000;
  s.cards.faturamentoTotal = 100000;
  s.cards.detalharBandeiras = true;
  s.cards.origemMixBandeiras = 'estimativaBrasil';
  setCreditRates(s);

  const validation = validateState(s);
  const mix = validation.checks.find((c) => c.label === 'Distribuição por bandeira');
  assert.equal(mix.level, 'ok');
  assert.match(mix.message, /estimada automaticamente/i);
});
