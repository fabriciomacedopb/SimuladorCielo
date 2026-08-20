import { BANDEIRAS } from '../config/parametros.js';
import { calculateAll } from './calculos.js';
import { escapeHtml, fmtBRLFromCents, fmtCompactCents, fmtDateBR, fmtPct, fmtPp, resultLabel } from './formatters.js';
import { printView } from './print.js';
import { renderRateLineCharts } from './rate-charts.js';
import { validateState } from './validacao.js';

function brandLabel(row, detailed) {
  if (!detailed) return '<span class="payment-brand brand-general">Condição geral</span>';
  const brand = BANDEIRAS.find((b) => b.id === row.brandId);
  return brand ? `<span class="payment-brand brand-logo brand-${brand.id}" title="${escapeHtml(brand.nome)}"><img src="${brand.logo}" alt="${escapeHtml(brand.nome)}"></span>` : escapeHtml(row.bandeira);
}

function rateDifference(row) {
  if (row.taxaAtual === null || row.taxaCielo === null) return { text: '—', cls: '' };
  const diff = row.taxaAtual - row.taxaCielo;
  return { text: `${diff > 0 ? '▼' : diff < 0 ? '▲' : '='} ${fmtPp(Math.abs(diff))}`, cls: diff > 0 ? 'positive' : diff < 0 ? 'negative' : '' };
}

function printCostVisual(state, results) {
  const current = results.totals.currentCents ?? 0;
  const proposed = results.totals.proposedCents ?? 0;
  const max = Math.max(current, proposed, 1);
  const rows = [
    { label: state.meta.solucaoAtual || 'Cenário atual', value: current, cls: 'current' },
    { label: 'Solução proposta', value: proposed, cls: 'proposed' }
  ];
  return `<article class="print-chart-card"><div class="print-chart-title"><span>COMPARATIVO DE CUSTO</span><strong>Custo mensal consolidado</strong></div>${rows.map((r) => `<div class="print-cost-row"><div><span>${escapeHtml(r.label)}</span><strong>${fmtBRLFromCents(r.value)}</strong></div><div class="print-bar-track"><i class="${r.cls}" style="width:${Math.max(2, r.value / max * 100)}%"></i></div></div>`).join('')}</article>`;
}

function printComponentVisual(results) {
  const rows = results.components.map((c) => ({ name: c.name, value: c.impactoMensalCents ?? 0 })).filter((r) => r.value !== 0);
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return `<article class="print-chart-card"><div class="print-chart-title"><span>COMPOSIÇÃO DO RESULTADO</span><strong>Impacto mensal por componente</strong></div><div class="print-component-bars">${(rows.length ? rows : [{ name: 'Aguardando dados', value: 0 }]).map((r) => `<div class="print-component-row"><span>${escapeHtml(r.name)}</span><div class="print-bar-track slim"><i class="${r.value > 0 ? 'positive' : r.value < 0 ? 'negative' : 'neutral'}" style="width:${r.value === 0 ? 0 : Math.max(3, Math.abs(r.value) / max * 100)}%"></i></div><strong class="${r.value > 0 ? 'positive' : r.value < 0 ? 'negative' : ''}">${r.value === 0 ? '—' : fmtBRLFromCents(r.value)}</strong></div>`).join('')}</div></article>`;
}

export function renderFinancialResults(ctx) {
  const { state, $, statusBadge } = ctx;

  function renderPage() {
    const main = $('#main');
    const results = calculateAll(state);
    const validation = validateState(state);
    const detailed = state.cards.detalharBandeiras !== false;
    const detail = results.cards.detail.filter((r) => r.volumeCents > 0 || r.taxaAtual !== null || r.taxaCielo !== null);
    const ranked = detail.filter((r) => r.impactoMensalCents !== null).sort((a, b) => Math.abs(b.impactoMensalCents) - Math.abs(a.impactoMensalCents));
    const rateCharts = renderRateLineCharts(state, { detailed, title: 'Curva de taxas Atual × Cielo', subtitle: 'Leitura visual das condições comerciais ao longo das modalidades.' });
    const economies = rankingList(ranked.filter((x) => x.impactoMensalCents > 0), detailed);
    const increases = rankingList(ranked.filter((x) => x.impactoMensalCents < 0), detailed);
    const absolutes = rankingList(ranked, detailed);

    main.innerHTML = `<section class="results-page">
      <header class="print-only results-print-header">
        <img src="assets/bb.svg" alt="Banco do Brasil">
        <div><span>RESULTADO FINANCEIRO DA SOLUÇÃO</span><h1>Análise de eficiência em meios de pagamento</h1><p>${escapeHtml(state.meta.cliente || 'Cliente')}</p></div>
        <img src="assets/cielo.svg" alt="Cielo">
      </header>
      <div class="print-only results-print-meta"><span><b>Solução atual:</b> ${escapeHtml(state.meta.solucaoAtual || '—')}</span><span><b>Análise:</b> ${fmtDateBR(state.meta.dataAnalise)}</span><span><b>Validade:</b> ${fmtDateBR(state.meta.validade)}</span></div>

      <div class="page-heading"><div><span class="eyebrow">RESULTADO FINANCEIRO DA SOLUÇÃO</span><h1>Detalhamento das condições e impactos</h1><p>${detailed ? 'Consolidação por produto, modalidade e bandeira.' : 'Consolidação por produto e modalidade, sem detalhamento por bandeira.'}</p></div><div class="print-page-actions no-print">${statusBadge(validation.overall)}<button class="btn btn-primary" id="btnPrintResults">Imprimir resultado / PDF</button></div></div>

      <div class="result-kpis"><article><span>Volume mensal analisado</span><strong>${results.cards.totalVolumeCents ? fmtCompactCents(results.cards.totalVolumeCents) : '—'}</strong></article><article><span>Cenário atual</span><strong>${results.totals.currentCents === null ? '—' : fmtCompactCents(results.totals.currentCents)}</strong></article><article><span>Solução proposta</span><strong>${results.totals.proposedCents === null ? '—' : fmtCompactCents(results.totals.proposedCents)}</strong></article><article class="hero"><span>${(results.totals.impact12Cents ?? 0) >= 0 ? 'Economia em 12 meses' : 'Impacto em 12 meses'}</span><strong>${results.totals.impact12Cents === null ? '—' : fmtCompactCents(Math.abs(results.totals.impact12Cents))}</strong></article></div>

      <div class="print-only results-print-visuals">${printCostVisual(state, results)}${printComponentVisual(results)}</div>

      <article class="panel result-consolidated-panel"><div class="panel-heading"><h2>Resultado consolidado por produto</h2></div><div class="table-scroll"><table class="pro-table"><thead><tr><th>Produto</th><th>Custo atual</th><th>Custo proposto</th><th>Impacto mensal</th><th>Impacto 12 meses</th><th>Resultado</th></tr></thead><tbody>${results.components.map((c) => { const a = c.custoAtualCents ?? c.mensalidadeAtualCents, b = c.custoCieloCents ?? c.mensalidadeEfetivaCents, d = c.impactoMensalCents; return `<tr><td>${escapeHtml(c.name)}</td><td>${a === null ? '—' : fmtBRLFromCents(a)}</td><td>${b === null ? '—' : fmtBRLFromCents(b)}</td><td class="${(d ?? 0) >= 0 ? 'positive' : 'negative'}">${d === null ? '—' : fmtBRLFromCents(d)}</td><td>${d === null ? '—' : fmtBRLFromCents(d * 12)}</td><td>${resultLabel(d)}</td></tr>`; }).join('')}</tbody></table></div></article>

      <div class="ranking-grid print-only results-print-rankings"><article class="panel"><div class="panel-heading"><h2>Maiores economias</h2></div>${economies}</article><article class="panel"><div class="panel-heading"><h2>Maiores acréscimos</h2></div>${increases}</article><article class="panel"><div class="panel-heading"><h2>Maiores impactos absolutos</h2></div>${absolutes}</article></div>

      <div class="results-rate-charts">${rateCharts}</div>

      <article class="panel result-detail-panel"><div class="panel-heading"><h2>${detailed ? 'Detalhamento por bandeira' : 'Condições gerais por modalidade'}</h2><span>${detailed ? 'Modalidade + bandeira' : 'Modalidade + condição geral'}</span></div><div class="table-scroll"><table class="pro-table"><thead><tr><th>Modalidade</th><th>${detailed ? 'Bandeira' : 'Tipo'}</th><th>Volume</th><th>Condição atual</th><th>Condição Cielo</th><th>Dif. taxa</th><th>Custo atual</th><th>Custo Cielo</th><th>Benefício / impacto mês</th><th>Benefício / impacto 12 meses</th><th>Resultado</th></tr></thead><tbody>${detail.map((r) => { const diff = rateDifference(r); return `<tr><td>${escapeHtml(r.modalidade)}</td><td>${brandLabel(r, detailed)}</td><td>${fmtBRLFromCents(r.volumeCents)}</td><td>${fmtPct(r.taxaAtual)}</td><td>${fmtPct(r.taxaCielo)}</td><td class="${diff.cls}">${diff.text}</td><td>${r.custoAtualCents === null ? '—' : fmtBRLFromCents(r.custoAtualCents)}</td><td>${r.custoCieloCents === null ? '—' : fmtBRLFromCents(r.custoCieloCents)}</td><td class="${(r.impactoMensalCents ?? 0) >= 0 ? 'positive' : 'negative'}">${r.impactoMensalCents === null ? '—' : fmtBRLFromCents(r.impactoMensalCents)}</td><td class="${(r.impacto12Cents ?? 0) >= 0 ? 'positive' : 'negative'}">${r.impacto12Cents === null ? '—' : fmtBRLFromCents(r.impacto12Cents)}</td><td>${resultLabel(r.impactoMensalCents)}</td></tr>`; }).join('')}</tbody></table></div></article>

      <div class="ranking-grid screen-ranking-grid"><article class="panel"><div class="panel-heading"><h2>Maiores economias</h2></div>${economies}</article><article class="panel"><div class="panel-heading"><h2>Maiores acréscimos</h2></div>${increases}</article><article class="panel"><div class="panel-heading"><h2>Maiores impactos absolutos</h2></div>${absolutes}</article></div>
      <p class="print-only print-note">Resultado financeiro com visão executiva, curvas de taxas e detalhamento por modalidade e bandeira. Valores são estimativas baseadas nas premissas informadas.</p>
    </section>`;

    $('#btnPrintResults')?.addEventListener('click', () => printView('results'));
  }

  function rankingList(rows, detailed) {
    return `<div class="ranking-list">${rows.slice(0, 5).map((r, i) => { const brand = BANDEIRAS.find((b) => b.id === r.brandId); return `<div><i>${i + 1}</i><span><b>${detailed && brand ? `<span class="ranking-brand"><img src="${brand.logo}" alt="${escapeHtml(brand.nome)}"> ${escapeHtml(r.modalidade)}</span>` : escapeHtml(r.modalidade)}</b><small>${fmtBRLFromCents(r.impactoMensalCents)} / mês</small></span></div>`; }).join('') || '<p class="empty-state">Nenhum item neste grupo.</p>'}</div>`;
  }

  renderPage();
}
