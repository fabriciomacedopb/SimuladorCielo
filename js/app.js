import { calculateAll } from './calculos.js';
import { renderDashboard } from './dashboard.js';
import { escapeHtml, fmtDateBR } from './formatters.js';
import { $, $$, bindSmartInputs, createShell, inlineInput, input, select, segmented, statusBadge } from './ui-shell.js';
import { renderProposal } from './proposta.js';
import { createCardSteps } from './ui-steps-cards.js';
import { createBrandSteps } from './ui-steps-brands.js';
import { createOperationsSteps } from './ui-steps-operations.js';
import { createCommercialSteps } from './ui-steps-commercial.js';
import { createFinalSteps } from './ui-steps-final.js';
import { renderFinancialResults } from './ui-results.js';
import { createSavedView } from './ui-saved.js';
import { createDefaultState } from './state.js';
import { clearDraft, loadDraft, saveDraft, saveSimulation } from './storage.js';
import { validateState } from './validacao.js';

let state = loadDraft() || createDefaultState();
let currentView = 'analysis';
let saveTimer = null;
const steps = [['Dados da proposta','Identificação e validade'],['Cartões','Volume por modalidade'],['Bandeiras','Mix e condições comerciais'],['Pix','Tarifação e volume'],['Equipamentos','POS, TEF e conectividade'],['Antecipação','Volume e condição'],['Cobrança','Eventos e tarifas'],['Mais Vantagens','Pacote, pontos e benefícios'],['Outros serviços','Itens adicionais'],['Resultado','Conferência final']];
function markDirty(){state.ui.dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(state),180)}
function mutateState(mutator){mutator(state);markDirty()}
function updateState(mutator){mutateState(mutator);render()}
function updateInputState(mutator){mutateState(mutator)}
function setStep(index){state.ui.step=Math.min(Math.max(index,0),steps.length-1);markDirty();renderAnalysis();window.scrollTo({top:0,behavior:'smooth'})}
function render(){createShell({state,getCurrentView:()=>currentView,setCurrentView:(v)=>{currentView=v},render,newSimulation,saveCurrent}).renderShell();if(currentView==='analysis')renderAnalysis();else if(currentView==='results')renderFinancialResults({state,$,statusBadge});else if(currentView==='dashboard')renderDashboard($('#main'),state,calculateAll(state));else if(currentView==='proposal')renderProposal($('#main'),state,calculateAll(state));else if(currentView==='saved')createSavedView({$, $$,getState:()=>state,setState:(next)=>{state=next},goAnalysis:()=>{currentView='analysis';render()}}).renderSaved()}
function renderAnalysis(){const main=$('#main');const validation=validateState(state);const stepCheck=validation.checks.find((c)=>c.step===state.ui.step&&c.level!=='ok')||validation.checks.find((c)=>c.step===state.ui.step);main.innerHTML=`<section class="analysis-layout"><aside class="stepper no-print"><div class="stepper-title"><span>CONFIGURAÇÃO DA ANÁLISE</span><strong>${state.meta.cliente?escapeHtml(state.meta.cliente):'Nova análise'}</strong></div>${steps.map(([title,sub],i)=>{const checks=validation.checks.filter((c)=>c.step===i);const level=checks.some((c)=>c.level==='review')?'review':checks.some((c)=>c.level==='fill')?'fill':'ok';return `<button class="step ${state.ui.step===i?'active':''}" data-step="${i}"><i>${i+1}</i><span><b>${escapeHtml(title)}</b><small>${escapeHtml(sub)}</small></span><em class="dot ${level}"></em></button>`}).join('')}</aside><section class="stage"><div class="stage-heading"><div><span class="eyebrow">ETAPA ${state.ui.step+1} DE ${steps.length}</span><h1>${escapeHtml(steps[state.ui.step][0])}</h1><p>${escapeHtml(steps[state.ui.step][1])}</p></div>${stepCheck?statusBadge(stepCheck.level,stepCheck.message):''}</div><div id="stepContent"></div><div class="stage-actions no-print"><button class="btn btn-light" id="prevStep" ${state.ui.step===0?'disabled':''}>Voltar</button><button class="btn btn-primary" id="nextStep">${state.ui.step===steps.length-1?'Abrir resultado financeiro':'Continuar'}</button></div></section></section>`;renderStepContent();$$('[data-step]').forEach((b)=>b.addEventListener('click',()=>setStep(Number(b.dataset.step))));$('#prevStep').addEventListener('click',()=>setStep(state.ui.step-1));$('#nextStep').addEventListener('click',()=>{if(state.ui.step===steps.length-1){currentView='results';render()}else setStep(state.ui.step+1)})}
function renderStepContent(){const c=$('#stepContent');const ctx={state,$,$$,updateState,updateInputState,input,inlineInput,select,segmented,statusBadge,setStep,goDashboard:()=>{currentView='dashboard';render()}};const cardSteps=createCardSteps(ctx),brandSteps=createBrandSteps(ctx),operations=createOperationsSteps(ctx),commercial=createCommercialSteps(ctx),finalSteps=createFinalSteps(ctx);const renderers=[cardSteps.stepProposal,cardSteps.stepCards,brandSteps.stepBrands,operations.stepPix,operations.stepEquipment,operations.stepAnticipation,commercial.stepCollection,commercial.stepPackage,finalSteps.stepOthers,finalSteps.stepReview];renderers[state.ui.step](c);bindSmartInputs(c)}
function saveCurrent(){const defaultName=`${state.meta.cliente||'Simulação'} - ${fmtDateBR(state.meta.dataAnalise)}`;const name=prompt('Nome da simulação:',defaultName);if(name===null)return;const record=saveSimulation(state,name||defaultName);state.meta.id=record.id;state.ui.dirty=false;saveDraft(state);alert('Simulação salva neste navegador.');render()}
function newSimulation(){if(state.ui.dirty&&!confirm('Existem alterações ainda não salvas. Deseja iniciar uma nova análise mesmo assim?'))return;state=createDefaultState();clearDraft();currentView='analysis';render()}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=2.6.1').catch(()=>{}));
render();
