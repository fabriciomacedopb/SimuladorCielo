import { BANDEIRAS, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor } from './cartoes.js';
import { escapeHtml, fmtPct, parseDecimal } from './formatters.js';

const CURRENT_COLOR = '#B58A3B';
const CIELO_COLOR = '#00A8DF';
const GRID_COLOR = '#DDE6EC';
const TEXT_COLOR = '#65747E';
const NAVY = '#0B2942';

function brandBadge(brand) {
  return `<span class="payment-brand brand-logo brand-${brand.id}" title="${escapeHtml(brand.nome)}"><img src="${brand.logo}" alt="${escapeHtml(brand.nome)}"></span>`;
}

function shortLabel(modality) {
  if (modality === 'Débito') return 'Déb';
  if (modality === 'Crédito à vista') return '1x';
  return modality;
}

function seriesForBrand(state, brand) {
  return MODALIDADES
    .filter((m) => activeBrandsFor(m).some((b) => b.id === brand.id))
    .map((m) => {
      const cell = state.cards.modalities[m].brands[brand.id];
      return {
        modality: m,
        label: shortLabel(m),
        current: parseDecimal(cell.taxaAtual),
        cielo: parseDecimal(cell.taxaCielo)
      };
    });
}

function seriesGeneral(state) {
  return MODALIDADES.map((m) => ({
    modality: m,
    label: shortLabel(m),
    current: parseDecimal(state.cards.modalities[m].taxaAtualGeral),
    cielo: parseDecimal(state.cards.modalities[m].taxaCieloGeral)
  }));
}

function hasAnyRate(series) {
  return series.some((p) => p.current !== null || p.cielo !== null);
}

function pointsPath(series, key, xFor, yFor) {
  let d = '';
  let started = false;
  series.forEach((point, index) => {
    const value = point[key];
    if (value === null) {
      started = false;
      return;
    }
    const x = xFor(index);
    const y = yFor(value);
    d += `${started ? ' L' : ' M'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    started = true;
  });
  return d.trim();
}

function pointCircles(series, key, xFor, yFor, color) {
  return series.map((point, index) => {
    const value = point[key];
    if (value === null) return '';
    return `<circle cx="${xFor(index).toFixed(2)}" cy="${yFor(value).toFixed(2)}" r="2.8" fill="#fff" stroke="${color}" stroke-width="2"/>`;
  }).join('');
}

function chartSvg(series, label) {
  const W = 560;
  const H = 220;
  const left = 42;
  const right = 16;
  const top = 18;
  const bottom = 34;
  const chartW = W - left - right;
  const chartH = H - top - bottom;
  const values = series.flatMap((p) => [p.current, p.cielo]).filter((v) => v !== null && Number.isFinite(v));

  if (!values.length) {
    return `<div class="rate-chart-empty"><strong>Aguardando taxas</strong><span>Preencha as condições Atual e Cielo para visualizar a curva comparativa.</span></div>`;
  }

  const rawMax = Math.max(...values, 0.5);
  const yMax = Math.ceil((rawMax * 1.16) * 2) / 2;
  const xFor = (index) => left + (series.length <= 1 ? chartW / 2 : (index / (series.length - 1)) * chartW);
  const yFor = (value) => top + chartH - (Math.max(0, value) / yMax) * chartH;
  const gridSteps = 4;
  const grid = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const value = yMax * i / gridSteps;
    const y = yFor(value);
    return `<line x1="${left}" y1="${y.toFixed(2)}" x2="${W - right}" y2="${y.toFixed(2)}" stroke="${GRID_COLOR}" stroke-width="1"/><text x="${left - 7}" y="${(y + 3).toFixed(2)}" text-anchor="end" font-size="9" fill="${TEXT_COLOR}">${fmtPct(value, value >= 10 ? 0 : 1)}</text>`;
  }).join('');

  const labels = series.map((point, index) => `<text x="${xFor(index).toFixed(2)}" y="${H - 10}" text-anchor="middle" font-size="9" font-weight="700" fill="${TEXT_COLOR}">${escapeHtml(point.label)}</text>`).join('');
  const currentPath = pointsPath(series, 'current', xFor, yFor);
  const cieloPath = pointsPath(series, 'cielo', xFor, yFor);

  return `<svg class="rate-line-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparação de taxas Atual e Cielo para ${escapeHtml(label)}">
    <title>Taxas Atual x Cielo — ${escapeHtml(label)}</title>
    ${grid}
    <line x1="${left}" y1="${top}" x2="${left}" y2="${H - bottom}" stroke="${GRID_COLOR}" stroke-width="1"/>
    ${currentPath ? `<path d="${currentPath}" fill="none" stroke="${CURRENT_COLOR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pointCircles(series, 'current', xFor, yFor, CURRENT_COLOR)}` : ''}
    ${cieloPath ? `<path d="${cieloPath}" fill="none" stroke="${CIELO_COLOR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pointCircles(series, 'cielo', xFor, yFor, CIELO_COLOR)}` : ''}
    ${labels}
  </svg>`;
}

function chartCard(titleHtml, series, ariaLabel) {
  const filled = hasAnyRate(series);
  return `<article class="rate-line-card ${filled ? '' : 'is-empty'}">
    <header><div class="rate-chart-brand">${titleHtml}</div><div class="rate-chart-legend"><span><i class="current"></i>Atual</span><span><i class="cielo"></i>Cielo</span></div></header>
    ${chartSvg(series, ariaLabel)}
  </article>`;
}

export function renderRateLineCharts(state, options = {}) {
  const detailed = options.detailed ?? state.cards.detalharBandeiras !== false;
  const title = options.title || 'Curva de taxas por modalidade';
  const subtitle = options.subtitle || 'Comparação visual das condições Atual × Cielo ao longo das modalidades.';

  const cards = detailed
    ? BANDEIRAS.map((brand) => chartCard(brandBadge(brand), seriesForBrand(state, brand), brand.nome)).join('')
    : chartCard('<span class="payment-brand brand-general">Condição geral</span>', seriesGeneral(state), 'Condição geral');

  return `<section class="rate-chart-section ${detailed ? '' : 'single'}">
    <div class="rate-chart-heading"><div><span>EVOLUÇÃO DAS CONDIÇÕES</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><div class="rate-chart-key"><span><i style="background:${CURRENT_COLOR}"></i>Cenário atual</span><span><i style="background:${CIELO_COLOR}"></i>Cielo</span></div></div>
    <div class="rate-chart-grid">${cards}</div>
  </section>`;
}

export const RATE_CHART_COLORS = { current: CURRENT_COLOR, cielo: CIELO_COLOR, navy: NAVY };
