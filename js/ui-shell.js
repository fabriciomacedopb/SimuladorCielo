import { escapeHtml } from './formatters.js';
import { validateState } from './validacao.js';

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function statusBadge(level, text) {
  const cls = level === 'ok' ? 'status-ok' : level === 'review' ? 'status-review' : 'status-fill';
  return `<span class="status-chip ${cls}">${level === 'ok' ? 'OK' : level === 'review' ? 'REVISAR' : 'PREENCHER'}${text ? ` · ${escapeHtml(text)}` : ''}</span>`;
}

export function input(id, label, value = '', opts = {}) {
  const type = opts.type || 'text';
  const placeholder = opts.placeholder || '';
  const help = opts.help ? `<small>${escapeHtml(opts.help)}</small>` : '';
  return `<label class="field"><span>${escapeHtml(label)}</span><input id="${id}" type="${type}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder)}" ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}>${help}</label>`;
}

export function select(id, label, value, options, help = '') {
  return `<label class="field"><span>${escapeHtml(label)}</span><select id="${id}">${options.map((o) => `<option value="${escapeHtml(o)}" ${o === value ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}</select>${help ? `<small>${escapeHtml(help)}</small>` : ''}</label>`;
}

export function segmented(name, value, options) {
  return `<div class="segmented" data-segmented="${name}">${options.map(([v, label]) => `<button type="button" class="seg ${v === value ? 'active' : ''}" data-value="${v}">${label}</button>`).join('')}</div>`;
}

export function createShell(ctx) {
  const { state, getCurrentView, setCurrentView, render, newSimulation, saveCurrent } = ctx;

  function bindCommon() {
    $$('[data-nav-view]').forEach((el) => el.addEventListener('click', () => {
      setCurrentView(el.dataset.navView);
      render();
    }));
    $('#btnPrint')?.addEventListener('click', () => {
      setCurrentView('proposal');
      render();
      setTimeout(() => window.print(), 120);
    });
    $('#btnNew')?.addEventListener('click', newSimulation);
    $('#btnSave')?.addEventListener('click', saveCurrent);
  }

  function renderShell() {
    const currentView = getCurrentView();
    const nav = [
      ['analysis', 'Análise'], ['results', 'Resultado financeiro'], ['dashboard', 'Visão financeira'], ['proposal', 'Proposta comercial'], ['saved', 'Minhas simulações']
    ];
    const validation = validateState(state);
    document.body.innerHTML = `
      <div class="app-shell">
        <header class="topbar no-print">
          <div class="brand-lockup"><div class="app-mark">P</div><div><strong>Proposta Integrada de Pagamentos</strong><span>Simulação comercial e visão financeira</span></div></div>
          <div class="top-actions"><span class="privacy-pill">Dados ficam neste navegador</span><button class="btn btn-ghost" id="btnNew">Nova análise</button><button class="btn btn-ghost" id="btnSave">Salvar simulação</button><button class="btn btn-primary" id="btnPrint">Imprimir / PDF</button></div>
        </header>
        <nav class="tabs no-print">${nav.map(([id, label]) => `<button class="tab ${currentView === id ? 'active' : ''}" data-nav-view="${id}">${label}</button>`).join('')}</nav>
        <main id="main"></main>
        <footer class="app-footer no-print"><span>Dados e cálculos permanecem localmente no navegador.</span><span>${validation.overall === 'ok' ? 'Simulação consistente' : validation.overall === 'review' ? 'Há itens para revisar' : 'Há dados pendentes'}</span></footer>
      </div>`;
    bindCommon();
  }

  return { renderShell };
}
