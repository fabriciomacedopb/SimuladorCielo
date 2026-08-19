import { microCentsToCents, parseDecimal, rateToUnits, toCents } from './formatters.js';

function sideCostCents(pix, side) {
  const cfg = pix[side];
  const volumeCents = toCents(pix.volumeMensal) ?? 0;
  const qtd = Math.max(0, Math.floor(parseDecimal(pix.transacoesMes) ?? 0));
  if (volumeCents <= 0 || qtd <= 0) return 0;

  const tetoCents = toCents(cfg.teto);
  if (cfg.tipo === 'valorFixo') {
    const fixedCents = toCents(cfg.valorFixo) ?? 0;
    return fixedCents * qtd;
  }

  if (cfg.tipo === 'percentual' || cfg.tipo === 'percentualTeto') {
    const rateUnits = rateToUnits(cfg.percentual) ?? 0;
    if (cfg.tipo === 'percentualTeto' && tetoCents && tetoCents > 0) {
      const avgTicketCents = volumeCents / qtd;
      const perTxMicro = avgTicketCents * rateUnits;
      const cappedPerTxMicro = Math.min(perTxMicro, tetoCents * 1_000_000);
      return microCentsToCents(cappedPerTxMicro * qtd);
    }
    return microCentsToCents(volumeCents * rateUnits);
  }

  return 0;
}

export function calculatePix(state) {
  const atual = sideCostCents(state.pix, 'atual');
  const proposta = sideCostCents(state.pix, 'proposta');
  const impacto = atual - proposta;
  return {
    volumeCents: toCents(state.pix.volumeMensal) ?? 0,
    transacoes: Math.max(0, Math.floor(parseDecimal(state.pix.transacoesMes) ?? 0)),
    custoAtualCents: atual,
    custoCieloCents: proposta,
    impactoMensalCents: impacto,
    impacto12Cents: impacto * 12
  };
}
