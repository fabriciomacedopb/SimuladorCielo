import { MODALIDADES, SOLUCOES_ATUAIS } from '../config/parametros.js';
import { modalityShare, modalityVolumeCents, totalCardsVolumeCents } from './cartoes.js';
import { escapeHtml, fmtBRLFromCents, fmtPct } from './formatters.js';

export function createCardSteps(ctx) {
  const { state, $, $$, updateState, input, select, segmented } = ctx;
function stepProposal(c) {
  c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Dados da proposta</h2><p>Identifique o cliente e o contexto comercial da análise.</p></div></div><div class="form-grid two-cols">
    ${input('cliente','Cliente',state.meta.cliente,{placeholder:'Empresa / grupo'})}
    ${input('cnpj','CNPJ',state.meta.cnpj,{placeholder:'00.000.000/0000-00'})}
    ${input('agencia','Agência',state.meta.agencia)}
    ${input('gerente','Gerente',state.meta.gerente)}
    ${select('solucaoAtual','Solução atual',state.meta.solucaoAtual,SOLUCOES_ATUAIS)}
    ${input('dataAnalise','Data da análise',state.meta.dataAnalise,{type:'date'})}
    ${input('validade','Validade da proposta',state.meta.validade,{type:'date'})}
    <label class="field span-2"><span>Observações</span><textarea id="observacoes" rows="4" placeholder="Informações comerciais relevantes para a proposta">${escapeHtml(state.meta.observacoes)}</textarea></label>
  </div></article>`;
  ['cliente','cnpj','agencia','gerente','solucaoAtual','dataAnalise','validade','observacoes'].forEach((id) => {
    $(`#${id}`).addEventListener('input', (e) => updateState((s) => { s.meta[id] = e.target.value; }));
  });
}
function stepCards(c) {
  const total = totalCardsVolumeCents(state);
  c.innerHTML = `<article class="stage-card"><div class="card-heading"><div><h2>Volume mensal de cartões</h2><p>Escolha como deseja distribuir débito, crédito à vista e parcelamentos.</p></div><div class="metric-mini"><span>Total calculado</span><strong>${total ? fmtBRLFromCents(total) : '—'}</strong></div></div>
    <div class="choice-row"><div><span class="choice-label">Forma de preenchimento</span>${segmented('modoModalidades',state.cards.modoModalidades,[['share','Distribuir por share'],['valor','Informar valores']])}</div>${input('cardsTotal','Faturamento mensal total',state.cards.faturamentoTotal ?? '',{inputmode:'decimal',help:state.cards.modoModalidades==='share'?'Obrigatório no modo share.':'Opcional como referência de conciliação.'})}</div>
    <div class="modality-list"><div class="modality-head"><span>Modalidade</span><span>${state.cards.modoModalidades==='share'?'Share':'Valor mensal'}</span><span>${state.cards.modoModalidades==='share'?'Volume calculado':'Share calculado'}</span></div>${MODALIDADES.map((m) => { const row=state.cards.modalities[m]; const v=modalityVolumeCents(state,m); return `<div class="modality-row"><strong>${m}</strong><input class="modal-input" data-m="${m}" inputmode="decimal" value="${escapeHtml(state.cards.modoModalidades==='share'?(row.share??''):(row.valor??''))}" placeholder="${state.cards.modoModalidades==='share'?'0,00%':'R$ 0,00'}"><span>${state.cards.modoModalidades==='share'?(v?fmtBRLFromCents(v):'—'):fmtPct(modalityShare(state,m))}</span></div>`;}).join('')}</div>
  </article>`;
  $$('[data-segmented="modoModalidades"] .seg').forEach((b) => b.addEventListener('click', () => updateState((s) => { s.cards.modoModalidades = b.dataset.value; })));
  $('#cardsTotal').addEventListener('input', (e) => updateState((s) => { s.cards.faturamentoTotal = e.target.value; }));
  $$('.modal-input').forEach((el) => el.addEventListener('input', (e) => updateState((s) => {
    const row = s.cards.modalities[e.target.dataset.m];
    if (s.cards.modoModalidades === 'share') row.share = e.target.value; else row.valor = e.target.value;
  })));
}

  return { stepProposal, stepCards };
}
