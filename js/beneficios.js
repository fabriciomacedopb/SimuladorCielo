import { BENEFICIOS_BB_EMPRESAS } from '../config/parametros.js';
import { parseDecimal, toCents } from './formatters.js';

export function calculateBenefits(state, dependencies) {
  const rules = BENEFICIOS_BB_EMPRESAS;
  const cardsReais = (dependencies.cardsVolumeCents || 0) / 100;
  const cieloPts = Math.floor(cardsReais / rules.cielo.baseReais) * rules.cielo.pontos;

  const pixTotal = toCents(state.pix.volumeMensal) ?? 0;
  const pixIneligible = toCents(state.pix.pixNaoElegivel) ?? 0;
  const pixEligibleReais = Math.max(pixTotal - pixIneligible, 0) / 100;
  const pixPts = Math.min(
    Math.floor(pixEligibleReais / rules.pix.baseReais) * rules.pix.pontos,
    rules.pix.limiteMensal
  );

  const boletos = Math.max(0, Math.floor(parseDecimal(state.collection.boletosLiquidados) ?? 0));
  const cobrancaPts = boletos >= rules.cobranca.minimoBoletosLiquidados ? rules.cobranca.pontos : 0;
  const outros = Math.max(0, Math.floor(parseDecimal(state.benefits.outrosProdutosPontos) ?? 0));

  const mensal = Math.min(cieloPts + pixPts + cobrancaPts + outros, rules.limiteDemaisProdutosMensal);
  const anual = mensal * 12;
  const liveloMin = rules.livelo?.transferenciaMinimaPontos ?? 1000;
  const liveloMax = rules.livelo?.limiteTransferenciaMensalPontos ?? 500000;
  const potencialTransferenciaMensal = Math.min(mensal, liveloMax);

  return {
    cielo: cieloPts,
    pix: pixPts,
    cobranca: cobrancaPts,
    outros,
    mensal,
    anual,
    livelo: {
      pontosEstimadosMensal: mensal,
      pontosEstimados12M: anual,
      potencialTransferenciaMensal,
      minimoTransferenciaPontos: liveloMin,
      limiteTransferenciaMensalPontos: liveloMax,
      atendeMinimoTransferencia: potencialTransferenciaMensal >= liveloMin
    }
  };
}
