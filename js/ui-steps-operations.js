import { PARAMETROS_PENDENTES } from '../config/parametros.js';
import { calculateAll } from './calculos.js';
import { escapeHtml, fmtBRLFromCents } from './formatters.js';

export function createOperationsSteps(ctx) {
  const { state, $, $$, updateState, input, select } = ctx;
function pixSide(prefix, title, data) {
  const options = [
    { value: 'percentual', label: 'Percentual' },
    { value: 'valorFixo', label: 'Valor fixo' },
    { value: 'percentualTeto', label: 'Percentual com teto' }
  ];
  const selectHtml = `<label class="field"><span>Modalidade</span><select id="${prefix}Tipo">${options.map((o)=>`<option value="${o.value}" ${o.value===data.tipo?'selected':''}>${o.label}</option>`).join('')}</select></label>`;
  const percent = data.tipo !== 'valorFixo';
  const mainField = percent
    ? input(`${prefix}Percentual`,'Percentual (%)',data.percentual??'',{inputmode:'decimal'})
    : input(`${prefix}ValorFixo`,'Valor fixo por transação',data.valorFixo??'',{inputmode:'decimal'});
  const capField = data.tipo === 'percentualTeto'
    ? input(`${prefix}Teto`,'Teto por transação',data.teto??'',{inputmode:'decimal'})
    : '';
  return `<div class="subcard"><h3>${title}</h3>${selectHtml}${mainField}${capField}</div>`;
}

function stepPix(c){const r=calculateAll(state).pix;c.innerHTML=`<article class="stage-card"><div class="card-heading"><div><h2>Pix</h2><p>Compare a tarifação atual com a proposta, sem duplicar o efeito no Mais Vantagens.</p></div><div class="metric-mini"><span>Impacto mensal</span><strong>${fmtBRLFromCents(r.impactoMensalCents)}</strong></div></div><div class="form-grid three-cols">${input('pixVolume','Volume mensal Pix',state.pix.volumeMensal??'',{inputmode:'decimal'})}${input('pixQtd','Transações / mês',state.pix.transacoesMes??'',{inputmode:'numeric'})}${input('pixNaoElegivel','Pix não elegível para pontos',state.pix.pixNaoElegivel??0,{inputmode:'decimal',help:'Ex.: transferências internas ou outras parcelas não elegíveis.'})}</div><div class="comparison-grid">${pixSide('pixAtual','Cenário atual',state.pix.atual)}${pixSide('pixProposta','Solução proposta',state.pix.proposta)}</div></article>`;
  ['pixVolume','pixQtd','pixNaoElegivel'].forEach((id)=>$(`#${id}`).addEventListener('input',(e)=>updateState((s)=>{const k={pixVolume:'volumeMensal',pixQtd:'transacoesMes',pixNaoElegivel:'pixNaoElegivel'}[id];s.pix[k]=e.target.value;})));
  [['pixAtual','atual'],['pixProposta','proposta']].forEach(([prefix,side])=>{ $(`#${prefix}Tipo`).addEventListener('change',(e)=>updateState((s)=>{s.pix[side].tipo=e.target.value;})); [`Percentual`,`ValorFixo`,`Teto`].forEach((suffix)=>$(`#${prefix}${suffix}`)?.addEventListener('input',(e)=>updateState((s)=>{const k={Percentual:'percentual',ValorFixo:'valorFixo',Teto:'teto'}[suffix];s.pix[side][k]=e.target.value;}))); });
}

function stepEquipment(c){const r=calculateAll(state).equipment;c.innerHTML=`<article class="stage-card"><div class="card-heading"><div><h2>Equipamentos e conectividade</h2><p>Cadastre quantidades e mensalidades. Isenções só reduzem o custo quando forem explicitamente informadas.</p></div><div class="metric-mini"><span>Impacto mensal</span><strong>${fmtBRLFromCents(r.impactoMensalCents)}</strong></div></div><div class="equipment-list"><div class="equipment-head"><span>Equipamento</span><span>Qtd. atual</span><span>Mens. atual</span><span>Qtd. proposta</span><span>Mens. proposta</span><span>Isenção</span><span>Qtd. isenta</span></div>${state.equipment.map((item,i)=>`<div class="equipment-row"><input data-equip="${i}" data-k="tipo" value="${escapeHtml(item.tipo)}"><input data-equip="${i}" data-k="qtdAtual" inputmode="numeric" value="${item.qtdAtual??0}"><input data-equip="${i}" data-k="mensalidadeAtual" inputmode="decimal" value="${item.mensalidadeAtual??0}"><input data-equip="${i}" data-k="qtdProposta" inputmode="numeric" value="${item.qtdProposta??0}"><input data-equip="${i}" data-k="mensalidadeProposta" inputmode="decimal" value="${item.mensalidadeProposta??0}"><label class="switch"><input data-equip="${i}" data-k="isencaoAplicavel" type="checkbox" ${item.isencaoAplicavel?'checked':''}><span></span></label><input data-equip="${i}" data-k="qtdIsenta" inputmode="numeric" value="${item.qtdIsenta??0}" ${item.isencaoAplicavel?'':'disabled'}></div>`).join('')}</div><button class="btn btn-light inline-add" id="addEquipment">+ Adicionar equipamento</button></article>`;
  $$('[data-equip]').forEach((el)=>el.addEventListener(el.type==='checkbox'?'change':'input',(e)=>updateState((s)=>{const item=s.equipment[Number(e.target.dataset.equip)]; const k=e.target.dataset.k; item[k]=e.target.type==='checkbox'?e.target.checked:e.target.value;})));
  $('#addEquipment').addEventListener('click',()=>updateState((s)=>s.equipment.push({id:crypto.randomUUID?.()||`${Date.now()}`,tipo:'Outro',qtdAtual:0,mensalidadeAtual:0,qtdProposta:0,mensalidadeProposta:0,isencaoAplicavel:false,qtdIsenta:0})));
}

function stepAnticipation(c){const r=calculateAll(state).anticipation;c.innerHTML=`<article class="stage-card"><div class="card-heading"><div><h2>Antecipação de recebíveis</h2><p>O gabarito recebido utiliza Custo = Volume × Taxa. O prazo médio permanece informativo até validação de regra adicional.</p></div><div class="metric-mini"><span>Impacto mensal</span><strong>${fmtBRLFromCents(r.impactoMensalCents)}</strong></div></div><label class="big-toggle"><input id="antRealiza" type="checkbox" ${state.anticipation.realiza?'checked':''}><span>Cliente realiza antecipação</span></label><div class="form-grid three-cols ${state.anticipation.realiza?'':'muted-block'}">${select('antTipo','Tipo',state.anticipation.tipo,['Automática','Eventual'])}${input('antVolume','Volume médio mensal',state.anticipation.volumeMensal??'',{inputmode:'decimal'})}${input('antPrazo','Prazo médio (dias)',state.anticipation.prazoMedioDias??'',{inputmode:'numeric'})}${input('antAtual','Condição atual (%)',state.anticipation.taxaAtual??'',{inputmode:'decimal'})}${input('antCielo','Condição proposta (%)',state.anticipation.taxaCielo??'',{inputmode:'decimal'})}</div><div class="helper-box">${escapeHtml(PARAMETROS_PENDENTES.antecipacaoComPrazoMedio)}</div></article>`;
  $('#antRealiza').addEventListener('change',(e)=>updateState((s)=>{s.anticipation.realiza=e.target.checked;}));
  [['antTipo','tipo'],['antVolume','volumeMensal'],['antPrazo','prazoMedioDias'],['antAtual','taxaAtual'],['antCielo','taxaCielo']].forEach(([id,k])=>$(`#${id}`).addEventListener('input',(e)=>updateState((s)=>{s.anticipation[k]=e.target.value;})));
}

  return { stepPix, stepEquipment, stepAnticipation };
}
