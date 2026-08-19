import {
  BANDEIRAS,
  COBRANCA_EVENTOS_PADRAO,
  EQUIPAMENTOS_PADRAO,
  MAIS_VANTAGENS_PLANOS,
  MODALIDADES,
  SCHEMA_VERSION
} from '../config/parametros.js';

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (iso, days) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
function blankBrandCell() { return { share: null, valor: null, taxaAtual: null, taxaCielo: null }; }
function parseLegacyNumber(value) { if (value === null || value === undefined || value === '') return 0; if (typeof value === 'number') return Number.isFinite(value) ? value : 0; const raw = String(value).trim().replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, ''); const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw; const n = Number(normalized); return Number.isFinite(n) ? n : 0; }

export function createDefaultState() {
  const modalities = {};
  MODALIDADES.forEach((modalidade) => {
    modalities[modalidade] = { share: null, valor: null, taxaAtualGeral: null, taxaCieloGeral: null, brands: {} };
    BANDEIRAS.forEach((b) => { modalities[modalidade].brands[b.id] = blankBrandCell(); });
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, cliente: '', cnpj: '', agencia: '', gerente: '', solucaoAtual: 'Não informado', dataAnalise: today(), validade: plusDays(today(), 15), observacoes: '' },
    cards: { modoModalidades: 'valor', faturamentoTotal: 0, detalharBandeiras: true, modoBandeiras: 'share', modalities },
    pix: { volumeMensal: null, transacoesMes: null, pixNaoElegivel: 0, atual: { tipo: 'percentual', percentual: null, valorFixo: null, teto: null }, proposta: { tipo: 'percentual', percentual: null, valorFixo: null, teto: null } },
    equipment: EQUIPAMENTOS_PADRAO.map((tipo) => ({ id: crypto.randomUUID?.() || `${tipo}-${Math.random()}`, tipo, qtdAtual: 0, mensalidadeAtual: 0, qtdProposta: 0, mensalidadeProposta: 0, isencaoAplicavel: false, qtdIsenta: 0 })),
    anticipation: { realiza: false, tipo: 'Automática', volumeMensal: null, taxaAtual: null, taxaCielo: null, prazoMedioDias: null },
    collection: { itens: COBRANCA_EVENTOS_PADRAO.map((evento) => ({ id: crypto.randomUUID?.() || `${evento}-${Math.random()}`, evento, quantidade: 0, tarifaAtual: 0, tarifaProposta: 0 })), boletosEmitidos: 0, boletosLiquidados: 0, recebimentosElegiveis: 0, bbPayElegivel: 0 },
    package: { tipoInstituicaoAtual: 'Outro banco', instituicaoAtual: '', nomePacoteAtual: '', mensalidadeAtual: null, planoProposto: 'Mais Vantagens 1', statusValidacao: 'A VALIDAR', considerarBeneficio: true, descontoInvestimentosPct: 0 },
    others: [], benefits: { outrosProdutosPontos: 0 },
    ui: { step: 0, brandModalidade: 'Débito', brandSubtab: 'distribuicao', dirty: false }
  };
}

export function cloneState(state) { return JSON.parse(JSON.stringify(state)); }

export function normalizeImportedState(input) {
  const base = createDefaultState();
  if (!input || typeof input !== 'object') return base;
  const legacyMode = input.cards?.modoModalidades;
  const legacyTotal = parseLegacyNumber(input.cards?.faturamentoTotal);
  const merged = {
    ...base, ...input,
    meta: { ...base.meta, ...(input.meta || {}) },
    cards: { ...base.cards, ...(input.cards || {}) },
    pix: { ...base.pix, ...(input.pix || {}), atual: { ...base.pix.atual, ...(input.pix?.atual || {}) }, proposta: { ...base.pix.proposta, ...(input.pix?.proposta || {}) } },
    anticipation: { ...base.anticipation, ...(input.anticipation || {}) }, collection: { ...base.collection, ...(input.collection || {}) }, package: { ...base.package, ...(input.package || {}) }, benefits: { ...base.benefits, ...(input.benefits || {}) }, ui: { ...base.ui, ...(input.ui || {}) }
  };
  MODALIDADES.forEach((m) => {
    merged.cards.modalities[m] = { ...base.cards.modalities[m], ...(input.cards?.modalities?.[m] || {}) };
    BANDEIRAS.forEach((b) => { merged.cards.modalities[m].brands[b.id] = { ...base.cards.modalities[m].brands[b.id], ...(input.cards?.modalities?.[m]?.brands?.[b.id] || {}) }; });
  });
  if (legacyMode === 'share' && legacyTotal > 0) {
    MODALIDADES.forEach((m) => { const share = parseLegacyNumber(input.cards?.modalities?.[m]?.share); if (merged.cards.modalities[m].valor === null || merged.cards.modalities[m].valor === '') merged.cards.modalities[m].valor = legacyTotal * share / 100; });
  }
  merged.cards.modoModalidades = 'valor';
  merged.cards.detalharBandeiras = input.cards?.detalharBandeiras !== false;
  merged.cards.faturamentoTotal = MODALIDADES.reduce((sum, m) => sum + parseLegacyNumber(merged.cards.modalities[m].valor), 0);
  merged.equipment = Array.isArray(input.equipment) ? input.equipment : base.equipment;
  merged.collection.itens = Array.isArray(input.collection?.itens) ? input.collection.itens : base.collection.itens;
  merged.others = Array.isArray(input.others) ? input.others : [];
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}

export function planMonthlyFee(planName) { return MAIS_VANTAGENS_PLANOS[planName]?.mensalidadeCheia ?? 0; }
