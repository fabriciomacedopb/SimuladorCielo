# Mapa de regras de negócio migradas do Excel

Planilha-gabarito: `Proposta_Comercial.Cielo(5).xlsx`.

## 1. Dados da proposta

Cliente, CNPJ, agência, gerente, solução atual, data da análise, validade e observações são inputs. Não há resultados financeiros gravados manualmente no estado.

## 2. Cartões

Modalidades preservadas individualmente: Débito, Crédito à vista e 2x a 12x.

### Volume por modalidade

- SHARE: `faturamento total × share da modalidade`.
- VALOR: valor informado diretamente; o share é calculado sobre o total.
- Em SHARE, soma esperada = 100%.
- Em VALOR, a soma deve conciliar com o faturamento total quando este for informado como referência.

### Bandeiras

Visa, Mastercard, Elo e Diners/Amex. Diners/Amex não é elegível no Débito.

### Distribuição por bandeira

É independente das taxas:

- SHARE: `volume da modalidade × share da bandeira`.
- VALOR: valor informado por bandeira.
- Cada modalidade com volume deve conciliar a 100% ou ao respectivo valor da modalidade.

### Condições comerciais

Cada `modalidade + bandeira` possui `taxaAtual` e `taxaCielo` independentes. Não existe fallback para taxa média. Médias ponderadas são somente indicadores auxiliares.

### Custo

`volume da combinação × taxa`.

`impacto mensal = custo atual - custo Cielo`.

`impacto 12 meses = impacto mensal × 12`.

## 3. Pix

Três modos de interface:

- Percentual.
- Valor fixo por transação.
- Percentual com teto por transação.

Para percentual com teto, calcula-se o custo percentual sobre o ticket médio por transação e aplica-se o menor entre o custo calculado e o teto.

## 4. Equipamentos

`custo = quantidade cobrada × mensalidade unitária`.

A quantidade isenta só reduz o custo quando `isencaoAplicavel = true`. Não existe zeramento automático por simples preenchimento da quantidade isenta.

## 5. Antecipação

Regra preservada no gabarito: `custo = volume × taxa`.

O prazo médio permanece informativo porque a planilha recebida não contém fórmula adicional associada a esse campo.

## 6. Cobrança

Cada evento calcula `quantidade × tarifa`. Os eventos são somados para formar o custo atual, custo proposto e impacto.

O volume de recebimentos elegíveis é separado do custo de cobrança e é utilizado apenas como componente de elegibilidade/desconto no Mais Vantagens.

## 7. Pacote / Mais Vantagens

Mensalidades cheias parametrizadas:

- Mais Vantagens 1: R$ 124,90.
- Mais Vantagens 2: R$ 263,00.
- Mais Vantagens 3: R$ 369,00.

Faixas por recebimentos preservadas da aba `06_PARAMETROS`.

O desconto aplicado é o maior entre desconto por recebimentos e desconto por investimentos. Eles não são somados.

`mensalidade efetiva = mensalidade cheia × (1 - desconto aplicado)`.

`impacto = mensalidade atual - mensalidade efetiva`.

O desconto por investimentos permanece uma **premissa manual a validar**, porque o gabarito recebido não possui regra automática implementada para sua apuração.

Status separado da decisão de simular benefício:

- A VALIDAR.
- VALIDADO.
- NÃO ELEGÍVEL.

## 8. Recebimentos elegíveis Mais Vantagens

Derivados sem redigitação de:

- cartões/Cielo;
- Pix;
- cobrança;
- BB Pay, quando informado.

Esses volumes afetam o desconto do pacote, mas não duplicam economia de tarifas/taxas.

## 9. Outros serviços

Itens flexíveis com custo atual, custo proposto, impacto mensal e 12 meses.

## 10. Benefícios BB Empresas

Regras existentes no gabarito:

- Cielo: 50 pontos a cada R$ 5.000 faturados.
- Pix: 1 ponto a cada R$ 500 recebidos, limitado a 10.000 pontos/mês.
- Cobrança: 30 pontos quando houver pelo menos 10 boletos liquidados/mês.
- Demais produtos considerados pelo motor: limite de 70.000 pontos/mês.

Pontos são exibidos como benefício e **não entram na economia em reais**.

## 11. Consolidação

Componentes financeiros:

Cartões + Pix + Equipamentos + Antecipação + Cobrança + Pacote/Mais Vantagens + Outros.

`cenário atual total = soma dos custos atuais`.

`cenário proposto total = soma dos custos propostos`.

`impacto mensal = atual - proposto`.

`impacto 12 meses = mensal × 12`.

## 12. Regras pendentes de validação

1. Motor automático de desconto Mais Vantagens por investimentos.
2. Eventual uso do prazo médio para alterar a metodologia de antecipação.
3. Arquivos oficiais dos logos Visa, Mastercard, Elo e Diners/Amex não estavam incorporados como mídias na planilha recebida; a interface usa identificação textual sem redesenhar as marcas até que os arquivos sejam fornecidos.
