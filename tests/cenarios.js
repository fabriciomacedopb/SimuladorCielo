import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultState } from '../js/state.js';
import { calculateCards, modalityVolumeCents } from '../js/cartoes.js';
import { calculatePix } from '../js/pix.js';
import { calculateEquipment } from '../js/equipamentos.js';
import { calculateBenefits } from '../js/beneficios.js';
import { calculateMaisVantagens, discountByReceipts } from '../js/mais-vantagens.js';
import { calculateAll } from '../js/calculos.js';

function minimalValidState(volume = 10000) {
  const s = createDefaultState();
  s.meta.cliente = 'Empresa Teste';
  s.meta.cnpj = '00.000.000/0001-00';
  s.cards.modoModalidades = 'valor';
  s.cards.faturamentoTotal = volume;
  s.cards.modalities['Débito'].valor = volume;
  s.cards.modoBandeiras = 'share';
  s.cards.modalities['Débito'].brands.visa.share = 100;
  s.cards.modalities['Débito'].brands.mastercard.share = 0;
  s.cards.modalities['Débito'].brands.elo.share = 0;
  s.cards.modalities['Débito'].brands.visa.taxaAtual = 1.20;
  s.cards.modalities['Débito'].brands.visa.taxaCielo = 0.78;
  s.package.tipoInstituicaoAtual = 'Sem pacote';
  s.package.statusValidacao = 'NÃO ELEGÍVEL';
  return s;
}

test('Cartões: combinação Visa Débito reproduz cálculo do gabarito', () => {
  const s = minimalValidState(10000);
  const r = calculateCards(s);
  assert.equal(r.complete, true);
  assert.equal(r.custoAtualCents, 12000);
  assert.equal(r.custoCieloCents, 7800);
  assert.equal(r.impactoMensalCents, 4200);
  assert.equal(r.impacto12Cents, 50400);
});

test('Pix: cenário do Excel R$ 220 mil, 1.000 transações, 0,49%', () => {
  const s = createDefaultState();
  s.pix.volumeMensal = 220000;
  s.pix.transacoesMes = 1000;
  s.pix.atual.tipo = 'percentual';
  s.pix.atual.percentual = 0.49;
  s.pix.proposta.tipo = 'percentual';
  s.pix.proposta.percentual = 0;
  const r = calculatePix(s);
  assert.equal(r.custoAtualCents, 107800);
  assert.equal(r.custoCieloCents, 0);
  assert.equal(r.impactoMensalCents, 107800);
});

test('Pix: percentual com teto limita custo por transação', () => {
  const s = createDefaultState();
  s.pix.volumeMensal = 100000;
  s.pix.transacoesMes = 100;
  s.pix.atual.tipo = 'percentualTeto';
  s.pix.atual.percentual = 1;
  s.pix.atual.teto = 5;
  const r = calculatePix(s);
  assert.equal(r.custoAtualCents, 50000);
});

test('Equipamentos: cenário do Excel 11 x 59,90 versus 11 x 19,90', () => {
  const s = createDefaultState();
  s.equipment = [{ id: 'pos', tipo: 'POS / Maquineta', qtdAtual: 11, mensalidadeAtual: 59.90, qtdProposta: 11, mensalidadeProposta: 19.90, isencaoAplicavel: false, qtdIsenta: 0 }];
  const r = calculateEquipment(s);
  assert.equal(r.custoAtualCents, 65890);
  assert.equal(r.custoCieloCents, 21890);
  assert.equal(r.impactoMensalCents, 44000);
});

test('Equipamentos: isenção só é aplicada quando explicitamente marcada', () => {
  const s = createDefaultState();
  s.equipment = [{ id: 'pos', tipo: 'POS', qtdAtual: 5, mensalidadeAtual: 50, qtdProposta: 5, mensalidadeProposta: 40, isencaoAplicavel: false, qtdIsenta: 5 }];
  assert.equal(calculateEquipment(s).custoCieloCents, 20000);
  s.equipment[0].isencaoAplicavel = true;
  assert.equal(calculateEquipment(s).custoCieloCents, 0);
});

test('Benefícios BB Empresas: cenário do Excel totaliza 8.440 pts/mês', () => {
  const s = minimalValidState(800000);
  s.pix.volumeMensal = 220000;
  s.collection.boletosLiquidados = 0;
  const cards = calculateCards(s);
  const r = calculateBenefits(s, { cardsVolumeCents: cards.totalVolumeCents });
  assert.equal(r.cielo, 8000);
  assert.equal(r.pix, 440);
  assert.equal(r.cobranca, 0);
  assert.equal(r.mensal, 8440);
  assert.equal(r.anual, 101280);
});

test('Mais Vantagens: faixas de recebimentos seguem a aba 06_PARAMETROS', () => {
  assert.equal(discountByReceipts('Mais Vantagens 1', 999999), 0);
  assert.equal(discountByReceipts('Mais Vantagens 1', 1000000), 0.25);
  assert.equal(discountByReceipts('Mais Vantagens 1', 3000000), 0.50);
  assert.equal(discountByReceipts('Mais Vantagens 2', 5000000), 0.50);
  assert.equal(discountByReceipts('Mais Vantagens 3', 10000000), 0.50);
  assert.equal(discountByReceipts('Mais Vantagens 3', 20000001), 1);
});

test('Mais Vantagens: maior desconto aplicável, sem soma de recebimentos e investimentos', () => {
  const s = createDefaultState();
  s.package.planoProposto = 'Mais Vantagens 3';
  s.package.mensalidadeAtual = 369;
  s.package.statusValidacao = 'VALIDADO';
  s.package.considerarBeneficio = true;
  s.package.descontoInvestimentosPct = 80;
  const r = calculateMaisVantagens(s, { cardsVolumeCents: 10_000_000, pixVolumeCents: 0, collectionEligibleCents: 0, bbPayEligibleCents: 0 });
  assert.equal(r.descontoRecebimentos, 0.50);
  assert.equal(r.descontoInvestimentos, 0.80);
  assert.equal(r.descontoAplicado, 0.80);
  assert.equal(r.mensalidadeEfetivaCents, 7380);
});

test('Mais Vantagens: acima de R$ 200 mil zera mensalidade estimada do MV3', () => {
  const s = createDefaultState();
  s.package.planoProposto = 'Mais Vantagens 3';
  s.package.mensalidadeAtual = 369;
  s.package.statusValidacao = 'A VALIDAR';
  s.package.considerarBeneficio = true;
  const r = calculateMaisVantagens(s, { cardsVolumeCents: 20_000_001, pixVolumeCents: 0, collectionEligibleCents: 0, bbPayEligibleCents: 0 });
  assert.equal(r.descontoAplicado, 1);
  assert.equal(r.mensalidadeEfetivaCents, 0);
  assert.equal(r.impactoMensalCents, 36900);
});

test('Mix por bandeira altera impacto sem alterar as taxas', () => {
  const s = createDefaultState();
  s.cards.modoModalidades = 'valor';
  s.cards.faturamentoTotal = 100000;
  s.cards.modalities['Débito'].valor = 100000;
  s.cards.modoBandeiras = 'share';
  const debit = s.cards.modalities['Débito'].brands;
  debit.visa.share = 50; debit.mastercard.share = 50; debit.elo.share = 0;
  debit.visa.taxaAtual = 1.20; debit.visa.taxaCielo = 0.78;
  debit.mastercard.taxaAtual = 1.60; debit.mastercard.taxaCielo = 0.85;
  const first = calculateCards(s).impactoMensalCents;
  debit.visa.share = 80; debit.mastercard.share = 20;
  const second = calculateCards(s).impactoMensalCents;
  assert.equal(first, 58500);
  assert.equal(second, 48600);
  assert.equal(debit.visa.taxaAtual, 1.20);
  assert.equal(debit.mastercard.taxaAtual, 1.60);
});

test('Rateio por share reconcilia centavos exatamente', () => {
  const s = createDefaultState();
  s.cards.modoModalidades = 'share';
  s.cards.faturamentoTotal = 100;
  s.cards.modalities['Débito'].share = 33.33;
  s.cards.modalities['Crédito à vista'].share = 33.33;
  s.cards.modalities['2x'].share = 33.34;
  const vols = ['Débito','Crédito à vista','2x'].map((m) => modalityVolumeCents(s,m));
  assert.deepEqual(vols, [3333,3333,3334]);
  assert.equal(vols.reduce((a,b)=>a+b,0), 10000);
});

test('Condições ausentes em combinação com volume bloqueiam consolidação', () => {
  const s = minimalValidState(10000);
  s.cards.modalities['Débito'].brands.visa.taxaCielo = null;
  const r = calculateCards(s);
  assert.equal(r.complete, false);
  assert.equal(r.custoAtualCents, null);
  assert.equal(r.custoCieloCents, null);
});

test('Consolidação geral é a soma dos componentes sem duplicação', () => {
  const s = minimalValidState(10000);
  s.pix.volumeMensal = 220000;
  s.pix.transacoesMes = 1000;
  s.pix.atual.tipo = 'percentual';
  s.pix.atual.percentual = 0.49;
  s.pix.proposta.tipo = 'percentual';
  s.pix.proposta.percentual = 0;
  s.equipment = [{id:'pos',tipo:'POS',qtdAtual:11,mensalidadeAtual:59.90,qtdProposta:11,mensalidadeProposta:19.90,isencaoAplicavel:false,qtdIsenta:0}];
  s.package.tipoInstituicaoAtual = 'Outro banco';
  s.package.mensalidadeAtual = 124.90;
  s.package.planoProposto = 'Mais Vantagens 1';
  s.package.statusValidacao = 'NÃO ELEGÍVEL';
  const r = calculateAll(s);
  const componentImpact = r.components.reduce((sum,c)=>sum+(c.impactoMensalCents??0),0);
  assert.equal(r.totals.impactMonthlyCents, componentImpact);
  assert.equal(r.totals.impactMonthlyCents, 156000);
});
