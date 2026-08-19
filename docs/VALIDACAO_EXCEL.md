# Validação Excel × Web

## Gabarito analisado

`Proposta_Comercial.Cielo(5).xlsx`

Abas identificadas:

- `00_INSTRUCOES`
- `01_ENTRADA`
- `02_CALCULOS`
- `03_COMPARATIVO`
- `04_DASHBOARD`
- `05_PROPOSTA_CLIENTE`
- `05B_CONDICOES_BANDEIRAS`
- `06_PARAMETROS`

## Casos automatizados

`tests/cenarios.js` valida:

1. Visa Débito: R$ 10.000 a 1,20% vs 0,78% → R$ 120,00 vs R$ 78,00 → impacto R$ 42,00.
2. Pix: R$ 220.000 / 1.000 transações / 0,49% → R$ 1.078,00.
3. Pix percentual com teto por transação.
4. Equipamentos: 11 × R$ 59,90 vs 11 × R$ 19,90 → R$ 440,00/mês.
5. Regra explícita de isenção de equipamentos.
6. Benefícios BB Empresas: R$ 800 mil em cartões + R$ 220 mil em Pix → 8.440 pontos/mês e 101.280/12 meses.
7. Faixas Mais Vantagens da aba `06_PARAMETROS`.
8. Maior desconto entre recebimentos e investimentos, sem soma.
9. Desconto integral MV3 acima de R$ 200 mil elegíveis.
10. Alteração de mix por bandeira altera o resultado sem alterar taxas.
11. Reconciliação de centavos em rateio por share.
12. Taxa ausente em combinação com volume bloqueia a consolidação.
13. Total consolidado igual à soma dos componentes, sem duplicação.

## Observação sobre o cenário preenchido no arquivo

O arquivo recebido contém um exemplo em que a distribuição por bandeira está incompleta e o próprio controle da aba `01_ENTRADA` marca a seção para revisão. Além disso, o histórico da planilha ainda contém um total de cartões calculado por lógica anterior de taxas consolidadas. A aplicação Web segue a regra mais recente definida para o projeto: **taxas comerciais por bandeira sem substituição por taxa média**. Por esse motivo, o total global desse exemplo não é utilizado como teste de regressão enquanto o mix de todas as modalidades não estiver completo.

## Como executar

```bash
npm test
```

Todos os testes devem terminar com `pass` e zero falhas antes de publicar alterações no motor financeiro.
