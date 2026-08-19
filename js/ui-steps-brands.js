import { BANDEIRAS, ESTIMATIVA_BANDEIRAS_BRASIL, MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor, brandShare, brandVolumeCents, estimatedBrandShare, modalityVolumeCents } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtPct } from './formatters.js';

const RATE_RANGES = {
  '2a6': ['2x','3x','4x','5x','6x'],
  '7a12': ['7x','8x','9x','10x','11x','12x'],
  '2a12': ['2x','3x','4x','5x','6x','7x','8x','9x','10x','11x','12x']
};
const RATE_RANGE_LABELS = { '2a6': '2x a 6x', '7a12': '7x a 12x', '2a12': '2x a 12x' };

function brandBadge(brand) {
  return `<span class="payment-brand brand-logo brand-${brand.id}" title="${escapeHtml(brand.nome)}"><img src="${brand.logo}" alt="${escapeHtml(brand.nome)}"></span>`;
}

function selected(value, current) { return value === current ? 'selected' : ''; }

export function createBrandSteps(ctx) {
  const { state, $, $$, updateState, updateInputState, segmented, inlineInput } = ctx;

  function quickRateFill() {
    const detailed = state.cards.detalharBandeiras !== false;
    const range = state.ui.rateBulkRange || '2a6';
    const brand = state.ui.rateBulkBrand || 'todas';
    const current = state.ui.rateBulkCurrent ?? '';
    const cielo = state.ui.rateBulkCielo ?? '';
    const message = state.ui.rateBulkMessage || '';
    return `<div class="rate-bulk-card"><div class="rate-bulk-heading"><div><strong>Preenchimento rápido de taxas</strong><span>Repita uma condição em faixas de parcelamento e ajuste exceções individualmente depois.</span></div></div><div class="rate-bulk-grid"><label class="field"><span>Aplicar em</span><select id="rateBulkRange"><option value="2a6" ${selected('2a6',range)}>2x a 6x</option><option value="7a12" ${selected('7a12',range)}>7x a 12x</option><option value="2a12" ${selected('2a12',range)}>2x a 12x</option></select></label>${detailed ? `<label class="field"><span>Bandeira</span><select id="rateBulkBrand"><option value="todas" ${selected('todas',brand)}>Todas as bandeiras</option>${BANDEIRAS.map((b)=>`<option value="${b.id}" ${selected(b.id,brand)}>${escapeHtml(b.nome)}</option>`).join('')}</select></label>` : '<div class="read-only-field"><span>Aplicação</span><strong>Condição geral</strong></div>'}<label class="field"><span>Condição atual</span>${inlineInput(current,{format:'percent',attrs:'id="rateBulkCurrent"',placeholder:'0,00'})}</label><label class="field"><span>Taxa Cielo</span>${inlineInput(cielo,{format:'percent',attrs:'id="rateBulkCielo"',placeholder:'0,00',className:'cielo-input'})}</label><button type="button" class="btn btn-light rate-bulk-apply" id="applyRateBulk">Aplicar às modalidades</button></div>${message ? `<div class="helper-box prominent" id="rateBulkStatus"><b>${escapeHtml(message)}</b></div>` : ''}</div>`;
  }

  function detailModeChooser() {
    const detailMode = state.cards.detalharBandeiras === false ? 'geral' : 'bandeira';
    return `<div class="analysis-mode-card"><div><span class="choice-label">Detalhamento das condições</span>${segmented('brandDetailMode',detailMode,[['bandeira','Por bandeira'],['geral','Condição geral']])}</div><p><b>Por bandeira</b> permite cadastrar Visa, Mastercard, Elo e Diners/Amex com taxas diferentes. Use <b>Condição geral</b> somente quando a mesma taxa representar toda a modalidade.</p></div>`;
  }

  function mixSourceChooser() {
    const source = state.cards.origemMixBandeiras === 'estimativaBrasil' ? 'estimativaBrasil' : 'manual';
    return `<div class="analysis-mode-card mix-source-card"><div><span class="choice-label">Distribuição das vendas por bandeira</span>${segmented('mixSource',source,[['manual','Informar mix do cliente'],['estimativaBrasil','Não informar · Estimar Brasil']])}</div><p>${source === 'estimativaBrasil' ? '<b>Estimativa automática:</b> o sistema distribui o faturamento conforme uma referência nacional de uso das bandeiras. As taxas continuam sendo informadas por bandeira.' : '<b>Mix real do cliente:</b> informe por valor mensal ou, se preferir, por Share %. O sistema preserva os dados manuais caso você alterne para a estimativa.'}</p></div>`;
  }

  function distributionChooser() {
    const mode = state.cards.modoBandeiras === 'share' ? 'share' : 'valor';
    return `<div class="brand-mode-row unified"><div><span class="choice-label">Forma de informar o mix do cliente</span>${segmented('modoBandeiras',mode,[['valor','Valor mensal'],['share','Share %']])}</div><p class="helper-box">Você informa <b>uma única forma</b>: valor mensal ou share. Ao usar valor, o share é calculado automaticamente; ao usar share, o faturamento por bandeira é calculado sobre o volume da modalidade.</p></div>`;
  }

  function estimatedMixPanel(modalidade, active) {
    return `<div class="estimated-mix-panel"><div><span class="eyebrow">MIX ESTIMADO</span><strong>${escapeHtml(ESTIMATIVA_BANDEIRAS_BRASIL.referencia)}</strong><p>Utilizado somente porque o mix real do cliente não foi informado. É uma aproximação para simulação e deve ser validada quando os dados reais estiverem disponíveis.</p></div><div class="estimated-mix-list">${active.map((b)=>`<div>${brandBadge(b)}<strong>${fmtPct(estimatedBrandShare(modalidade,b.id))}</strong></div>`).join('')}</div></div>`;
  }

  function detailedBrandCards(modalidade, active) {
    const diners = BANDEIRAS.find((b)=>b.id==='dinersAmex');
    const usingEstimate = state.cards.origemMixBandeiras === 'estimativaBrasil';
    const usingShare = !usingEstimate && state.cards.modoBandeiras === 'share';
    return `<div class="brand-combined-grid">${active.map((b) => {
      const cell = state.cards.modalities[modalidade].brands[b.id];
      const volume = brandVolumeCents(state, modalidade, b.id);
      const share = brandShare(state, modalidade, b.id);
      const summary = volume ? fmtPct(share) : '—';
      const distributionField = usingEstimate
        ? `<div class="estimated-brand-volume"><span>Distribuição estimada</span><strong>${fmtPct(share)}</strong><small>${volume ? fmtBRLFromCents(volume) : '—'} na modalidade</small></div>`
        : `<label><span>${usingShare ? 'Share da modalidade' : 'Faturamento mensal na bandeira'}</span>${inlineInput(usingShare ? (cell.share??'') : (cell.valor??''),{format:usingShare?'percent':'currency',attrs:`class="brand-dist-input" data-brand="${b.id}"`})}</label>`;
      return `<article class="brand-combined-card ${usingEstimate?'estimated':''}"><header>${brandBadge(b)}<small data-brand-summary="${b.id}">${summary}</small></header><div class="brand-combined-fields">${distributionField}<label><span>Condição atual</span>${inlineInput(cell.taxaAtual??'',{format:'percent',attrs:`class="brand-rate-input" data-brand="${b.id}" data-side="taxaAtual"`})}</label><label><span>Taxa Cielo</span>${inlineInput(cell.taxaCielo??'',{format:'percent',attrs:`class="brand-rate-input cielo-input" data-brand="${b.id}" data-side="taxaCielo"`})}</label></div></article>`;
    }).join('')}${modalidade==='Débito'?`<article class="brand-combined-card disabled"><header>${brandBadge(diners)}<small>Não aplicável</small></header><div class="brand-disabled-note">Débito não é utilizado para Diners/Amex nesta ferramenta.</div></article>`:''}</div>`;
  }

  function generalEditor(modalidade) {
    const row = state.cards.modalities[modalidade];
    return `${quickRateFill()}<div class="helper-box prominent"><b>Condição geral por modalidade.</b> Estas taxas serão aplicadas ao faturamento total de ${escapeHtml(modalidade)}. Se Visa, Mastercard, Elo ou Diners/Amex tiverem condições diferentes, selecione “Por bandeira”.</div><div class="general-rate-card"><header><strong>${escapeHtml(modalidade)}</strong><small>${modalityVolumeCents(state,modalidade)?fmtBRLFromCents(modalityVolumeCents(state,modalidade)):'Sem volume'}</small></header><div class="rate-fields two-rate-fields"><label><span>Condição atual</span>${inlineInput(row.taxaAtualGeral??'',{format:'percent',attrs:'class="general-rate-input" data-side="taxaAtualGeral"'})}</label><label><span>Taxa Cielo</span>${inlineInput(row.taxaCieloGeral??'',{format:'percent',attrs:'class="general-rate-input cielo-input" data-side="taxaCieloGeral"'})}</label></div></div>`;
  }

  function detailedEditor(modalidade, active) {
    const usingEstimate = state.cards.origemMixBandeiras === 'estimativaBrasil';
    return `${mixSourceChooser()}${usingEstimate ? estimatedMixPanel(modalidade,active) : distributionChooser()}${quickRateFill()}<div class="helper-box prominent"><b>As taxas continuam por bandeira.</b> ${usingEstimate ? 'O faturamento por bandeira abaixo é estimado automaticamente; informe apenas as condições atuais e Cielo.' : 'Informe o mix do cliente e as condições atuais/Cielo. As taxas podem ser diferentes entre Visa, Mastercard, Elo e Diners/Amex.'}</div>${detailedBrandCards(modalidade, active)}`;
  }

  function bindQuickRateFill() {
    $('#rateBulkRange')?.addEventListener('change', (e) => updateInputState((s) => { s.ui.rateBulkRange = e.target.value; s.ui.rateBulkMessage = ''; }));
    $('#rateBulkBrand')?.addEventListener('change', (e) => updateInputState((s) => { s.ui.rateBulkBrand = e.target.value; s.ui.rateBulkMessage = ''; }));
    $('#rateBulkCurrent')?.addEventListener('input', (e) => updateInputState((s) => { s.ui.rateBulkCurrent = e.target.value; s.ui.rateBulkMessage = ''; }));
    $('#rateBulkCielo')?.addEventListener('input', (e) => updateInputState((s) => { s.ui.rateBulkCielo = e.target.value; s.ui.rateBulkMessage = ''; }));

    $('#applyRateBulk')?.addEventListener('click', () => {
      const range = $('#rateBulkRange')?.value || state.ui.rateBulkRange || '2a6';
      const targets = RATE_RANGES[range] || [];
      const currentEl = $('#rateBulkCurrent');
      const cieloEl = $('#rateBulkCielo');
      const current = currentEl?.dataset.rawValue ?? currentEl?.value ?? state.ui.rateBulkCurrent ?? '';
      const cielo = cieloEl?.dataset.rawValue ?? cieloEl?.value ?? state.ui.rateBulkCielo ?? '';
      if (current === '' && cielo === '') return;
      const selectedBrand = $('#rateBulkBrand')?.value || state.ui.rateBulkBrand || 'todas';
      const brandName = selectedBrand === 'todas' ? 'Todas as bandeiras' : (BANDEIRAS.find((b)=>b.id===selectedBrand)?.nome || selectedBrand);
      const label = state.cards.detalharBandeiras === false ? `Condição geral · ${RATE_RANGE_LABELS[range]}` : `${brandName} · ${RATE_RANGE_LABELS[range]}`;

      updateState((s) => {
        s.ui.rateBulkRange = range;
        s.ui.rateBulkBrand = selectedBrand;
        s.ui.rateBulkCurrent = current;
        s.ui.rateBulkCielo = cielo;
        s.ui.rateBulkMessage = `Aplicado com sucesso: ${label}. Os valores permanecem selecionados para facilitar novos ajustes.`;

        if (s.cards.detalharBandeiras === false) {
          targets.forEach((m) => {
            if (current !== '') s.cards.modalities[m].taxaAtualGeral = current;
            if (cielo !== '') s.cards.modalities[m].taxaCieloGeral = cielo;
          });
          return;
        }

        targets.forEach((m) => {
          const brands = selectedBrand === 'todas' ? activeBrandsFor(m) : activeBrandsFor(m).filter((b) => b.id === selectedBrand);
          brands.forEach((brand) => {
            if (current !== '') s.cards.modalities[m].brands[brand.id].taxaAtual = current;
            if (cielo !== '') s.cards.modalities[m].brands[brand.id].taxaCielo = cielo;
          });
        });
      });
    });
  }

  function bindDetailedInputs(modalidade) {
    $$('[data-segmented="mixSource"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.cards.origemMixBandeiras = b.dataset.value; })));

    if (state.cards.origemMixBandeiras !== 'estimativaBrasil') {
      $$('[data-segmented="modoBandeiras"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.cards.modoBandeiras = b.dataset.value; })));

      const refreshSummary = () => {
        $$('[data-brand-summary]').forEach((el) => {
          const id = el.dataset.brandSummary;
          const volume = brandVolumeCents(state, modalidade, id);
          el.textContent = volume ? fmtPct(brandShare(state, modalidade, id)) : '—';
        });
      };

      $$('.brand-dist-input').forEach((el) => el.addEventListener('input', (e) => {
        updateInputState((s) => {
          const cell = s.cards.modalities[modalidade].brands[e.target.dataset.brand];
          if (s.cards.modoBandeiras === 'share') cell.share = e.target.value;
          else cell.valor = e.target.value;
        });
        refreshSummary();
      }));
    }

    $$('.brand-rate-input').forEach((el) => el.addEventListener('input', (e) => updateInputState((s) => {
      s.cards.modalities[modalidade].brands[e.target.dataset.brand][e.target.dataset.side] = e.target.value;
    })));
  }

  function bindGeneralInputs(modalidade) {
    $$('.general-rate-input').forEach((el) => el.addEventListener('input', (e) => updateInputState((s) => {
      s.cards.modalities[modalidade][e.target.dataset.side] = e.target.value;
    })));
  }

  function stepBrands(c) {
    const modalidade = state.ui.brandModalidade;
    const modalVol = modalityVolumeCents(state, modalidade);
    const active = activeBrandsFor(modalidade);
    const detailed = state.cards.detalharBandeiras !== false;

    c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Faturamento e condições por bandeira</h2><p>Cadastre as taxas por bandeira e escolha se utilizará o mix real do cliente ou uma estimativa nacional.</p></div><div class="metric-mini"><span>${escapeHtml(modalidade)}</span><strong>${modalVol ? fmtBRLFromCents(modalVol) : 'Sem volume'}</strong></div></div><div class="brand-toolbar unified"><div class="modal-chips">${MODALIDADES.map((m) => `<button class="modal-chip ${m===modalidade?'active':''}" data-brand-modal="${m}">${m}</button>`).join('')}</div></div>${detailModeChooser()}${detailed ? detailedEditor(modalidade, active) : generalEditor(modalidade)}</article>`;

    $$('[data-brand-modal]').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.ui.brandModalidade = b.dataset.brandModal; })));
    $$('[data-segmented="brandDetailMode"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.cards.detalharBandeiras = b.dataset.value === 'bandeira'; })));

    if (detailed) bindDetailedInputs(modalidade);
    else bindGeneralInputs(modalidade);
    bindQuickRateFill();
  }

  return { stepBrands };
}
