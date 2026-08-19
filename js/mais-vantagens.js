import { MAIS_VANTAGENS_FAIXAS_RECEBIMENTOS, MAIS_VANTAGENS_PLANOS } from '../config/parametros.js';
import { parseDecimal, toCents } from './formatters.js';

export function discountByReceipts(plan, eligibleCents) {
  const reais = (eligibleCents || 0) / 100;
  const faixa = MAIS_VANTAGENS_FAIXAS_RECEBIMENTOS.find((f) => reais >= f.min && reais <= f.max)
    || MAIS_VANTAGENS_FAIXAS_RECEBIMENTOS.at(-1);
  return faixa?.descontos?.[plan] ?? 0;
}

export function calculateMaisVantagens(state, dependencies) {
  const plan = state.package.planoProposto;
  const fullMonthlyCents = Math.round((MAIS_VANTAGENS_PLANOS[plan]?.mensalidadeCheia ?? 0) * 100);
  const currentMonthlyCents = state.package.tipoInstituicaoAtual === 'Sem pacote' && (state.package.mensalidadeAtual === null || state.package.mensalidadeAtual === '')
    ? 0
    : toCents(state.package.mensalidadeAtual);
  const eligibleCents = (dependencies.cardsVolumeCents || 0)
    + (dependencies.pixVolumeCents || 0)
    + (dependencies.collectionEligibleCents || 0)
    + (dependencies.bbPayEligibleCents || 0);

  const receiptsDiscount = discountByReceipts(plan, eligibleCents);
  const investmentsDiscount = Math.min(Math.max((parseDecimal(state.package.descontoInvestimentosPct) ?? 0) / 100, 0), 1);
  const status = state.package.statusValidacao;
  const consider = Boolean(state.package.considerarBeneficio);
  const appliedDiscount = (!plan || status === 'NÃO ELEGÍVEL' || !consider)
    ? 0
    : Math.max(receiptsDiscount, investmentsDiscount);

  const effectiveCents = Math.round(fullMonthlyCents * (1 - appliedDiscount));
  const impactCents = currentMonthlyCents === null ? null : currentMonthlyCents - effectiveCents;

  return {
    plan,
    mensalidadeCheiaCents: fullMonthlyCents,
    mensalidadeAtualCents: currentMonthlyCents,
    totalElegivelCents: eligibleCents,
    descontoRecebimentos: receiptsDiscount,
    descontoInvestimentos: investmentsDiscount,
    descontoAplicado: appliedDiscount,
    mensalidadeEfetivaCents: effectiveCents,
    impactoMensalCents: impactCents,
    impacto12Cents: impactCents === null ? null : impactCents * 12,
    statusValidacao: status,
    considerarBeneficio: consider
  };
}
