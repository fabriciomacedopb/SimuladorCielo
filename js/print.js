const VIEW_SELECTORS = {
  proposal: '.proposal-sheet',
  dashboard: '.dashboard-sheet',
  results: '.results-page'
};

const PAGE = {
  proposal: { widthMm: 210, heightMm: 297, marginMm: 4, fitOnePage: true },
  dashboard: { widthMm: 210, heightMm: 297, marginMm: 5, fitOnePage: false },
  results: { widthMm: 297, heightMm: 210, marginMm: 5, fitOnePage: false }
};

let activeTarget = null;
let previousStyle = null;
let activeView = null;

function mmToPx(mm) {
  return mm * 96 / 25.4;
}

function cleanupPrintState() {
  if (activeTarget && previousStyle !== null) activeTarget.setAttribute('style', previousStyle);
  else if (activeTarget) activeTarget.removeAttribute('style');

  document.body.classList.remove(
    'print-layout',
    'print-view-proposal',
    'print-view-dashboard',
    'print-view-results',
    'print-proposal-scaled'
  );
  document.body.style.removeProperty('--print-scale');
  activeTarget = null;
  previousStyle = null;
  activeView = null;
}

function measurePrintLayout(view, target) {
  const page = PAGE[view];
  const root = document.createElement('div');
  root.className = `print-measure-root print-view-${view}`;
  root.style.width = `${page.widthMm - page.marginMm * 2}mm`;
  root.style.position = 'fixed';
  root.style.left = '-200vw';
  root.style.top = '0';
  root.style.visibility = 'hidden';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '-1';

  const clone = target.cloneNode(true);
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.zoom = '1';
  root.appendChild(clone);
  document.body.appendChild(root);

  const rect = clone.getBoundingClientRect();
  const size = {
    width: Math.max(rect.width, clone.scrollWidth, 1),
    height: Math.max(rect.height, clone.scrollHeight, 1)
  };
  root.remove();
  return size;
}

function proposalScale(target) {
  const page = PAGE.proposal;
  const measured = measurePrintLayout('proposal', target);
  const printableHeight = mmToPx(page.heightMm - page.marginMm * 2);
  const printableWidth = mmToPx(page.widthMm - page.marginMm * 2);
  const scaleH = printableHeight / measured.height;
  const scaleW = printableWidth / measured.width;
  return Math.min(1, scaleH, scaleW) * 0.995;
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

  document.body.classList.add('print-layout', `print-view-${normalizedView}`);
  target.style.maxWidth = 'none';

  if (PAGE[normalizedView].fitOnePage) {
    const scale = proposalScale(target);
    document.body.style.setProperty('--print-scale', String(scale));
    if (scale < 0.998) {
      document.body.classList.add('print-proposal-scaled');
      target.style.width = `${100 / scale}%`;
      target.style.zoom = String(scale);
    } else {
      target.style.width = '100%';
      target.style.zoom = '1';
    }
  } else {
    document.body.style.setProperty('--print-scale', '1');
    target.style.width = '100%';
    target.style.zoom = '1';
  }

  requestAnimationFrame(() => setTimeout(() => window.print(), 90));
}

window.addEventListener('afterprint', cleanupPrintState);
