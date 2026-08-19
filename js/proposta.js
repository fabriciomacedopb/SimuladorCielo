import { BANDEIRAS, INFORMACOES_IMPORTANTES, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtCompactCents, fmtDateBR, fmtPct, fmtPoints } from './formatters.js';

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

function compactRates(state) {
  return BANDEIRAS.map((brand) => {
    const rows = MODALIDADES.filter((m) => activeBrandsFor(m).some((b) => b.id === brand.id)).map((m) => {
      const cell = state.cards.modalities[m].brands[brand.id];
      return `<tr><td>${escapeHtml(m)}</td><td>${fmtPct(cell.taxaAtual)}</td><td>${fmtPct(cell.taxaCielo)}</td></tr>`;
    }).join('');
    return `<div class="proposal-rate-brand"><div class="proposal-rate-head"><strong>${escapeHtml(brand.nome)}</strong><span>Atual</span><span>Cielo</span></div><table><tbody>${rows}</tbody></table></div>`;
  }).join('');
}

export function renderProposal(container, state, results) {
  const t = results.totals;
  const impactPositive = (t.impactMonthlyCents ?? 0) >= 0;
  const packageText = results.package.statusValidacao === 'NÃO ELEGÍVEL'
    ? 'Mais Vantagens: benefício não considerado por não elegibilidade.'
    : results.package.considerarBeneficio
      ? `Mais Vantagens: mensalidade efetiva estimada de ${fmtBRLFromCents(results.package.mensalidadeEfetivaCents)} com desconto aplicado de ${fmtPct(results.package.descontoAplicado * 100, 0)}.${results.package.statusValidacao === 'A VALIDAR' ? ' Benefício estimado sujeito à validação e contratação.' : ''}`
      : `Mais Vantagens: benefício não considerado na simulação; mensalidade proposta de ${fmtBRLFromCents(results.package.mensalidadeEfetivaCents)}.`;

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

      <div class="proposal-body-grid">
        <article>
          <h2>Composição do resultado</h2>
          <div class="proposal-composition">${composition(results)}</div>
          <div class="proposal-benefits">
            <div><span>Benefícios BB Empresas</span><strong>${fmtPoints(results.benefits.mensal)} / mês</strong><small>${fmtPoints(results.benefits.anual)} em 12 meses. Pontos não compõem a economia financeira.</small></div>
            <p>${escapeHtml(packageText)}</p>
          </div>
        </article>
        <article>
          <h2>Condições comerciais por bandeira</h2>
          <div class="proposal-rate-grid">${compactRates(state)}</div>
        </article>
      </div>

      ${state.meta.observacoes ? `<aside class="proposal-observations"><strong>Observações comerciais</strong><p>${escapeHtml(state.meta.observacoes)}</p></aside>` : ''}
      <p class="proposal-closing">Mais eficiência na operação de pagamentos, com uma visão integrada de custos e soluções para o seu negócio.</p>
      <aside class="important-info"><strong>Informações importantes</strong>${INFORMACOES_IMPORTANTES.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</aside>
    </section>`;
}
