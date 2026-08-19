import { SCHEMA_VERSION } from '../config/parametros.js';
import { cloneState, normalizeImportedState } from './state.js';

const DRAFT_KEY = 'propostaPagamentos.draft.v2';
const SAVED_KEY = 'propostaPagamentos.saved.v2';

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? normalizeImportedState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveDraft(state) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...cloneState(state), ui: { ...state.ui, dirty: true } }));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function listSimulations() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function persistList(list) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

export function saveSimulation(state, name) {
  const list = listSimulations();
  const now = new Date().toISOString();
  const id = state.meta.id || crypto.randomUUID?.() || `${Date.now()}`;
  const record = {
    id,
    name: name || state.meta.cliente || 'Simulação sem nome',
    cliente: state.meta.cliente || '',
    date: state.meta.dataAnalise || '',
    solucaoAtual: state.meta.solucaoAtual || '',
    createdAt: list.find((x) => x.id === id)?.createdAt || now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    state: cloneState({ ...state, meta: { ...state.meta, id }, ui: { ...state.ui, dirty: false } })
  };
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) list[idx] = record; else list.unshift(record);
  persistList(list);
  return record;
}

export function deleteSimulation(id) {
  persistList(listSimulations().filter((x) => x.id !== id));
}

export function duplicateSimulation(id) {
  const source = listSimulations().find((x) => x.id === id);
  if (!source) return null;
  const copy = cloneState(source.state);
  copy.meta.id = crypto.randomUUID?.() || `${Date.now()}`;
  copy.meta.cliente = copy.meta.cliente ? `${copy.meta.cliente} — cópia` : '';
  copy.ui.dirty = true;
  return copy;
}

export function exportCurrentSimulation(state) {
  return {
    kind: 'payment-analysis-simulation',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: cloneState(state)
  };
}

export function exportFullBackup() {
  return {
    kind: 'payment-analysis-backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    simulations: listSimulations()
  };
}

export function importPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Arquivo JSON inválido.');
  if (payload.kind === 'payment-analysis-backup') {
    const sims = Array.isArray(payload.simulations) ? payload.simulations : [];
    const normalized = sims.map((r) => ({ ...r, schemaVersion: SCHEMA_VERSION, state: normalizeImportedState(r.state) }));
    persistList(normalized);
    return { type: 'backup', count: normalized.length };
  }
  if (payload.kind === 'payment-analysis-simulation' && payload.state) {
    return { type: 'simulation', state: normalizeImportedState(payload.state) };
  }
  if (payload.state) return { type: 'simulation', state: normalizeImportedState(payload.state) };
  return { type: 'simulation', state: normalizeImportedState(payload) };
}

export function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
