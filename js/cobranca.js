import { parseDecimal, toCents } from './formatters.js';

export function calculateCollection(state) {
  const detail = (state.collection.itens || []).map((item) => {
    const qtd = Math.max(0, Math.floor(parseDecimal(item.quantidade) ?? 0));
    const atual = qtd * (toCents(item.tarifaAtual) ?? 0);
    const proposta = qtd * (toCents(item.tarifaProposta) ?? 0);
    return {
      ...item,
      quantidade: qtd,
      custoAtualCents: atual,
      custoCieloCents: proposta,
      impactoMensalCents: atual - proposta,
      impacto12Cents: (atual - proposta) * 12
    };
  });
  const atual = detail.reduce((s, r) => s + r.custoAtualCents, 0);
  const proposta = detail.reduce((s, r) => s + r.custoCieloCents, 0);
  return {
    detail,
    custoAtualCents: atual,
    custoCieloCents: proposta,
    impactoMensalCents: atual - proposta,
    impacto12Cents: (atual - proposta) * 12,
    boletosEmitidos: Math.max(0, Math.floor(parseDecimal(state.collection.boletosEmitidos) ?? 0)),
    boletosLiquidados: Math.max(0, Math.floor(parseDecimal(state.collection.boletosLiquidados) ?? 0)),
    recebimentosElegiveisCents: toCents(state.collection.recebimentosElegiveis) ?? 0,
    bbPayElegivelCents: toCents(state.collection.bbPayElegivel) ?? 0
  };
}
