import { microCentsToCents, rateToUnits, toCents } from './formatters.js';

export function calculateAnticipation(state) {
  if (!state.anticipation.realiza) {
    return { custoAtualCents: 0, custoCieloCents: 0, impactoMensalCents: 0, impacto12Cents: 0 };
  }
  const volume = toCents(state.anticipation.volumeMensal) ?? 0;
  const atual = microCentsToCents(volume * (rateToUnits(state.anticipation.taxaAtual) ?? 0));
  const proposta = microCentsToCents(volume * (rateToUnits(state.anticipation.taxaCielo) ?? 0));
  return {
    volumeCents: volume,
    custoAtualCents: atual,
    custoCieloCents: proposta,
    impactoMensalCents: atual - proposta,
    impacto12Cents: (atual - proposta) * 12,
    prazoMedioDias: state.anticipation.prazoMedioDias
  };
}
