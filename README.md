# Proposta Integrada de Pagamentos

Aplicação Web estática para análise comercial de meios de pagamento, comparação do cenário atual com uma solução proposta, dashboard executivo e proposta comercial.

O projeto foi reconstruído a partir da planilha `Proposta_Comercial.Cielo(5).xlsx`, usada como especificação funcional, referência visual, fonte de parâmetros e gabarito de testes.

## Funcionalidades

- Fluxo de entrada por 10 etapas, sem aparência de planilha.
- Cartões por modalidade e por bandeira.
- Visa, Mastercard, Elo e Diners/Amex; Diners/Amex sem Débito.
- Taxas comerciais independentes por `modalidade + bandeira`.
- Distribuição por share ou valor.
- Pix percentual, valor fixo ou percentual com teto.
- Equipamentos/POS com regra explícita de isenção.
- Antecipação, cobrança, pacote/Mais Vantagens e outros serviços.
- Benefícios BB Empresas em pontos, separados da economia financeira.
- Resultado financeiro consolidado e detalhamento por bandeira.
- Rankings de maiores economias, acréscimos e impactos absolutos.
- Dashboard executivo.
- Proposta comercial preparada para impressão/PDF.
- Salvamento local e histórico de simulações.
- Importação/exportação de simulação e backup em JSON com `schemaVersion`.
- PWA e funcionamento offline dos arquivos essenciais após o primeiro carregamento.

## Privacidade

A aplicação não possui backend e não envia dados de clientes ao GitHub ou a terceiros. Os cálculos são executados no navegador. Simulações salvas ficam no `localStorage` do dispositivo do usuário ou em arquivos JSON exportados manualmente.

Não inclua dados reais de clientes em arquivos do repositório, exemplos, testes, issues ou commits.

## Estrutura

```text
/
├── index.html
├── config/
│   └── parametros.js
├── css/
│   ├── app.css
│   ├── dashboard.css
│   ├── proposta.css
│   └── print.css
├── js/
│   ├── app.js
│   ├── state.js
│   ├── calculos.js
│   ├── cartoes.js
│   ├── pix.js
│   ├── equipamentos.js
│   ├── antecipacao.js
│   ├── cobranca.js
│   ├── mais-vantagens.js
│   ├── beneficios.js
│   ├── dashboard.js
│   ├── proposta.js
│   ├── storage.js
│   ├── validacao.js
│   └── formatters.js
├── assets/
│   ├── bb.svg
│   ├── cielo.svg
│   └── icons/app-icon.svg
├── docs/
│   ├── ARQUITETURA.md
│   ├── REGRAS_NEGOCIO.md
│   └── VALIDACAO_EXCEL.md
├── tests/
│   └── cenarios.js
├── manifest.json
├── sw.js
└── package.json
```

A aplicação utiliza uma SPA sem framework para evitar problemas de rota/404 no GitHub Pages. Dashboard e proposta são views independentes na interface, mas compartilham o mesmo estado e motor financeiro.

## Executar localmente

Por usar ES Modules e Service Worker, abra por HTTP em vez de `file://`.

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Testes

Requer Node.js recente.

```bash
npm test
```

Os testes cobrem cálculos de cartões, Pix, equipamentos, Mais Vantagens, pontos, mix por bandeira, conciliação e consolidação.

## Publicar no GitHub Pages

1. Mantenha os arquivos na branch publicada pelo repositório.
2. Em **Settings > Pages**, use **Deploy from a branch**.
3. Selecione a branch e a pasta `/ (root)`.
4. Salve e aguarde a publicação.

Todos os caminhos utilizados são relativos e compatíveis com publicação em subdiretório de projeto do GitHub Pages.

## Backup

- **Salvar simulação**: grava localmente no navegador.
- **Exportar simulação atual**: JSON de uma análise.
- **Exportar backup**: JSON de todas as simulações salvas.
- **Importar**: restaura arquivos compatíveis com o schema.

O campo `schemaVersion` permite evoluir a estrutura em versões futuras.

## Atualização de regras

Parâmetros devem ser centralizados em `config/parametros.js`. Não espalhe mensalidades, faixas ou limites de negócio dentro da interface.

Antes de alterar uma regra:

1. validar a fonte;
2. atualizar o parâmetro/motor;
3. adicionar ou ajustar teste;
4. executar `npm test`;
5. conferir Dashboard e Proposta.

## Regras pendentes

O gabarito recebido não implementa automaticamente:

- desconto Mais Vantagens por investimentos;
- efeito adicional do prazo médio na antecipação.

Esses pontos permanecem identificados como pendentes em vez de receber regras inventadas.

Consulte `docs/REGRAS_NEGOCIO.md` e `docs/VALIDACAO_EXCEL.md` para detalhes.
