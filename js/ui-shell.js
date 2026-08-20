import { escapeHtml, parseDecimal } from './formatters.js';
import { printView } from './print.js';
import { validateState } from './validacao.js';

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function statusBadge(level, text) {
  const cls = level === 'ok' ? 'status-ok' : level === 'review' ? 'status-review' : 'status-fill';
  return `<span class="status-chip ${cls}">${level === 'ok' ? 'OK' : level === 'review' ? 'REVISAR' : 'PREENCHER'}${text ? ` · ${escapeHtml(text)}` : ''}</span>`;
}

function smartAffixes(format) {
  if (format === 'currency') return { prefix: 'R$', suffix: '' };
  if (format === 'percent') return { prefix: '', suffix: '%' };
  return { prefix: '', suffix: '' };
}

export function inlineInput(value = '', opts = {}) {
  const format = opts.format || '';
  const { prefix, suffix } = smartAffixes(format);
  const classes = ['input-control', opts.compact ? 'compact-control' : '', prefix ? 'has-prefix' : '', suffix ? 'has-suffix' : '', opts.className || ''].filter(Boolean).join(' ');
  const attrs = opts.attrs || '';
  const inputmode = opts.inputmode || (format === 'integer' ? 'numeric' : format ? 'decimal' : '');
  return `<div class="${classes}">${prefix ? `<span class="field-affix prefix">${prefix}</span>` : ''}<input ${attrs} ${opts.readonly ? 'readonly' : ''} ${inputmode ? `inputmode="${inputmode}"` : ''} ${format ? `data-format="${format}"` : ''} value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(opts.placeholder || '')}">${suffix ? `<span class="field-affix suffix">${suffix}</span>` : ''}</div>`;
}

export function input(id, label, value = '', opts = {}) {
  const type = opts.type || 'text';
  const placeholder = opts.placeholder || '';
  const help = opts.help ? `<small>${escapeHtml(opts.help)}</small>` : '';
  const format = opts.format || '';
  if (format) return `<label class="field"><span>${escapeHtml(label)}</span>${inlineInput(value, { format, inputmode: opts.inputmode, attrs: `id="${id}" type="${type}"`, placeholder })}${help}</label>`;
  return `<label class="field"><span>${escapeHtml(label)}</span><input id="${id}" type="${type}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder)}" ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}>${help}</label>`;
}

export function bindSmartInputs(root = document) {
  $$('[data-format]', root).forEach((el) => {
    if (el.dataset.smartBound === '1') return;
    el.dataset.smartBound = '1';
    el.dataset.rawValue = el.value ?? '';
    const kind = el.dataset.format;
    const formatDisplay = () => {
      const raw = el.dataset.rawValue ?? '';
      if (raw === '') { el.value = ''; return; }
      const parsed = parseDecimal(raw);
      if (parsed === null) return;
      if (kind === 'currency' || kind === 'percent') el.value = parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      else if (kind === 'integer') el.value = Math.max(0, Math.round(parsed)).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    };
    formatDisplay();
    el.addEventListener('focus', () => {
      el.value = el.dataset.rawValue ?? '';
      const parsed = parseDecimal(el.value);
      if (el.value === '' || parsed === 0) requestAnimationFrame(() => el.select());
    });
    el.addEventListener('input', () => { el.dataset.rawValue = el.value; });
    el.addEventListener('blur', formatDisplay);
  });
}

export function select(id, label, value, options, help = '') {
  return `<label class="field"><span>${escapeHtml(label)}</span><select id="${id}">${options.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>${help ? `<small>${escapeHtml(help)}</small>` : ''}</label>`;
}

export function segmented(name, value, options) {
  return `<div class="segmented" data-segmented="${name}">${options.map(([v, label]) => `<button type="button" class="seg ${v === value ? 'active' : ''}" data-value="${v}">${label}</button>`).join('')}</div>`;
}

export function createShell(ctx) {
  const { state, getCurrentView, setCurrentView, render, newSimulation, saveCurrent } = ctx;

  function openPdfCenter() {
    document.querySelector('#pdfCenter')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'pdfCenter';
    overlay.className = 'pdf-center-overlay no-print';
    overlay.innerHTML = `
      <section class="pdf-center-dialog" role="dialog" aria-modal="true" aria-labelledby="pdfCenterTitle">
        <header class="pdf-center-head">
          <div>
            <span>DOCUMENTOS PARA O CLIENTE</span>
            <h2 id="pdfCenterTitle">Gerar PDF</h2>
            <p>Escolha qual visão deseja imprimir ou salvar em PDF. Cada documento possui um leiaute próprio para a sua finalidade.</p>
          </div>
          <button class="pdf-center-close" type="button" data-pdf-close aria-label="Fechar">×</button>
        </header>
        <div class="pdf-center-grid">
          <article class="pdf-choice proposal">
            <span class="pdf-choice-tag">A4 retrato</span>
            <h3>Proposta Comercial</h3>
            <p>Documento de fechamento com condições, benefícios e comparativo comercial.</p>
            <ul>
              <li>Resumo financeiro</li>
              <li>Condições por bandeira</li>
              <li>Equipamentos e Livelo</li>
            </ul>
            <button class="btn btn-primary" type="button" data-pdf-view="proposal">Gerar Proposta Comercial</button>
          </article>
          <article class="pdf-choice dashboard">
            <span class="pdf-choice-tag">A4 retrato</span>
            <h3>Visão Financeira</h3>
            <p>Apresentação executiva para conduzir a conversa com o cliente de forma visual.</p>
            <ul>
              <li>KPIs e gráficos financeiros</li>
              <li>Curvas Atual × Cielo</li>
              <li>Condições por bandeira</li>
            </ul>
            <button class="btn btn-primary" type="button" data-pdf-view="dashboard">Gerar Visão Financeira</button>
          </article>
          <article class="pdf-choice results">
            <span class="pdf-choice-tag">A4 paisagem</span>
            <h3>Resultado Financeiro</h3>
            <p>Relatório analítico com consolidação de custos e detalhamento das condições.</p>
            <ul>
              <li>Resultado por produto</li>
              <li>Rankings e curvas de taxas</li>
              <li>Detalhamento financeiro</li>
            </ul>
            <button class="btn btn-primary" type="button" data-pdf-view="results">Gerar Resultado Financeiro</button>
          </article>
        </div>
        <footer class="pdf-center-foot"><b>Observação:</b> a impressão é gerada localmente pelo navegador. Selecione “Salvar como PDF” na janela de impressão.</footer>
      </section>`;
    document.body.appendChild(overlay);

    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    };
    const onKey = (event) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-pdf-close]')) close();
    });
    $$('[data-pdf-view]', overlay).forEach((button) => button.addEventListener('click', () => {
      const view = button.dataset.pdfView;
      close();
      setCurrentView(view);
      render();
      setTimeout(() => printView(view), 180);
    }));
  }

  function bindCommon() {
    $$('[data-nav-view]').forEach((el) => el.addEventListener('click', () => { setCurrentView(el.dataset.navView); render(); }));
    $('#btnPrint')?.addEventListener('click', openPdfCenter);
    $('#btnNew')?.addEventListener('click', newSimulation);
    $('#btnSave')?.addEventListener('click', saveCurrent);
  }

  function renderShell() {
    const currentView = getCurrentView();
    const nav = [['analysis', 'Análise'], ['results', 'Resultado financeiro'], ['dashboard', 'Visão financeira'], ['proposal', 'Proposta comercial'], ['saved', 'Minhas simulações']];
    const validation = validateState(state);
    document.body.innerHTML = `<div class="app-shell"><header class="topbar no-print"><div class="brand-lockup"><div class="app-mark">P</div><div><strong>Proposta Integrada de Pagamentos</strong><span>Simulação comercial e visão financeira</span></div></div><div class="top-actions"><span class="privacy-pill">Dados ficam neste navegador</span><button class="btn btn-ghost" id="btnNew">Nova análise</button><button class="btn btn-ghost" id="btnSave">Salvar simulação</button><button class="btn btn-primary" id="btnPrint">Gerar PDF</button></div></header><nav class="tabs no-print">${nav.map(([id, label]) => `<button class="tab ${currentView === id ? 'active' : ''}" data-nav-view="${id}">${label}</button>`).join('')}</nav><main id="main"></main><footer class="app-footer no-print"><span>Dados e cálculos permanecem localmente no navegador.</span><span>${validation.overall === 'ok' ? 'Simulação consistente' : validation.overall === 'review' ? 'Há itens para revisar' : 'Há dados pendentes'}</span></footer></div>`;
    bindCommon();
  }

  return { renderShell };
}
