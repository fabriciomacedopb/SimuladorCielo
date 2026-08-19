import { MODALIDADES } from '../config/parametros.js';
import { activeBrandsFor, brandVolumeCents, modalityVolumeCents, totalCardsVolumeCents } from './cartoes.js';
import { parseDecimal, toCents } from './formatters.js';

function status(label, level, message, step) { return { label, level, message, step }; }

export function validateState(state) {
  const checks = [];
  const requiredMeta = [state.meta.cliente, state.meta.solucaoAtual, state.meta.dataAnalise, state.meta.validade];
  checks.push(requiredMeta.every(Boolean) ? status('Dados da proposta', 'ok', 'Dados essenciais preenchidos.', 0) : status('Dados da proposta', 'fill', 'Preencha cliente, solução atual, data e validade.', 0));
  const totalCards = totalCardsVolumeCents(state);
  checks.push(totalCards > 0 ? status('Volume das modalidades', 'ok', 'Faturamento mensal total calculado automaticamente.', 1) : status('Volume das modalidades', 'fill', 'Informe o faturamento mensal das modalidades.', 1));

  let brandMixLevel = 'ok';
  let brandMixMessage = state.cards.detalharBandeiras === false ? 'Detalhamento por bandeira dispensado nesta análise.' : 'Distribuição por bandeira conciliada nas modalidades com volume.';
  let ratesLevel = 'ok';
  let ratesMessage = state.cards.detalharBandeiras === false ? 'Condições gerais preenchidas nas modalidades com volume.' : 'Condições atuais e Cielo preenchidas nas combinações com volume.';

  if (state.cards.detalharBandeiras !== false) {
    for (const modalidade of MODALIDADES) {
      const modalVol = modalityVolumeCents(state, modalidade);
      if (modalVol <= 0) continue;
      const active = activeBrandsFor(modalidade);

      if (state.cards.modoBandeiras === 'share') {
        const sum = active.reduce((s, b) => s + (parseDecimal(state.cards.modalities[modalidade].brands[b.id].share) ?? 0), 0);
        if (Math.abs(sum) < 0.01) {
          brandMixLevel = 'fill';
          brandMixMessage = `${modalidade}: informe o share por bandeira ou altere a forma de preenchimento para Valor mensal.`;
          break;
        }
        if (Math.abs(sum - 100) >= 0.01) {
          brandMixLevel = 'review';
          brandMixMessage = `${modalidade}: o share das bandeiras totaliza ${sum.toFixed(2)}%. Ajuste para 100%.`;
          break;
        }
      } else {
        const sum = active.reduce((s, b) => s + brandVolumeCents(state, modalidade, b.id), 0);
        if (sum === 0) {
          brandMixLevel = 'fill';
          brandMixMessage = `${modalidade}: informe o faturamento por bandeira ou altere a forma de preenchimento para Share %.`;
          break;
        }
        if (Math.abs(sum - modalVol) > 1) {
          brandMixLevel = 'review';
          brandMixMessage = `${modalidade}: o faturamento informado por bandeira não concilia com o volume da modalidade.`;
          break;
        }
      }
    }

    for (const modalidade of MODALIDADES) {
      const modalVol = modalityVolumeCents(state, modalidade);
      if (modalVol <= 0) continue;
      for (const brand of activeBrandsFor(modalidade)) {
        const vol = brandVolumeCents(state, modalidade, brand.id);
        if (vol <= 0) continue;
        const cell = state.cards.modalities[modalidade].brands[brand.id];
        if (parseDecimal(cell.taxaAtual) === null || parseDecimal(cell.taxaCielo) === null) {
          ratesLevel = 'fill';
          ratesMessage = `${modalidade} / ${brand.nome}: informe condição atual e Cielo.`;
          break;
        }
      }
      if (ratesLevel !== 'ok') break;
    }
  } else {
    for (const modalidade of MODALIDADES) {
      if (modalityVolumeCents(state, modalidade) <= 0) continue;
      const row = state.cards.modalities[modalidade];
      if (parseDecimal(row.taxaAtualGeral) === null || parseDecimal(row.taxaCieloGeral) === null) {
        ratesLevel = 'fill';
        ratesMessage = `${modalidade}: informe a condição geral atual e Cielo.`;
        break;
      }
    }
  }

  checks.push(status('Distribuição por bandeira', brandMixLevel, brandMixMessage, 2));
  checks.push(status(state.cards.detalharBandeiras === false ? 'Condições gerais' : 'Condições por bandeira', ratesLevel, ratesMessage, 2));
  const pixOk = (toCents(state.pix.volumeMensal) ?? 0) === 0 || (parseDecimal(state.pix.transacoesMes) ?? 0) > 0;
  checks.push(pixOk ? status('Pix', 'ok', 'Dados do Pix consistentes.', 3) : status('Pix', 'review', 'Informe a quantidade de transações para calcular o Pix.', 3));
  checks.push(status('Equipamentos', 'ok', 'Custos calculados conforme quantidades e isenções informadas.', 4));
  checks.push(status('Antecipação', 'ok', state.anticipation.realiza ? 'Custo calculado pela regra Volume × Taxa.' : 'Antecipação não considerada.', 5));
  checks.push(status('Cobrança', 'ok', 'Eventos de cobrança consolidados.', 6));
  const packageReady = state.package.tipoInstituicaoAtual === 'Sem pacote' || toCents(state.package.mensalidadeAtual) !== null;
  checks.push(packageReady ? status('Pacote / Mais Vantagens', state.package.statusValidacao === 'A VALIDAR' ? 'review' : 'ok', state.package.statusValidacao === 'A VALIDAR' ? 'Benefício estimado sujeito à validação e contratação.' : 'Mensalidade atual e plano proposto disponíveis.', 7) : status('Pacote / Mais Vantagens', 'fill', 'Informe a mensalidade atual para consolidar o resultado.', 7));
  const overall = checks.some((c) => c.level === 'review') ? 'review' : checks.some((c) => c.level === 'fill') ? 'fill' : 'ok';
  return { overall, checks };
}
