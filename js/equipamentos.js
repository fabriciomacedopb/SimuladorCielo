import { parseDecimal, toCents } from './formatters.js';

export function calculateEquipment(state) {
  const detail = (state.equipment || []).map((item) => {
    const qtdAtual = Math.max(0, Math.floor(parseDecimal(item.qtdAtual) ?? 0));
    const qtdProposta = Math.max(0, Math.floor(parseDecimal(item.qtdProposta) ?? 0));
    const qtdIsenta = item.isencaoAplicavel ? Math.max(0, Math.floor(parseDecimal(item.qtdIsenta) ?? 0)) : 0;
    const billableProposed = Math.max(qtdProposta - qtdIsenta, 0);
    const current = qtdAtual * (toCents(item.mensalidadeAtual) ?? 0);
    const proposed = billableProposed * (toCents(item.mensalidadeProposta) ?? 0);
    return {
      ...item,
      qtdAtual,
      qtdProposta,
      qtdIsenta,
      qtdCobradaProposta: billableProposed,
      custoAtualCents: current,
      custoCieloCents: proposed,
      impactoMensalCents: current - proposed,
      impacto12Cents: (current - proposed) * 12
    };
  });
  const atual = detail.reduce((s, r) => s + r.custoAtualCents, 0);
  const proposta = detail.reduce((s, r) => s + r.custoCieloCents, 0);
  return {
    detail,
    custoAtualCents: atual,
    custoCieloCents: proposta,
    impactoMensalCents: atual - proposta,
    impacto12Cents: (atual - proposta) * 12
  };
}
