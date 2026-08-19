import { calculateAll } from './calculos.js';
import { escapeHtml, fmtCompactCents, fmtDateBR } from './formatters.js';
import { normalizeImportedState } from './state.js';
import { deleteSimulation, downloadJson, duplicateSimulation, exportCurrentSimulation, exportFullBackup, importPayload, listSimulations } from './storage.js';

export function createSavedView(ctx) {
  const { $, $$, getState, setState, goAnalysis } = ctx;
  const state = getState();
function renderSaved(){const main=$('#main'),records=listSimulations();main.innerHTML=`<section class="saved-page"><div class="page-heading"><div><span class="eyebrow">ARMAZENAMENTO LOCAL</span><h1>Minhas simulações</h1><p>As simulações ficam somente neste navegador. Exporte backups para transportar ou proteger os dados.</p></div><div class="action-group"><button class="btn btn-light" id="exportBackup">Exportar backup</button><label class="btn btn-light file-label">Importar backup<input type="file" id="importBackup" accept="application/json"></label></div></div><div class="saved-grid">${records.map((r)=>{const res=calculateAll(normalizeImportedState(r.state));return `<article class="saved-card"><div><span>${fmtDateBR(r.date)}</span><h2>${escapeHtml(r.cliente||r.name)}</h2><p>${escapeHtml(r.solucaoAtual||'—')}</p></div><div class="saved-impact"><span>Impacto em 12 meses</span><strong class="${(res.totals.impact12Cents??0)>=0?'positive':'negative'}">${res.totals.impact12Cents===null?'—':fmtCompactCents(Math.abs(res.totals.impact12Cents))}</strong></div><div class="saved-actions"><button data-open-sim="${r.id}">Abrir</button><button data-dup-sim="${r.id}">Duplicar</button><button class="danger" data-del-sim="${r.id}">Excluir</button></div></article>`;}).join('')||'<div class="empty-panel"><h2>Nenhuma simulação salva</h2><p>Use “Salvar simulação” para manter análises neste navegador.</p></div>'}</div><div class="backup-current"><button class="btn btn-light" id="exportCurrent">Exportar simulação atual em JSON</button><label class="btn btn-light file-label">Importar simulação<input type="file" id="importCurrent" accept="application/json"></label></div></section>`;
  $('#exportBackup').addEventListener('click',()=>downloadJson(`backup-simulacoes-${new Date().toISOString().slice(0,10)}.json`,exportFullBackup()));
  $('#exportCurrent').addEventListener('click',()=>downloadJson(`simulacao-${(state.meta.cliente||'analise').replace(/\W+/g,'-').toLowerCase()}.json`,exportCurrentSimulation(state)));
  $('#importBackup').addEventListener('change',(e)=>handleImportFile(e.target.files[0],true));
  $('#importCurrent').addEventListener('change',(e)=>handleImportFile(e.target.files[0],false));
  $$('[data-open-sim]').forEach((b)=>b.addEventListener('click',()=>{const r=listSimulations().find((x)=>x.id===b.dataset.openSim);if(r){setState(normalizeImportedState(r.state));goAnalysis();}}));
  $$('[data-dup-sim]').forEach((b)=>b.addEventListener('click',()=>{const copy=duplicateSimulation(b.dataset.dupSim);if(copy){setState(copy);goAnalysis();}}));
  $$('[data-del-sim]').forEach((b)=>b.addEventListener('click',()=>{if(confirm('Excluir esta simulação deste navegador?')){deleteSimulation(b.dataset.delSim);renderSaved();}}));
}

async function handleImportFile(file,backup){if(!file)return;try{const payload=JSON.parse(await file.text());const result=importPayload(payload);if(result.type==='simulation'){setState(result.state);goAnalysis();}else{alert(`${result.count} simulação(ões) importada(s).`);renderSaved();}}catch(err){alert(err.message||'Não foi possível importar o arquivo.');}}

  return { renderSaved };
}
