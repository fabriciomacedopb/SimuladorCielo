import { BANDEIRAS, ESTIMATIVA_BANDEIRAS_BRASIL, INFORMACOES_IMPORTANTES, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtCompactCents, fmtDateBR, fmtPct, fmtPoints, toCents } from './formatters.js';

function proposalNarrative(results) {
  const t = results.totals;
  if (t.impactMonthlyCents === null) return 'A proposta ainda possui dados pendentes de validação antes da consolidação financeira.';
  if (t.impactMonthlyCents > 0) return `A solução proposta apresenta economia estimada de ${fmtBRLFromCents(t.impactMonthlyCents)} por mês e ${fmtBRLFromCents(t.impact12Cents)} em 12 meses.`;
  if (t.impactMonthlyCents < 0) return `No cenário analisado, a solução representa impacto adicional estimado de ${fmtBRLFromCents(Math.abs(t.impactMonthlyCents))} por mês e ${fmtBRLFromCents(Math.abs(t.impact12Cents))} em 12 meses.`;
  return 'No cenário analisado, os custos consolidados permanecem equivalentes.';
}

function summaryCard(label, value, cls = '') {
  return `<div class="proposal-kpi ${cls}"><span>${label}</span><strong>${value}</strong></div>`;
}

function composition(results) {
  return results.components.map((c) => {
    const v = c.impactoMensalCents;
    const cls = v === null ? '' : v > 0 ? 'positive' : v < 0 ? 'negative' : 'neutral';
    return `<div class="proposal-impact-row"><span>${escapeHtml(c.name)}</span><strong class="${cls}">${v === null || v === 0 ? '—' : fmtBRLFromCents(v)}</strong></div>`;
  }).join('');
}

function brandBadge(brand) {
  return `<span class="payment-brand brand-logo brand-${brand.id}" title="${escapeHtml(brand.nome)}"><img src="${brand.logo}" alt="${escapeHtml(brand.nome)}"></span>`;
}

function compactRates(state) {
  return BANDEIRAS.map((brand) => {
    const rows = MODALIDADES.filter((m) => activeBrandsFor(m).some((b) => b.id === brand.id)).map((m) => {
      const cell = state.cards.modalities[m].brands[brand.id];
      return `<tr><td>${escapeHtml(m)}</td><td>${fmtPct(cell.taxaAtual)}</td><td>${fmtPct(cell.taxaCielo)}</td></tr>`;
    }).join('');
    return `<div class="proposal-rate-brand"><div class="proposal-rate-head">${brandBadge(brand)}<span>Atual</span><span>Cielo</span></div><table><tbody>${rows}</tbody></table></div>`;
  }).join('');
}

function compactGeneralRates(state) {
  const rows = MODALIDADES.map((m) => {
    const cell = state.cards.modalities[m];
    return `<tr><td>${escapeHtml(m)}</td><td>${fmtPct(cell.taxaAtualGeral)}</td><td>${fmtPct(cell.taxaCieloGeral)}</td></tr>`;
  }).join('');
  return `<div class="proposal-rate-brand general"><div class="proposal-rate-head"><span class="payment-brand brand-general">Condição geral</span><span>Atual</span><span>Cielo</span></div><table><tbody>${rows}</tbody></table></div>`;
}

function equipmentSection(results) {
  const rows = (results.equipment?.detail || []).filter((item) => item.qtdAtual > 0 || item.qtdProposta > 0 || item.custoAtualCents > 0 || item.custoCieloCents > 0);
  if (!rows.length) return '';
  return `<section class="proposal-equipment"><div class="proposal-section-heading"><div><span>EQUIPAMENTOS E TERMINAIS</span><h2>Comparativo de custos</h2></div><div class="equipment-total"><span>Impacto mensal estimado</span><strong class="${results.equipment.impactoMensalCents>0?'positive':results.equipment.impactoMensalCents<0?'negative':''}">${results.equipment.impactoMensalCents ? fmtBRLFromCents(results.equipment.impactoMensalCents) : '—'}</strong></div></div><div class="proposal-equipment-scroll"><table class="proposal-equipment-table"><thead><tr><th>Equipamento</th><th>Qtd. atual</th><th>Mens. unitária atual</th><th>Qtd. proposta</th><th>Mens. unitária proposta</th><th>Custo atual/mês</th><th>Custo proposta/mês</th><th>Diferença/mês</th><th>Em 12 meses</th></tr></thead><tbody>${rows.map((item)=>`<tr><td><strong>${escapeHtml(item.tipo)}</strong>${item.qtdIsenta>0?`<small>${item.qtdIsenta} un. isenta(s) na proposta</small>`:''}</td><td>${item.qtdAtual}</td><td>${fmtBRLFromCents(toCents(item.mensalidadeAtual) ?? 0)}</td><td>${item.qtdProposta}</td><td>${fmtBRLFromCents(toCents(item.mensalidadeProposta) ?? 0)}</td><td>${fmtBRLFromCents(item.custoAtualCents)}</td><td>${fmtBRLFromCents(item.custoCieloCents)}</td><td class="${item.impactoMensalCents>0?'positive':item.impactoMensalCents<0?'negative':''}">${item.impactoMensalCents ? fmtBRLFromCents(item.impactoMensalCents) : '—'}</td><td>${item.impacto12Cents ? fmtBRLFromCents(item.impacto12Cents) : '—'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function liveloBenefit(results) {
  const b = results.benefits;
  const livelo = b.livelo;
  return `<div class="proposal-livelo"><div class="proposal-livelo-title"><span>Benefícios BB Empresas · estimativa de pontos</span><strong>${fmtPoints(b.mensal)} / mês</strong><small>${fmtPoints(b.anual)} em 12 meses</small></div><div class="proposal-points-breakdown"><span>Cielo <b>${fmtPoints(b.cielo)}</b></span><span>Pix <b>${fmtPoints(b.pix)}</b></span><span>Cobrança <b>${fmtPoints(b.cobranca)}</b></span><span>Outros <b>${fmtPoints(b.outros)}</b></span></div><div class="proposal-livelo-transfer"><span>Potencial estimado para transferência ao Programa Livelo</span><strong>${fmtPoints(livelo.potencialTransferenciaMensal)} / mês</strong><small>Estimativa sujeita à elegibilidade, disponibilidade dos pontos e às regras e limites vigentes. As condições podem ser alteradas. Pontos não compõem a economia financeira em R$.</small></div></div>`;
}

export function renderProposal(container, state, results) {
  const t = results.totals;
  const impactPositive = (t.impactMonthlyCents ?? 0) >= 0;
  const detailed = state.cards.detalharBandeiras !== false;
  const packageText = results.package.statusValidacao === 'NÃO ELEGÍVEL'
    ? 'Mais Vantagens: benefício não considerado por não elegibilidade.'
    : results.package.considerarBeneficio
      ? `Mais Vantagens: mensalidade efetiva estimada de ${fmtBRLFromCents(results.package.mensalidadeEfetivaCents)} com desconto aplicado de ${fmtPct(results.package.descontoAplicado * 100, 0)}.${results.package.statusValidacao === 'A VALIDAR' ? ' Benefício estimado sujeito à validação e contratação.' : ''}`
      : `Mais Vantagens: benefício não considerado na simulação; mensalidade proposta de ${fmtBRLFromCents(results.package.mensalidadeEfetivaCents)}.`;

  const estimatedMixNotice = results.cards.mixEstimated
    ? `<aside class="proposal-estimated-mix"><strong>Mix por bandeira estimado</strong><span>A distribuição do faturamento entre as bandeiras foi estimada com base em uma referência nacional de mercado (${escapeHtml(ESTIMATIVA_BANDEIRAS_BRASIL.referencia)}), pois o mix real do cliente não foi informado. Essa premissa influencia os valores de economia/impacto e deve ser substituída pelo mix real quando disponível.</span></aside>`
    : '';

  container.innerHTML = `
    <section class="client-sheet proposal-sheet" id="proposalPrintable">
      <header class="client-hero proposal-hero">
        <img src="assets/bb.svg" alt="Banco do Brasil" class="logo-bb">
        <div><span class="eyebrow">PROPOSTA COMERCIAL</span><h1>Uma solução personalizada para o seu negócio</h1><p>${escapeHtml(state.meta.cliente || 'Cliente')}</p></div>
        <img src="assets/cielo.svg" alt="Cielo" class="logo-cielo">
      </header>
      <div class="client-meta"><span><b>CNPJ:</b> ${escapeHtml(state.meta.cnpj || '—')}</span><span><b>Solução atual:</b> ${escapeHtml(state.meta.solucaoAtual || '—')}</span><span><b>Análise:</b> ${fmtDateBR(state.meta.dataAnalise)}</span><span><b>Validade:</b> ${fmtDateBR(state.meta.validade)}</span></div>

      <div class="proposal-summary-grid">
        ${summaryCard('Volume mensal analisado', results.cards.totalVolumeCents ? fmtCompactCents(results.cards.totalVolumeCents) : '—')}
        ${summaryCard('Cenário atual', t.currentCents === null ? '—' : fmtCompactCents(t.currentCents))}
        ${summaryCard('Com a solução proposta', t.proposedCents === null ? '—' : fmtCompactCents(t.proposedCents), 'cielo')}
        ${summaryCard(impactPositive ? 'Economia mensal estimada' : 'Impacto mensal estimado', t.impactMonthlyCents === null ? '—' : fmtCompactCents(Math.abs(t.impactMonthlyCents)), impactPositive ? 'positive' : 'negative')}
        ${summaryCard(impactPositive ? 'Economia em 12 meses' : 'Impacto em 12 meses', t.impact12Cents === null ? '—' : fmtCompactCents(Math.abs(t.impact12Cents)), impactPositive ? 'positive' : 'negative')}
        ${summaryCard(impactPositive ? 'Redução no custo total' : 'Aumento no custo total', t.changePct === null ? '—' : fmtPct(Math.abs(t.changePct)))}
      </div>

      <article class="proposal-result"><span>RESULTADO DA ANÁLISE</span><strong>${proposalNarrative(results)}</strong></article>
      ${estimatedMixNotice}

      <div class="proposal-body-grid">
        <article>
          <h2>Composição do resultado</h2>
          <div class="proposal-composition">${composition(results)}</div>
          <div class="proposal-benefits"><p>${escapeHtml(packageText)}</p></div>
          ${liveloBenefit(results)}
        </article>
        <article>
          <h2>${detailed ? 'Condições comerciais por bandeira' : 'Condições comerciais gerais'}</h2>
          <div class="proposal-rate-grid ${detailed ? '' : 'single'}">${detailed ? compactRates(state) : compactGeneralRates(state)}</div>
        </article>
      </div>

      ${equipmentSection(results)}
      ${state.meta.observacoes ? `<aside class="proposal-observations"><strong>Observações comerciais</strong><p>${escapeHtml(state.meta.observacoes)}</p></aside>` : ''}
      <p class="proposal-closing">Mais eficiência na operação de pagamentos, com uma visão integrada de custos e soluções para o seu negócio.</p>
      <aside class="important-info"><strong>Informações importantes</strong>${INFORMACOES_IMPORTANTES.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</aside>
    </section>`;
}
