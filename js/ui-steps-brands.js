import { BANDEIRAS, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor, brandShare, brandVolumeCents, modalityVolumeCents } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtPct, parseDecimal } from './formatters.js';

export function createBrandSteps(ctx) {
  const { state, $, $$, updateState, updateInputState, segmented } = ctx;
function stepBrands(c) {
  const modalidade = state.ui.brandModalidade;
  const modalVol = modalityVolumeCents(state, modalidade);
  const active = activeBrandsFor(modalidade);
  c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Distribuição e condições por bandeira</h2><p>Separe claramente quanto passa em cada bandeira da taxa cobrada em cada combinação.</p></div><div class="metric-mini"><span>${escapeHtml(modalidade)}</span><strong>${modalVol ? fmtBRLFromCents(modalVol) : 'Sem volume'}</strong></div></div>
    <div class="brand-toolbar"><div class="modal-chips">${MODALIDADES.map((m) => `<button class="modal-chip ${m===modalidade?'active':''}" data-brand-modal="${m}">${m}</button>`).join('')}</div><div>${segmented('brandSubtab',state.ui.brandSubtab,[['distribuicao','Distribuição'],['condicoes','Condições comerciais']])}</div></div>
    ${state.ui.brandSubtab === 'distribuicao' ? brandDistributionEditor(modalidade, active) : brandRateEditor(modalidade, active)}
  </article>`;
  $$('[data-brand-modal]').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.ui.brandModalidade = b.dataset.brandModal; })));
  $$('[data-segmented="brandSubtab"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.ui.brandSubtab = b.dataset.value; })));
  if (state.ui.brandSubtab === 'distribuicao') bindBrandDistribution(modalidade); else bindBrandRates(modalidade);
}
function brandDistributionEditor(modalidade, active) {
  return `<div class="brand-mode-row"><div><span class="choice-label">Forma de distribuição por bandeira</span>${segmented('modoBandeiras',state.cards.modoBandeiras,[['share','Share'],['valor','Valor']])}</div><p class="helper-box">A distribuição informa <b>quanto do faturamento</b> passa na bandeira. Ela não altera as taxas cadastradas.</p></div>
  <div class="brand-card-grid">${active.map((b) => { const cell=state.cards.modalities[modalidade].brands[b.id]; const v=brandVolumeCents(state,modalidade,b.id); return `<article class="brand-entry"><header><span class="brand-wordmark">${b.nome}</span><small>${state.cards.modoBandeiras==='share'?(v?fmtBRLFromCents(v):'—'):fmtPct(brandShare(state,modalidade,b.id))}</small></header><label><span>${state.cards.modoBandeiras==='share'?'Share da modalidade':'Valor mensal'}</span><input class="brand-dist-input" data-brand="${b.id}" inputmode="decimal" value="${escapeHtml(state.cards.modoBandeiras==='share'?(cell.share??''):(cell.valor??''))}"></label></article>`; }).join('')}${modalidade==='Débito'?'<article class="brand-entry disabled"><header><span class="brand-wordmark">Diners/Amex</span><small>Não aplicável</small></header><p>Débito não é utilizado para Diners/Amex nesta ferramenta.</p></article>':''}</div>`;
}
function bindBrandDistribution(modalidade) {
  $$('[data-segmented="modoBandeiras"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.cards.modoBandeiras=b.dataset.value; })));
  $$('.brand-dist-input').forEach((el) => el.addEventListener('input', (e) => updateInputState((s) => {
    const cell=s.cards.modalities[modalidade].brands[e.target.dataset.brand];
    if(s.cards.modoBandeiras==='share') cell.share=e.target.value; else cell.valor=e.target.value;
  })));
}
function brandRateEditor(modalidade, active) {
  return `<div class="helper-box prominent"><b>Regra principal:</b> taxas comerciais são cadastradas por bandeira. A consolidação acontece nos valores financeiros; nenhuma média substitui Visa, Mastercard, Elo ou Diners/Amex.</div><div class="brand-rate-editor">${active.map((b)=>{const cell=state.cards.modalities[modalidade].brands[b.id];return `<article class="rate-entry"><header><span class="brand-wordmark">${b.nome}</span><small>${brandVolumeCents(state,modalidade,b.id)?fmtBRLFromCents(brandVolumeCents(state,modalidade,b.id)):'Sem volume'}</small></header><div class="rate-fields"><label><span>Condição atual (%)</span><input class="brand-rate-input" data-brand="${b.id}" data-side="taxaAtual" inputmode="decimal" value="${escapeHtml(cell.taxaAtual??'')}"></label><label><span>Condição Cielo (%)</span><input class="brand-rate-input cielo-input" data-brand="${b.id}" data-side="taxaCielo" inputmode="decimal" value="${escapeHtml(cell.taxaCielo??'')}"></label></div></article>`;}).join('')}</div>`;
}
function bindBrandRates(modalidade){ $$('.brand-rate-input').forEach((el)=>el.addEventListener('input',(e)=>updateInputState((s)=>{s.cards.modalities[modalidade].brands[e.target.dataset.brand][e.target.dataset.side]=e.target.value;}))); }

  return { stepBrands };
}