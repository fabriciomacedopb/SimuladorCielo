const VIEW_SELECTORS = {
  proposal: '.proposal-sheet',
  dashboard: '.dashboard-sheet',
  results: '.results-page'
};

const A4 = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 3.2
};

let activeTarget = null;
let previousStyle = null;
let activeView = null;

function mmToPx(mm) {
  return mm * 96 / 25.4;
}

function cleanupPrintState() {
  if (activeTarget && previousStyle !== null) {
    activeTarget.setAttribute('style', previousStyle);
  } else if (activeTarget) {
    activeTarget.removeAttribute('style');
  }
  document.body.classList.remove('print-layout', 'print-view-proposal', 'print-view-dashboard', 'print-view-results');
  document.body.style.removeProperty('--print-scale');
  activeTarget = null;
  previousStyle = null;
  activeView = null;
}

function measurePrintLayout(view, target) {
  const root = document.createElement('div');
  root.className = `print-measure-root print-view-${view}`;
  root.style.width = `${A4.widthMm - A4.marginMm * 2}mm`;
  const clone = target.cloneNode(true);
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  root.appendChild(clone);
  document.body.appendChild(root);

  const rect = clone.getBoundingClientRect();
  const height = Math.max(rect.height, clone.scrollHeight, 1);
  const width = Math.max(rect.width, clone.scrollWidth, 1);
  root.remove();
  return { width, height };
}

function calculateScale(view, target) {
  const measured = measurePrintLayout(view, target);
  const printableHeight = mmToPx(A4.heightMm - A4.marginMm * 2);
  const printableWidth = mmToPx(A4.widthMm - A4.marginMm * 2);
  const heightScale = printableHeight / measured.height;
  const widthScale = printableWidth / measured.width;
  const safety = 0.985;
  return Math.min(1, heightScale, widthScale) * safety;
}

export function printView(view = 'proposal') {
  cleanupPrintState();
  const normalizedView = VIEW_SELECTORS[view] ? view : 'proposal';
  const target = document.querySelector(VIEW_SELECTORS[normalizedView]);
  if (!target) {
    window.print();
    return;
  }

  activeTarget = target;
  activeView = normalizedView;
  previousStyle = target.getAttribute('style');

  const scale = Math.max(0.42, calculateScale(normalizedView, target));
  document.body.classList.add('print-layout', `print-view-${normalizedView}`);
  document.body.style.setProperty('--print-scale', String(scale));

  target.style.width = scale < 0.999 ? `${100 / scale}%` : '100%';
  target.style.maxWidth = 'none';
  target.style.zoom = String(scale);

  requestAnimationFrame(() => setTimeout(() => window.print(), 60));
}

window.addEventListener('afterprint', cleanupPrintState);
