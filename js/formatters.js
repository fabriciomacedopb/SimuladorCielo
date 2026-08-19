const nfBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const nfNumber = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function parseDecimal(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim().replace(/\s/g, '').replace(/R\$/gi, '').replace(/%/g, '');
  if (!raw) return null;
  let normalized;
  if (raw.includes(',')) normalized = raw.replace(/\./g, '').replace(',', '.');
  else if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(raw)) normalized = raw.replace(/\./g, '');
  else normalized = raw;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
export function toCents(value) { const n = parseDecimal(value); return n === null ? null : Math.round(n * 100); }
export function centsToReais(cents) { return (Number(cents) || 0) / 100; }
export function rateToUnits(value) { const n = parseDecimal(value); return n === null ? null : Math.round(n * 10000); }
export function rateUnitsToPercent(units) { return (Number(units) || 0) / 10000; }
export function costMicroCents(cents, rateUnits) { if (cents === null || rateUnits === null) return null; return cents * rateUnits; }
export function microCentsToCents(micro) { if (micro === null || micro === undefined) return null; return Math.round(micro / 1_000_000); }
export function fmtBRLFromCents(cents, dash = false) { if (cents === null || cents === undefined) return '—'; if (dash && cents === 0) return '—'; return nfBRL.format(centsToReais(cents)); }
export function fmtBRL(value) { if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'; return nfBRL.format(Number(value)); }
export function fmtCompactCents(cents) { if (cents === null || cents === undefined) return '—'; const v = centsToReais(cents); const abs = Math.abs(v); if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`; if (abs >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`; return nfBRL.format(v); }
export function fmtPct(value, decimals = 2) { if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'; return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`; }
export function fmtPp(value, decimals = 2) { if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'; return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} p.p.`; }
export function fmtPoints(value) { if (value === null || value === undefined) return '—'; return `${nfInt.format(Math.round(Number(value) || 0))} pts`; }
export function fmtDateBR(iso) { if (!iso) return '—'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return y && m && d ? `${d}/${m}/${y}` : '—'; }
export function fmtNumber(value, decimals = 2) { if (value === null || value === undefined) return '—'; if (decimals === 0) return nfInt.format(Number(value) || 0); return nfNumber.format(Number(value) || 0); }
export function resultLabel(cents) { if (cents === null || cents === undefined) return 'AGUARDANDO DADOS'; if (cents > 0) return 'ECONOMIA'; if (cents < 0) return 'ACRÉSCIMO'; return 'NEUTRO'; }
export function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
