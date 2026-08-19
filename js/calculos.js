import { calculateAnticipation } from './antecipacao.js';
import { calculateBenefits } from './beneficios.js';
import { calculateCards } from './cartoes.js';
import { calculateCollection } from './cobranca.js';
import { calculateEquipment } from './equipamentos.js';
import { calculateMaisVantagens } from './mais-vantagens.js';
import { calculatePix } from './pix.js';
import { toCents } from './formatters.js';

function calculateOthers(state) {
  const detail = (state.others || []).map((item) => {
    const atual = toCents(item.custoAtual) ?? 0;
    const proposta = toCents(item.custoProposto) ?? 0;
    return {
      ...item,
      custoAtualCents: atual,
      custoCieloCents: proposta,
      impactoMensalCents: atual - proposta,
      impacto12Cents: (atual - proposta) * 12
    };
  });
  const atual = detail.reduce((s, r) => s + r.custoAtualCents, 0);
  const proposta = detail.reduce((s, r) => s + r.custoCieloCents, 0);
  return { detail, custoAtualCents: atual, custoCieloCents: proposta, impactoMensalCents: atual - proposta, impacto12Cents: (atual - proposta) * 12 };
}

export function calculateAll(state) {
  const cards = calculateCards(state);
  const pix = calculatePix(state);
  const equipment = calculateEquipment(state);
  const anticipation = calculateAnticipation(state);
  const collection = calculateCollection(state);
  const packageResult = calculateMaisVantagens(state, {
    cardsVolumeCents: cards.totalVolumeCents,
    pixVolumeCents: pix.volumeCents,
    collectionEligibleCents: collection.recebimentosElegiveisCents,
    bbPayEligibleCents: collection.bbPayElegivelCents
  });
  const others = calculateOthers(state);
  const benefits = calculateBenefits(state, { cardsVolumeCents: cards.totalVolumeCents });

  const components = [
    ['Cartões', cards],
    ['Pix', pix],
    ['Equipamentos', equipment],
    ['Antecipação', anticipation],
    ['Cobrança', collection],
    ['Pacote / Mais Vantagens', packageResult],
    ['Outros', others]
  ].map(([name, result]) => ({ name, ...result }));

  const allReady = cards.complete && packageResult.mensalidadeAtualCents !== null;
  const currentCents = allReady ? components.reduce((s, c) => s + (c.custoAtualCents ?? c.mensalidadeAtualCents ?? 0), 0) : null;
  const proposedCents = allReady ? components.reduce((s, c) => s + (c.custoCieloCents ?? c.mensalidadeEfetivaCents ?? 0), 0) : null;
  const impactCents = currentCents === null || proposedCents === null ? null : currentCents - proposedCents;

  return {
    ready: allReady,
    cards,
    pix,
    equipment,
    anticipation,
    collection,
    package: packageResult,
    others,
    benefits,
    components,
    totals: {
      currentCents,
      proposedCents,
      impactMonthlyCents: impactCents,
      impact12Cents: impactCents === null ? null : impactCents * 12,
      changePct: currentCents && impactCents !== null ? impactCents / currentCents * 100 : null
    }
  };
}
