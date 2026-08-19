import { BANDEIRAS, CORES_CONCORRENTES, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtCompactCents, fmtDateBR, fmtPct, fmtPoints, resultLabel } from './formatters.js';

function kpi(label, value, sub = '', tone = '') {
  const safe = value === null || value === undefined ? '—' : value;
  return `<article class="kpi-card ${tone}"><span>${label}</span><strong>${safe}</strong>${sub ? `<small>${sub}</small>` : ''}</article>`;
}

function resultNarrative(results) {
  const t = results.totals;
  if (t.impactMonthlyCents === null) return '<strong>Aguardando dados para consolidar a análise.</strong><p>Revise os itens sinalizados antes de apresentar o resultado financeiro.</p>';
  if (t.impactMonthlyCents > 0) return `<strong>Economia estimada de ${fmtBRLFromCents(t.impactMonthlyCents)} por mês</strong><p>Com base no cenário analisado, a solução proposta representa ${fmtBRLFromCents(t.impact12Cents)} em 12 meses, equivalente a ${fmtPct(Math.abs(t.changePct))} de redução no custo total considerado.</p>`;
  if (t.impactMonthlyCents < 0) return `<strong>Impacto adicional estimado de ${fmtBRLFromCents(Math.abs(t.impactMonthlyCents))} por mês</strong><p>No cenário analisado, a solução representa ${fmtBRLFromCents(Math.abs(t.impact12Cents))} em 12 meses. Os componentes do resultado devem ser avaliados em conjunto com os benefícios operacionais.</p>`;
  return '<strong>Resultado financeiro equivalente</strong><p>Os custos consolidados dos dois cenários são equivalentes nas premissas informadas.</p>';
}

function componentBars(results) {
  const rows = results.components.map((c) => ({
    name: c.name,
    impact: c.impactoMensalCents ?? null
  })).filter((r) => r.impact !== null);
  const max = Math.max(...rows.map((r) => Math.abs(r.impact)), 1);
  return rows.map((r) => {
    const width = Math.max(Math.abs(r.impact) / max * 100, r.impact === 0 ? 0 : 3);
    const cls = r.impact > 0 ? 'positive' : r.impact < 0 ? 'negative' : 'neutral';
    const sign = r.impact > 0 ? '+' : '';
    const display = r.impact === 0 ? '—' : `${sign}${fmtBRLFromCents(r.impact)}`;
    return `<div class="impact-row"><span>${escapeHtml(r.name)}</span><div class="impact-track"><i class="${cls}" style="width:${width}%"></i></div><strong class="${cls}">${display}</strong></div>`;
  }).join('');
}

function costBars(state, results) {
  const current = results.totals.currentCents ?? 0;
  const proposed = results.totals.proposedCents ?? 0;
  const max = Math.max(current, proposed, 1);
  const competitorColor = CORES_CONCORRENTES[state.meta.solucaoAtual] || '#B58A3B';
  return `
    <div class="cost-bar-row"><div class="cost-bar-label"><span>${escapeHtml(state.meta.solucaoAtual || 'Cenário atual')}</span><strong>${results.totals.currentCents === null ? '—' : fmtBRLFromCents(current)}</strong></div><div class="cost-track"><i style="width:${current / max * 100}%;background:${competitorColor}"></i></div></div>
    <div class="cost-bar-row"><div class="cost-bar-label"><span>Solução proposta</span><strong>${results.totals.proposedCents === null ? '—' : fmtBRLFromCents(proposed)}</strong></div><div class="cost-track"><i class="cielo-bar" style="width:${proposed / max * 100}%"></i></div></div>`;
}

function brandImpactCards(results) {
  return results.cards.byBrand.map((b) => `
    <article class="brand-impact-card">
      <header><span class="brand-wordmark">${escapeHtml(b.bandeira)}</span><small>${fmtPct(b.participacao)}</small></header>
      <div><span>Faturamento</span><strong>${b.volumeCents ? fmtCompactCents(b.volumeCents) : '—'}</strong></div>
      <div><span>Impacto/mês</span><strong class="${(b.impactoMensalCents ?? 0) > 0 ? 'positive' : (b.impactoMensalCents ?? 0) < 0 ? 'negative' : ''}">${!b.volumeCents || b.impactoMensalCents === null || b.impactoMensalCents === 0 ? '—' : fmtBRLFromCents(b.impactoMensalCents)}</strong></div>
      <div><span>Impacto/12m</span><strong>${!b.volumeCents || b.impacto12Cents === null || b.impacto12Cents === 0 ? '—' : fmtBRLFromCents(b.impacto12Cents)}</strong></div>
    </article>`).join('');
}

function rateMatrix(state) {
  return BANDEIRAS.map((brand) => {
    const rows = MODALIDADES.filter((m) => activeBrandsFor(m).some((b) => b.id === brand.id)).map((m) => {
      const cell = state.cards.modalities[m].brands[brand.id];
      return `<tr><td>${escapeHtml(m)}</td><td>${fmtPct(cell.taxaAtual)}</td><td>${fmtPct(cell.taxaCielo)}</td></tr>`;
    }).join('');
    return `<article class="rate-brand-card"><header><span class="brand-wordmark large">${escapeHtml(brand.nome)}</span><div><b>Atual</b><b>Cielo</b></div></header><table><tbody>${rows}</tbody></table></article>`;
  }).join('');
}

export function renderDashboard(container, state, results) {
  const t = results.totals;
  container.innerHTML = `
    <section class="client-sheet dashboard-sheet">
      <header class="client-hero">
        <img src="assets/bb.svg" alt="Banco do Brasil" class="logo-bb">
        <div><span class="eyebrow">VISÃO FINANCEIRA</span><h1>Soluções de pagamentos e eficiência financeira</h1><p>${escapeHtml(state.meta.cliente || 'Análise personalizada')}</p></div>
        <img src="assets/cielo.svg" alt="Cielo" class="logo-cielo">
      </header>
      <div class="client-meta"><span><b>Solução atual:</b> ${escapeHtml(state.meta.solucaoAtual || '—')}</span><span><b>Data:</b> ${fmtDateBR(state.meta.dataAnalise)}</span><span><b>Validade:</b> ${fmtDateBR(state.meta.validade)}</span></div>

      <div class="section-kicker"><span>1</span><div><strong>Seu cenário hoje</strong><small>Volume e custo da operação atual.</small></div></div>
      <div class="kpi-grid">${kpi('Volume mensal analisado', results.cards.totalVolumeCents ? fmtCompactCents(results.cards.totalVolumeCents) : '—', 'Base mensal de cartões')}${kpi('Cenário atual', t.currentCents === null ? '—' : fmtCompactCents(t.currentCents), 'Custo total mensal')}${kpi('Taxa média atual', results.cards.taxaMediaAtual === null ? '—' : fmtPct(results.cards.taxaMediaAtual), 'Indicador ponderado auxiliar')}${kpi('Pontos BB Empresas / mês', results.cards.totalVolumeCents || results.pix.volumeCents || results.collection.boletosLiquidados ? fmtPoints(results.benefits.mensal) : '—', 'Não compõem economia em R$')}</div>

      <div class="section-kicker"><span>2</span><div><strong>A solução proposta</strong><small>Resultado consolidado da solução avaliada.</small></div></div>
      <div class="kpi-grid">${kpi('Com a solução proposta', t.proposedCents === null ? '—' : fmtCompactCents(t.proposedCents), 'Custo total mensal', 'cielo')}${kpi(t.impactMonthlyCents !== null && t.impactMonthlyCents >= 0 ? 'Economia mensal estimada' : 'Impacto mensal estimado', t.impactMonthlyCents === null ? '—' : fmtCompactCents(Math.abs(t.impactMonthlyCents)), '', t.impactMonthlyCents !== null && t.impactMonthlyCents < 0 ? 'negative' : 'positive')}${kpi(t.impact12Cents !== null && t.impact12Cents >= 0 ? 'Economia em 12 meses' : 'Impacto em 12 meses', t.impact12Cents === null ? '—' : fmtCompactCents(Math.abs(t.impact12Cents)), '', t.impact12Cents !== null && t.impact12Cents < 0 ? 'negative' : 'hero')}${kpi(t.changePct !== null && t.changePct >= 0 ? 'Redução no custo total' : 'Aumento no custo total', t.changePct === null ? '—' : fmtPct(Math.abs(t.changePct)), '')}</div>

      <article class="result-banner">${resultNarrative(results)}</article>

      <div class="dashboard-grid">
        <article class="panel"><div class="panel-heading"><h2>Seu custo mensal</h2><span>Atual x proposta</span></div><div class="cost-bars">${costBars(state, results)}</div></article>
        <article class="panel"><div class="panel-heading"><h2>Como o resultado é formado</h2><span>Diferença mensal por componente</span></div><div class="impact-bars">${componentBars(results)}</div></article>
      </div>

      <div class="section-kicker"><span>3</span><div><strong>Impacto por bandeira</strong><small>Faturamento, participação e contribuição financeira.</small></div></div>
      <div class="brand-impact-grid">${brandImpactCards(results)}</div>

      <div class="section-kicker"><span>4</span><div><strong>Condições comerciais por bandeira</strong><small>Condição atual e Cielo por modalidade. As médias não substituem as taxas individuais.</small></div></div>
      <div class="rate-matrix">${rateMatrix(state)}</div>
    </section>`;
}
