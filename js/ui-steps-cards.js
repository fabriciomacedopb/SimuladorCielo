import { MODALIDADES, SOLUCOES_ATUAIS } from '../config/parametros.js';
import { modalityShare, totalCardsVolumeCents } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtPct, toCents } from './formatters.js';

export function createCardSteps(ctx) {
  const { state, $, $$, updateState, updateInputState, input, select, inlineInput } = ctx;
  function stepProposal(c) {
    c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Dados da proposta</h2><p>Identifique o cliente e o contexto comercial da análise.</p></div></div><div class="form-grid two-cols">${input('cliente','Cliente',state.meta.cliente,{placeholder:'Empresa / grupo'})}${input('cnpj','CNPJ',state.meta.cnpj,{placeholder:'00.000.000/0000-00'})}${input('agencia','Agência',state.meta.agencia)}${input('gerente','Gerente',state.meta.gerente)}${select('solucaoAtual','Solução atual',state.meta.solucaoAtual,SOLUCOES_ATUAIS)}${input('dataAnalise','Data da análise',state.meta.dataAnalise,{type:'date'})}${input('validade','Validade da proposta',state.meta.validade,{type:'date'})}<label class="field span-2"><span>Observações</span><textarea id="observacoes" rows="4" placeholder="Informações comerciais relevantes para a proposta">${escapeHtml(state.meta.observacoes)}</textarea></label></div></article>`;
    ['cliente','cnpj','agencia','gerente','dataAnalise','validade','observacoes'].forEach((id) => $(`#${id}`).addEventListener('input', (e) => updateInputState((s) => { s.meta[id] = e.target.value; })));
    $('#solucaoAtual').addEventListener('change', (e) => updateState((s) => { s.meta.solucaoAtual = e.target.value; }));
  }
  function stepCards(c) {
    state.cards.modoModalidades = 'valor';
    const total = totalCardsVolumeCents(state); state.cards.faturamentoTotal = total / 100;
    c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Volume mensal de cartões</h2><p>Informe o faturamento mensal de cada modalidade. O total mensal e a projeção anual são calculados automaticamente.</p></div></div><div class="auto-total-grid"><div class="auto-total-card"><span>Faturamento mensal total</span><strong id="cardsMonthlyTotal">${total ? fmtBRLFromCents(total) : '—'}</strong><small>Soma automática das modalidades</small></div><div class="auto-total-card annual"><span>Faturamento anual estimado</span><strong id="cardsAnnualTotal">${total ? fmtBRLFromCents(total * 12) : '—'}</strong><small>Projeção de 12 meses</small></div></div><div class="modality-list"><div class="modality-head"><span>Modalidade</span><span>Valor mensal</span><span>Share calculado</span></div>${MODALIDADES.map((m) => { const row=state.cards.modalities[m]; return `<div class="modality-row"><strong>${m}</strong>${inlineInput(row.valor??'',{format:'currency',compact:true,attrs:`class="modal-input" data-m="${escapeHtml(m)}"`})}<span data-share-for="${escapeHtml(m)}">${total ? fmtPct(modalityShare(state,m)) : '—'}</span></div>`;}).join('')}</div></article>`;
    const refreshTotals = () => { const totalCents = totalCardsVolumeCents(state); $('#cardsMonthlyTotal').textContent = totalCents ? fmtBRLFromCents(totalCents) : '—'; $('#cardsAnnualTotal').textContent = totalCents ? fmtBRLFromCents(totalCents * 12) : '—'; $$('[data-share-for]').forEach((el) => { el.textContent = totalCents ? fmtPct(modalityShare(state, el.dataset.shareFor)) : '—'; }); };
    $$('.modal-input').forEach((el) => el.addEventListener('input', (e) => { updateInputState((s) => { s.cards.modoModalidades = 'valor'; s.cards.modalities[e.target.dataset.m].valor = e.target.value; const totalCents = MODALIDADES.reduce((sum, m) => sum + (toCents(s.cards.modalities[m].valor) ?? 0), 0); s.cards.faturamentoTotal = totalCents / 100; }); refreshTotals(); }));
  }
  return { stepProposal, stepCards };
}
