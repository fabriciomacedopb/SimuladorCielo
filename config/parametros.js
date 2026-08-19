export const SCHEMA_VERSION = 4;

export const MODALIDADES = [
  'Débito', 'Crédito à vista', '2x', '3x', '4x', '5x', '6x',
  '7x', '8x', '9x', '10x', '11x', '12x'
];

export const BANDEIRAS = [
  { id: 'visa', nome: 'Visa', debito: true, logo: 'assets/logos/visa.png' },
  { id: 'mastercard', nome: 'Mastercard', debito: true, logo: 'assets/logos/mastercard.png' },
  { id: 'elo', nome: 'Elo', debito: true, logo: 'assets/logos/elo.png' },
  { id: 'dinersAmex', nome: 'Diners/Amex', debito: false, logo: 'assets/logos/diners-amex.png' }
];

// Estimativa nacional para quando o cliente não conhece a distribuição real por bandeira.
// Base de referência pública: ranking de mercado brasileiro de 2024, com Mastercard em 1º,
// Visa em 2º e Elo em 3º. Os pesos abaixo (51/31/14/4) são uma aproximação operacional
// para a ferramenta e NÃO representam o mix observado do cliente. No Débito, Diners/Amex
// não se aplica e os pesos são automaticamente normalizados entre Mastercard, Visa e Elo.
export const ESTIMATIVA_BANDEIRAS_BRASIL = {
  referencia: 'Brasil · referência de mercado 2024',
  metodologia: 'Estimativa nacional para simulação quando o mix real do cliente não estiver disponível.',
  pesos: { mastercard: 51, visa: 31, elo: 14, dinersAmex: 4 }
};

export const SOLUCOES_ATUAIS = [
  'Rede', 'Getnet', 'Sipag', 'PagSeguro', 'Mercado Pago', 'Stone',
  'SafraPay', 'Outro', 'Não informado'
];

export const TIPOS_INSTITUICAO_ATUAL = ['Banco do Brasil', 'Outro banco', 'Cooperativa', 'Sem pacote'];

export const CORES_CONCORRENTES = {
  'Rede': '#F58220',
  'Getnet': '#E30613',
  'Sipag': '#556B2F',
  'PagSeguro': '#00A868',
  'Mercado Pago': '#009EE3',
  'Stone': '#00A868',
  'SafraPay': '#B58A3B',
  'Outro': '#7F7F7F',
  'Não informado': '#7F7F7F'
};

// Parametrização transcrita da aba 06_PARAMETROS da planilha-gabarito.
export const MAIS_VANTAGENS_PLANOS = {
  'Mais Vantagens 1': { mensalidadeCheia: 124.90 },
  'Mais Vantagens 2': { mensalidadeCheia: 263.00 },
  'Mais Vantagens 3': { mensalidadeCheia: 369.00 }
};

export const MAIS_VANTAGENS_FAIXAS_RECEBIMENTOS = [
  { min: 0, max: 9999.99, descontos: { 'Mais Vantagens 1': 0, 'Mais Vantagens 2': 0, 'Mais Vantagens 3': 0 } },
  { min: 10000, max: 29999.99, descontos: { 'Mais Vantagens 1': 0.25, 'Mais Vantagens 2': 0, 'Mais Vantagens 3': 0 } },
  { min: 30000, max: 49999.99, descontos: { 'Mais Vantagens 1': 0.50, 'Mais Vantagens 2': 0, 'Mais Vantagens 3': 0 } },
  { min: 50000, max: 99999.99, descontos: { 'Mais Vantagens 1': 1.00, 'Mais Vantagens 2': 0.50, 'Mais Vantagens 3': 0 } },
  { min: 100000, max: 200000, descontos: { 'Mais Vantagens 1': 1.00, 'Mais Vantagens 2': 1.00, 'Mais Vantagens 3': 0.50 } },
  { min: 200000.01, max: Infinity, descontos: { 'Mais Vantagens 1': 1.00, 'Mais Vantagens 2': 1.00, 'Mais Vantagens 3': 1.00 } }
];

export const BENEFICIOS_BB_EMPRESAS = {
  cielo: { baseReais: 5000, pontos: 50 },
  pix: { baseReais: 500, pontos: 1, limiteMensal: 10000 },
  cobranca: { minimoBoletosLiquidados: 10, pontos: 30 },
  livelo: {
    transferenciaMinimaPontos: 1000,
    limiteTransferenciaMensalPontos: 500000,
    valorReferenciaCompra1000Pontos: 70,
    referenciaValor: 'R$ 70 por 1.000 pontos — premissa de simulação informada em 19/08/2026'
  },
  limiteDemaisProdutosMensal: 70000,
  limiteTotalMPEMensal: 370000,
  limiteCartaoMPEMensal: 300000,
  limiteCartaoCorporateMensal: 380000
};

export const EQUIPAMENTOS_PADRAO = ['TEF', 'POS / Maquineta', 'Pinpad', 'Conectividade', 'Outro'];

export const COBRANCA_EVENTOS_PADRAO = [
  'Emissão', 'Liquidação', 'Pix Liquidação', 'Baixa', 'Manutenção título vencido',
  'Protesto — envio', 'Protesto — retirada', 'Serasa — envio', 'Serasa — retirada',
  'Alterações diversas'
];

export const INFORMACOES_IMPORTANTES = [
  'Esta proposta foi elaborada com base nas informações, volumes, perfil de vendas e condições comerciais considerados na data da análise. Os valores de economia, redução de custos, benefícios e impactos financeiros são estimativas e poderão variar conforme o volume efetivamente transacionado, o mix de vendas, a quantidade de transações e a utilização dos produtos e serviços.',
  'As taxas, tarifas, isenções, descontos, benefícios e estimativas de pontos estão sujeitos à validação, elegibilidade, análise cadastral e comercial, credenciamento, contratação e às regras vigentes de cada programa ou solução. Alterações nas informações, no perfil da operação ou nas regras aplicáveis poderão resultar na revisão das condições e dos resultados estimados.',
  'A análise considera o conjunto das soluções avaliadas — cartões, Pix, equipamentos, antecipação de recebíveis, cobrança, serviços bancários e demais componentes aplicáveis — e não uma condição isolada. Pontos e benefícios não integram a economia financeira em reais e sua utilização ou transferência depende das regras vigentes no momento da solicitação.',
  'A equivalência financeira eventualmente exibida para pontos Livelo é apenas uma referência de simulação baseada no custo informado para compra de pontos. Não representa valor em dinheiro, valor de resgate, garantia de conversão ou economia financeira adicional e pode variar conforme preços, promoções, descontos e regras vigentes.'
];

// A planilha recebida não contém uma regra implementada para desconto por investimentos.
// Mantemos 0 por padrão e tratamos qualquer percentual informado como premissa manual a validar.
export const PARAMETROS_PENDENTES = {
  descontoMaisVantagensPorInvestimentos: 'A regra automática por investimentos não está implementada no gabarito recebido. O campo permanece manual e sujeito a validação.',
  antecipacaoComPrazoMedio: 'O gabarito preserva Custo = Volume x Taxa. O prazo médio é informativo até que seja validada regra adicional.'
};