const MODALIDADES = ["Débito","Crédito à vista","2x","3x","4x","5x","6x","7x","8x","9x","10x","11x","12x"];
const BANDEIRAS = ["Visa","Master","Elo","Diners/Amex"];
const STORE_KEY = "simuladorCielo.v2";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const n = v => {
  const x = parseFloat(String(v ?? 0).replace(/\./g, ".").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};
const fmtBRL = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
const fmtPct = v => `${(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const fmtPP = v => `${Math.abs(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} p.p.`;
const fmtCompact = v => {
  const x = Number(v) || 0;
  if (Math.abs(x) >= 1e6) return `R$ ${(x / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  if (Math.abs(x) >= 1e3) return `R$ ${(x / 1e3).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return fmtBRL(x);
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const plusDays = (iso, d) => { const x = new Date(`${iso}T12:00:00`); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const fmtDate = iso => { if (!iso) return "—"; const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };

function defaultState() {
  const cards = {}, brands = {};
  MODALIDADES.forEach(m => {
    cards[m] = { share: 0, valor: 0, atual: 0, proposta: 0 };
    brands[m] = {};
    BANDEIRAS.forEach(b => brands[m][b] = { mix: 0, atual: 0, proposta: 0 });
  });
  return {
    cliente: "", solucaoAtual: "Stone", agencia: "", gerente: "",
    dataAnalise: todayISO(), validade: plusDays(todayISO(), 15),
    regime: "geral", distribuicao: "share", totalVolume: 0, cards, brands,
    services: {
      pix: { volume: 0, qtd: 0, atual: { tipo: "percent", taxa: 0, teto: 0 }, proposta: { tipo: "percent", taxa: 0, teto: 0 } },
      pos: { qtdAtual: 0, unitAtual: 0, qtdProp: 0, unitProp: 0 },
      antecipacao: { volume: 0, atual: 0, proposta: 0 },
      cobranca: { qtd: 0, atual: 0, proposta: 0 },
      pacote: { atual: 0, proposta: 0 },
      outros: { descricao: "", atual: 0, proposta: 0 },
      pontosMes: 0
    }
  };
}

let state = defaultState();
function setPath(obj, path, value) { const p = path.split("."); let x = obj; for (let i = 0; i < p.length - 1; i++) x = x[p[i]]; x[p.at(-1)] = value; }
function bind(id, path, evt = "input") { const el = $(`#${id}`); if (!el) return; el.addEventListener(evt, e => { setPath(state, path, e.target.value); renderAll(); }); }
function activeBrands(m) { return m === "Débito" ? BANDEIRAS.slice(0, 3) : BANDEIRAS; }
function cardVolume(m) { const c = state.cards[m]; return state.distribuicao === "valor" ? n(c.valor) : n(state.totalVolume) * n(c.share) / 100; }
function analyzedVolume() { return state.distribuicao === "valor" ? MODALIDADES.reduce((s, m) => s + n(state.cards[m].valor), 0) : n(state.totalVolume); }
function shareOf(m) { const total = analyzedVolume(); return total ? cardVolume(m) / total * 100 : 0; }
function brandMixSum(m) { return activeBrands(m).reduce((s, b) => s + n(state.brands[m][b].mix), 0); }
function brandMixValid(m) { return Math.abs(brandMixSum(m) - 100) < 0.05; }
function effectiveRate(m, side) { if (state.regime === "geral") return n(state.cards[m][side]); return activeBrands(m).reduce((s, b) => s + n(state.brands[m][b].mix) / 100 * n(state.brands[m][b][side]), 0); }
function cardCost(m, side) { return cardVolume(m) * effectiveRate(m, side) / 100; }
function cardsTotal(side) { return MODALIDADES.reduce((s, m) => s + cardCost(m, side), 0); }
function weightedRate(side) { const vol = analyzedVolume(); return vol ? cardsTotal(side) / vol * 100 : 0; }
function pixCost(side) {
  const p = state.services.pix, s = p[side], vol = n(p.volume), q = n(p.qtd), tax = n(s.taxa), teto = n(s.teto);
  if (s.tipo === "fixed") return q * tax;
  if (s.tipo === "percent") return vol * tax / 100;
  if (s.tipo === "capped") { if (!q) return 0; const avg = vol / q; return q * Math.min(avg * tax / 100, teto || Infinity); }
  return 0;
}
function serviceCosts() {
  const s = state.services;
  return {
    "Cartões": { atual: cardsTotal("atual"), proposta: cardsTotal("proposta") },
    "Pix": { atual: pixCost("atual"), proposta: pixCost("proposta") },
    "Equipamentos": { atual: n(s.pos.qtdAtual) * n(s.pos.unitAtual), proposta: n(s.pos.qtdProp) * n(s.pos.unitProp) },
    "Antecipação": { atual: n(s.antecipacao.volume) * n(s.antecipacao.atual) / 100, proposta: n(s.antecipacao.volume) * n(s.antecipacao.proposta) / 100 },
    "Cobrança": { atual: n(s.cobranca.qtd) * n(s.cobranca.atual), proposta: n(s.cobranca.qtd) * n(s.cobranca.proposta) },
    "Pacote": { atual: n(s.pacote.atual), proposta: n(s.pacote.proposta) },
    [s.outros.descricao || "Outros"]: { atual: n(s.outros.atual), proposta: n(s.outros.proposta) }
  };
}
function totals() { const sc = serviceCosts(); const atual = Object.values(sc).reduce((s, v) => s + v.atual, 0); const proposta = Object.values(sc).reduce((s, v) => s + v.proposta, 0); const diff = atual - proposta; return { atual, proposta, diff, annual: diff * 12, pct: atual ? diff / atual * 100 : 0 }; }
function modelValidation() {
  const vol = analyzedVolume();
  const sumShare = MODALIDADES.reduce((s, m) => s + (state.distribuicao === "share" ? n(state.cards[m].share) : shareOf(m)), 0);
  const distributionStarted = state.distribuicao === "valor" ? MODALIDADES.some(m => n(state.cards[m].valor) > 0) : n(state.totalVolume) > 0 || MODALIDADES.some(m => n(state.cards[m].share) > 0);
  const shareValid = state.distribuicao === "valor" ? vol > 0 : Math.abs(sumShare - 100) < 0.05;
  const brandValid = state.regime === "geral" || MODALIDADES.every(brandMixValid);
  return { vol, sumShare, distributionStarted, shareValid, brandValid, ok: vol > 0 && shareValid && brandValid };
}

function injectUXStyles() {
  if ($("#uxStyles")) return;
  const st = document.createElement("style"); st.id = "uxStyles";
  st.textContent = `
    #brandEditor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .brand-modal{margin:0!important;background:#fff}
    .brand-modal summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 15px;background:#f5f8fa;border-radius:11px;font-weight:800;color:var(--navy)}
    .brand-modal summary::-webkit-details-marker{display:none}.brand-modal summary:after{content:'+';font-size:20px;color:var(--blue);line-height:1}.brand-modal[open] summary:after{content:'–'}
    .brand-modal[open] summary{border-bottom:1px solid var(--line);border-radius:11px 11px 0 0}.brand-summary-main{display:flex;align-items:center;gap:10px;min-width:0}
    .brand-summary-metrics{display:flex;gap:12px;align-items:center;font-size:11px;color:#66717c;font-weight:700;white-space:nowrap}.brand-summary-metrics strong{color:var(--navy)}
    .brand-tools{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px}.brand-tools button{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}
    .brand-grid{grid-template-columns:110px 1fr 1fr 1fr!important}.brand-grid .head:nth-child(2)::after,.brand-grid .head:nth-child(3)::after,.brand-grid .head:nth-child(4)::after{content:' (%)';font-weight:500}
    #brandPanel{border-color:#cddce6}#brandPanel .panel-title{margin-bottom:12px}.model-mode-note{margin-top:10px;padding:10px 12px;background:#eef6fb;border-left:3px solid var(--blue);border-radius:8px;color:#4f6472;font-size:12px;line-height:1.45}
    .mode-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;background:#eaf2f7;color:var(--navy);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.3px}
    @media(max-width:1050px){#brandEditor{grid-template-columns:1fr}}
  `;
  document.head.appendChild(st);
}
function placeBrandPanel() {
  const brandPanel = $("#brandPanel"), cardsPanel = $("#cardsTable")?.closest("article"), configGrid = $("#view-entrada .grid.grid-2");
  if (!brandPanel || !cardsPanel || !configGrid) return;
  if (state.regime === "bandeira") { brandPanel.hidden = false; configGrid.insertAdjacentElement("afterend", brandPanel); }
  else { brandPanel.hidden = true; cardsPanel.insertAdjacentElement("afterend", brandPanel); }
}

function renderCardsEditor() {
  const general = state.regime === "geral", shareMode = state.distribuicao === "share";
  $("#cardsHead").innerHTML = `<tr><th>Modalidade</th><th>${shareMode ? "Share (%)" : "Valor mensal (R$)"}</th><th>${shareMode ? "Volume calculado" : "Share calculado"}</th>${general ? "<th>Condição atual (%)</th><th>Condição proposta (%)</th>" : "<th>Taxa média atual</th><th>Taxa média proposta</th>"}</tr>`;
  $("#cardsBody").innerHTML = MODALIDADES.map(m => {
    const c = state.cards[m];
    const input = shareMode ? `<input class="card-input" data-m="${m}" data-k="share" type="number" min="0" max="100" step="0.01" value="${c.share}">` : `<input class="card-input" data-m="${m}" data-k="valor" type="number" min="0" step="0.01" value="${c.valor}">`;
    const calc = shareMode ? fmtBRL(cardVolume(m)) : fmtPct(shareOf(m));
    const current = general ? `<input class="card-input" data-m="${m}" data-k="atual" type="number" min="0" step="0.0001" value="${c.atual}">` : fmtPct(effectiveRate(m, "atual"));
    const prop = general ? `<input class="card-input" data-m="${m}" data-k="proposta" type="number" min="0" step="0.0001" value="${c.proposta}">` : fmtPct(effectiveRate(m, "proposta"));
    return `<tr><td><strong>${m}</strong></td><td>${input}</td><td>${calc}</td><td>${current}</td><td>${prop}</td></tr>`;
  }).join("");
  const sumShare = MODALIDADES.reduce((s, m) => s + (shareMode ? n(state.cards[m].share) : shareOf(m)), 0);
  $("#cardsFoot").innerHTML = `<tr><td>Total</td><td>${shareMode ? fmtPct(sumShare) : fmtBRL(analyzedVolume())}</td><td>${shareMode ? fmtBRL(analyzedVolume()) : fmtPct(sumShare)}</td><td>${fmtPct(weightedRate("atual"))}</td><td>${fmtPct(weightedRate("proposta"))}</td></tr>`;
  $$(".card-input").forEach(el => el.addEventListener("input", e => { state.cards[e.target.dataset.m][e.target.dataset.k] = e.target.value; renderAll(); }));
}
function renderBrandEditor() {
  placeBrandPanel(); if (state.regime !== "bandeira") return;
  $("#brandEditor").innerHTML = `<div class="brand-tools" style="grid-column:1/-1"><span class="mode-chip">Regime por bandeira</span><button type="button" data-brand-action="expand">Expandir todos</button><button type="button" data-brand-action="collapse">Recolher todos</button></div>${MODALIDADES.map((m, idx) => {
    const bs = activeBrands(m), sum = brandMixSum(m), valid = brandMixValid(m), wa = effectiveRate(m, "atual"), wp = effectiveRate(m, "proposta"), open = idx < 2 ? " open" : "";
    return `<details class="brand-modal"${open}><summary><span class="brand-summary-main"><span>${m}</span><span class="${valid ? "positive" : "negative-text"}">${valid ? "Mix OK" : `Mix ${fmtPct(sum)}`}</span></span><span class="brand-summary-metrics"><span>Atual <strong>${fmtPct(wa)}</strong></span><span>Proposta <strong>${fmtPct(wp)}</strong></span></span></summary><div class="brand-grid"><div class="head">Bandeira</div><div class="head">Mix</div><div class="head">Atual</div><div class="head">Proposta</div>${bs.map(b => { const x = state.brands[m][b]; return `<div><strong>${b}</strong></div><div><input class="brand-input" data-m="${m}" data-b="${b}" data-k="mix" type="number" min="0" max="100" step="0.01" value="${x.mix}"></div><div><input class="brand-input" data-m="${m}" data-b="${b}" data-k="atual" type="number" min="0" step="0.0001" value="${x.atual}"></div><div><input class="brand-input" data-m="${m}" data-b="${b}" data-k="proposta" type="number" min="0" step="0.0001" value="${x.proposta}"></div>`; }).join("")}</div></details>`;
  }).join("")}`;
  $$(".brand-input").forEach(el => el.addEventListener("input", e => { const d = e.target.dataset; state.brands[d.m][d.b][d.k] = e.target.value; renderAll(); }));
  $$("[data-brand-action]").forEach(btn => btn.addEventListener("click", e => { const open = e.currentTarget.dataset.brandAction === "expand"; $$("#brandEditor details.brand-modal").forEach(d => d.open = open); }));
}
function kpi(label, value, sub = "", cls = "") { return `<div class="summary-card ${cls}"><span class="kpi-label">${label}</span><strong>${value}</strong>${sub ? `<small>${sub}</small>` : ""}</div>`; }
function diffClass(v) { return v > 0 ? "positive" : v < 0 ? "negative-text" : "neutral-text"; }
function renderResult() {
  const t = totals(), brand = state.regime === "bandeira";
  $("#resultSummary").innerHTML = kpi("Volume mensal analisado", fmtCompact(analyzedVolume())) + kpi("Cenário atual", fmtCompact(t.atual)) + kpi("Solução proposta", fmtCompact(t.proposta)) + kpi(t.diff >= 0 ? "Economia em 12 meses" : "Impacto em 12 meses", fmtCompact(Math.abs(t.annual)), `${Math.abs(t.pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% no custo total`, t.diff >= 0 ? "hero" : "negative");
  $("#resultCardsTitle").textContent = brand ? "Condições por modalidade e bandeira" : "Condições por modalidade";
  $("#resultHead").innerHTML = brand ? `<tr><th>Modalidade</th>${BANDEIRAS.map(b => `<th>${b}</th>`).join("")}<th>Dif. mensal</th><th>12 meses</th></tr>` : `<tr><th>Modalidade</th><th>Volume</th><th>Condição atual</th><th>Condição proposta</th><th>Diferença</th><th>Dif. mensal</th><th>12 meses</th></tr>`;
  $("#resultBody").innerHTML = MODALIDADES.map(m => {
    const d = cardCost(m, "atual") - cardCost(m, "proposta");
    if (!brand) { const dr = effectiveRate(m, "atual") - effectiveRate(m, "proposta"); return `<tr><td>${m}</td><td>${fmtBRL(cardVolume(m))}</td><td>${fmtPct(effectiveRate(m,"atual"))}</td><td>${fmtPct(effectiveRate(m,"proposta"))}</td><td class="${diffClass(dr)}">${dr > 0 ? "↓ " : dr < 0 ? "↑ " : "= "}${fmtPP(dr)}</td><td class="${diffClass(d)}">${fmtBRL(d)}</td><td>${fmtBRL(d * 12)}</td></tr>`; }
    return `<tr><td>${m}</td>${BANDEIRAS.map(b => { if (!activeBrands(m).includes(b)) return "<td>—</td>"; const x = state.brands[m][b]; return `<td><span class="brand-rate-text"><strong>${fmtPct(n(x.mix))} mix</strong>${fmtPct(n(x.atual))} → ${fmtPct(n(x.proposta))}</span></td>`; }).join("")}<td class="${diffClass(d)}">${fmtBRL(d)}</td><td>${fmtBRL(d * 12)}</td></tr>`;
  }).join("");
  const sc = serviceCosts(); $("#servicesResult").innerHTML = Object.entries(sc).map(([name, x]) => { const d = x.atual - x.proposta; return `<tr><td>${name}</td><td>${fmtBRL(x.atual)}</td><td>${fmtBRL(x.proposta)}</td><td class="${diffClass(d)}">${fmtBRL(d)}</td><td>${fmtBRL(d * 12)}</td></tr>`; }).join("");
}
function resultText(t) { if (t.diff > 0) return `<strong>Economia estimada de ${fmtBRL(t.diff)} por mês</strong><p>A solução proposta representa ${fmtBRL(t.annual)} em 12 meses, equivalente a uma redução estimada de ${fmtPct(t.pct)} no custo total analisado.</p>`; if (t.diff < 0) return `<strong>Impacto adicional estimado de ${fmtBRL(Math.abs(t.diff))} por mês</strong><p>No cenário analisado, a solução representa ${fmtBRL(Math.abs(t.annual))} em 12 meses. Avalie os componentes e benefícios operacionais considerados.</p>`; return `<strong>Resultado financeiro equivalente</strong><p>Os custos consolidados dos dois cenários são equivalentes nas premissas informadas.</p>`; }
function rateTable(head, body) {
  const brand = state.regime === "bandeira";
  $(head).innerHTML = brand ? `<tr><th>Modalidade</th>${BANDEIRAS.map(b => `<th>${b}</th>`).join("")}</tr>` : `<tr><th>Modalidade</th><th>Condição atual</th><th>Condição proposta</th><th>Diferença</th></tr>`;
  $(body).innerHTML = MODALIDADES.map(m => {
    if (brand) return `<tr><td><strong>${m}</strong></td>${BANDEIRAS.map(b => { if (!activeBrands(m).includes(b)) return "<td>—</td>"; const x = state.brands[m][b]; return `<td>${fmtPct(n(x.atual))} → <strong>${fmtPct(n(x.proposta))}</strong><br><span class="neutral-text">mix ${fmtPct(n(x.mix))}</span></td>`; }).join("")}</tr>`;
    const dr = effectiveRate(m,"atual") - effectiveRate(m,"proposta"); return `<tr><td><strong>${m}</strong></td><td>${fmtPct(effectiveRate(m,"atual"))}</td><td>${fmtPct(effectiveRate(m,"proposta"))}</td><td class="${diffClass(dr)}">${dr > 0 ? "↓ " : dr < 0 ? "↑ " : "= "}${fmtPP(dr)}</td></tr>`;
  }).join("");
}
function renderBars(t) {
  const max = Math.max(t.atual, t.proposta, 1); $("#costBars").innerHTML = [{ label: "Cenário atual", value: t.atual, cls: "" }, { label: "Solução proposta", value: t.proposta, cls: "proposed" }].map(x => `<div class="bar-item"><div class="bar-value">${fmtCompact(x.value)}</div><div class="bar ${x.cls}" style="height:${Math.max(8, Math.round(x.value / max * 190))}px"></div><div class="bar-label">${x.label}</div></div>`).join("");
  const impacts = Object.entries(serviceCosts()).map(([name, x]) => ({ name, value: x.atual - x.proposta })); const maxImp = Math.max(...impacts.map(x => Math.abs(x.value)), 1); $("#impactBars").innerHTML = impacts.map(x => `<div class="impact-row"><span class="impact-name">${x.name}</span><span class="impact-track"><span class="impact-fill ${x.value >= 0 ? "pos" : "neg"}" style="width:${Math.max(2, Math.abs(x.value) / maxImp * 100)}%"></span></span><span class="impact-value ${diffClass(x.value)}">${x.value >= 0 ? "+ " : "- "}${fmtBRL(Math.abs(x.value))}</span></div>`).join("");
}
function metaHTML() { return `<span><strong>Cliente:</strong> ${state.cliente || "—"}</span><span><strong>Solução atual:</strong> ${state.solucaoAtual || "—"}</span><span><strong>Data:</strong> ${fmtDate(state.dataAnalise)}</span><span><strong>Validade:</strong> ${fmtDate(state.validade)}</span>`; }
function renderDashboard() {
  const t = totals(); $("#dashClientLine").textContent = state.cliente ? state.cliente : "Análise personalizada"; $("#dashMeta").innerHTML = metaHTML();
  $("#dashCurrent").innerHTML = kpi("Volume mensal analisado", fmtCompact(analyzedVolume())) + kpi("Cenário atual", fmtCompact(t.atual)) + kpi("Taxa média atual", fmtPct(weightedRate("atual"))) + kpi("Regime de cotação", state.regime === "geral" ? "Geral" : "Por bandeira");
  $("#dashProposal").innerHTML = kpi("Solução proposta", fmtCompact(t.proposta)) + kpi("Taxa média proposta", fmtPct(weightedRate("proposta"))) + kpi(t.diff >= 0 ? "Economia mensal" : "Impacto mensal", fmtCompact(Math.abs(t.diff)), "", t.diff >= 0 ? "hero" : "negative") + kpi(t.diff >= 0 ? "Economia em 12 meses" : "Impacto em 12 meses", fmtCompact(Math.abs(t.annual)), `${Math.abs(t.pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% no custo total`, t.diff >= 0 ? "hero" : "negative");
  $("#resultBanner").innerHTML = resultText(t); $("#dashConditionCaption").textContent = state.regime === "bandeira" ? "Condições por modalidade, bandeira e mix informado." : "Comparativo por modalidade."; rateTable("#dashRateHead", "#dashRateBody"); renderBars(t);
}
function renderProposal() {
  const t = totals(); $("#proposalClient").textContent = state.cliente || "Cliente"; $("#proposalMeta").innerHTML = metaHTML();
  $("#proposalSummary").innerHTML = kpi("Volume mensal analisado", fmtCompact(analyzedVolume())) + kpi("Cenário atual", fmtCompact(t.atual)) + kpi("Com a solução proposta", fmtCompact(t.proposta)) + kpi(t.diff >= 0 ? "Economia em 12 meses" : "Impacto em 12 meses", fmtCompact(Math.abs(t.annual)), `${Math.abs(t.pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% no custo total`, t.diff >= 0 ? "hero" : "negative");
  $("#proposalBanner").innerHTML = resultText(t); $("#proposalImpact").innerHTML = Object.entries(serviceCosts()).map(([name, x]) => { const d = x.atual - x.proposta; return `<div class="proposal-impact-row"><span>${name}</span><strong class="${diffClass(d)}">${d >= 0 ? "+ " : "- "}${fmtBRL(Math.abs(d))}</strong></div>`; }).join(""); rateTable("#proposalRateHead", "#proposalRateBody");
}
function renderModelSelectors() {
  $$("#regimeSelector .seg").forEach(b => b.classList.toggle("active", b.dataset.value === state.regime)); $$("#distSelector .seg").forEach(b => b.classList.toggle("active", b.dataset.value === state.distribuicao));
  $("#regimeHelp").innerHTML = state.regime === "geral" ? `Uma taxa atual e uma taxa proposta para cada modalidade.<div class="model-mode-note"><strong>Geral por cartão:</strong> use quando as condições não variam por bandeira.</div>` : `Mix e taxas independentes por Visa, Master, Elo e Diners/Amex.<div class="model-mode-note"><strong>Por bandeira:</strong> primeiro distribua o volume entre as modalidades e, em seguida, informe o mix e as taxas de cada bandeira.</div>`;
  $("#totalVolumeWrap").style.opacity = state.distribuicao === "share" ? "1" : ".5"; $("#totalVolume").disabled = state.distribuicao === "valor";
}
function renderStatus() {
  const v = modelValidation(), ms = $("#modelStatus"), ds = $("#distributionStatus"), bs = $("#brandStatus"); ms.className = "status-badge";
  if (!v.distributionStarted || v.vol <= 0) { ms.textContent = "Aguardando dados"; ms.classList.add("status-neutral"); }
  else if (!v.shareValid) { ms.textContent = "Revisar distribuição"; ms.classList.add("status-warn"); }
  else if (state.regime === "bandeira" && !v.brandValid) { ms.textContent = "Revisar mix das bandeiras"; ms.classList.add("status-warn"); }
  else { ms.textContent = "Modelo consistente"; ms.classList.add("status-ok"); }
  if (!v.distributionStarted || v.vol <= 0) ds.textContent = "Informe a distribuição"; else ds.textContent = state.distribuicao === "share" ? `Share total: ${fmtPct(v.sumShare)}` : `Volume calculado: ${fmtBRL(v.vol)}`;
  if (bs) bs.textContent = state.regime === "bandeira" ? (v.brandValid ? "Mix das bandeiras OK" : "Cada modalidade deve totalizar 100%") : "Não aplicável";
}
function syncInputs() {
  const map = { cliente: state.cliente, solucaoAtual: state.solucaoAtual, agencia: state.agencia, gerente: state.gerente, dataAnalise: state.dataAnalise, validade: state.validade, totalVolume: state.totalVolume, pixVolume: state.services.pix.volume, pixQtd: state.services.pix.qtd, pixAtualTipo: state.services.pix.atual.tipo, pixAtualTaxa: state.services.pix.atual.taxa, pixAtualTeto: state.services.pix.atual.teto, pixPropTipo: state.services.pix.proposta.tipo, pixPropTaxa: state.services.pix.proposta.taxa, pixPropTeto: state.services.pix.proposta.teto, posQtdAtual: state.services.pos.qtdAtual, posUnitAtual: state.services.pos.unitAtual, posQtdProp: state.services.pos.qtdProp, posUnitProp: state.services.pos.unitProp, antVolume: state.services.antecipacao.volume, antAtual: state.services.antecipacao.atual, antProp: state.services.antecipacao.proposta, bolQtd: state.services.cobranca.qtd, bolAtual: state.services.cobranca.atual, bolProp: state.services.cobranca.proposta, pacAtual: state.services.pacote.atual, pacProp: state.services.pacote.proposta, outrosDesc: state.services.outros.descricao, outrosAtual: state.services.outros.atual, outrosProp: state.services.outros.proposta, pontosMes: state.services.pontosMes };
  Object.entries(map).forEach(([id, value]) => { const el = $(`#${id}`); if (el && document.activeElement !== el) el.value = value ?? ""; });
}
function renderAll() { injectUXStyles(); renderModelSelectors(); renderCardsEditor(); renderBrandEditor(); renderStatus(); renderResult(); renderDashboard(); renderProposal(); syncInputs(); }
function showView(name) { $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`)); $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name)); window.scrollTo({ top: 0, behavior: "smooth" }); }
function exportState() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `simulacao-pagamentos-${(state.cliente || "cliente").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.json`; a.click(); URL.revokeObjectURL(a.href); }
function bindStaticEvents() {
  bind("cliente", "cliente"); bind("solucaoAtual", "solucaoAtual", "change"); bind("agencia", "agencia"); bind("gerente", "gerente"); bind("dataAnalise", "dataAnalise", "change"); bind("validade", "validade", "change"); bind("totalVolume", "totalVolume");
  bind("pixVolume", "services.pix.volume"); bind("pixQtd", "services.pix.qtd"); bind("pixAtualTipo", "services.pix.atual.tipo", "change"); bind("pixAtualTaxa", "services.pix.atual.taxa"); bind("pixAtualTeto", "services.pix.atual.teto"); bind("pixPropTipo", "services.pix.proposta.tipo", "change"); bind("pixPropTaxa", "services.pix.proposta.taxa"); bind("pixPropTeto", "services.pix.proposta.teto");
  bind("posQtdAtual", "services.pos.qtdAtual"); bind("posUnitAtual", "services.pos.unitAtual"); bind("posQtdProp", "services.pos.qtdProp"); bind("posUnitProp", "services.pos.unitProp"); bind("antVolume", "services.antecipacao.volume"); bind("antAtual", "services.antecipacao.atual"); bind("antProp", "services.antecipacao.proposta"); bind("bolQtd", "services.cobranca.qtd"); bind("bolAtual", "services.cobranca.atual"); bind("bolProp", "services.cobranca.proposta"); bind("pacAtual", "services.pacote.atual"); bind("pacProp", "services.pacote.proposta"); bind("outrosDesc", "services.outros.descricao"); bind("outrosAtual", "services.outros.atual"); bind("outrosProp", "services.outros.proposta"); bind("pontosMes", "services.pontosMes");
  $$("#regimeSelector .seg").forEach(b => b.addEventListener("click", () => { state.regime = b.dataset.value; renderAll(); })); $$("#distSelector .seg").forEach(b => b.addEventListener("click", () => { state.distribuicao = b.dataset.value; renderAll(); })); $$(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view))); $$('[data-go]').forEach(b => b.addEventListener("click", () => showView(b.dataset.go)));
  $("#btnPrint")?.addEventListener("click", () => { renderAll(); window.print(); }); $("#btnSave")?.addEventListener("click", () => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); alert("Simulação salva neste navegador."); });
  $("#btnNew")?.addEventListener("click", () => { if (!confirm("Iniciar uma nova análise? Os dados não salvos serão perdidos.")) return; state = defaultState(); localStorage.removeItem(STORE_KEY); renderAll(); showView("entrada"); }); $("#btnExport")?.addEventListener("click", exportState);
  $("#importFile")?.addEventListener("change", e => { const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { state = { ...defaultState(), ...JSON.parse(rd.result) }; renderAll(); alert("Simulação importada."); } catch { alert("Arquivo de simulação inválido."); } }; rd.readAsText(f); e.target.value = ""; });
}
function loadLocalIfPresent() { const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem("simuladorCielo.v1"); if (!raw) return; try { state = { ...defaultState(), ...JSON.parse(raw) }; } catch {} }
function init() { injectUXStyles(); loadLocalIfPresent(); bindStaticEvents(); renderAll(); }
document.addEventListener("DOMContentLoaded", init);
