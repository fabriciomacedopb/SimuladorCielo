import test from 'node:test';
import assert from 'node:assert/strict';

import { createDefaultState } from '../js/state.js';
import { input, select, segmented, statusBadge } from '../js/ui-shell.js';
import { createCardSteps } from '../js/ui-steps-cards.js';
import { createBrandSteps } from '../js/ui-steps-brands.js';
import { createOperationsSteps } from '../js/ui-steps-operations.js';
import { createCommercialSteps } from '../js/ui-steps-commercial.js';
import { createFinalSteps } from '../js/ui-steps-final.js';

const fakeElement = () => ({ addEventListener() {}, value: '', checked: false, disabled: false });

function makeContext(state) {
  return {
    state,
    $: () => fakeElement(),
    $$: () => [],
    updateState: (mutator) => mutator(state),
    input,
    select,
    segmented,
    statusBadge,
    setStep() {},
    goDashboard() {}
  };
}

test('Renderizadores das 10 etapas executam com estado inicial sem ReferenceError', () => {
  const state = createDefaultState();
  const ctx = makeContext(state);
  const c = { innerHTML: '' };
  const cards = createCardSteps(ctx);
  const brands = createBrandSteps(ctx);
  const operations = createOperationsSteps(ctx);
  const commercial = createCommercialSteps(ctx);
  const finalSteps = createFinalSteps(ctx);

  const renderers = [
    cards.stepProposal,
    cards.stepCards,
    brands.stepBrands,
    operations.stepPix,
    operations.stepEquipment,
    operations.stepAnticipation,
    commercial.stepCollection,
    commercial.stepPackage,
    finalSteps.stepOthers,
    finalSteps.stepReview
  ];

  for (const render of renderers) {
    assert.doesNotThrow(() => render(c));
    assert.equal(typeof c.innerHTML, 'string');
  }
});
