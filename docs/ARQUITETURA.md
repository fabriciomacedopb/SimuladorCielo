# Arquitetura — Proposta Integrada de Pagamentos

## Objetivo

Aplicação Web estática, executada integralmente no navegador e compatível com GitHub Pages. O projeto evita transportar a experiência de uma planilha para a Web e separa as regras financeiras da camada de apresentação.

## Decisão de navegação

Foi adotada uma **Single Page Application sem framework**. Dashboard, proposta e resultados são views do mesmo `index.html`, evitando rotas que possam gerar 404 no GitHub Pages. A aplicação não depende de servidor, build ou API.

## Camadas

- `config/parametros.js`: parâmetros e listas de apoio.
- `js/state.js`: schema e estado central.
- `js/cartoes.js`: distribuição, bandeiras e custos de cartões.
- `js/pix.js`: custos Pix.
- `js/equipamentos.js`: equipamentos/POS.
- `js/antecipacao.js`: antecipação.
- `js/cobranca.js`: cobrança.
- `js/mais-vantagens.js`: plano, elegibilidade financeira e mensalidade efetiva.
- `js/beneficios.js`: pontos BB Empresas.
- `js/calculos.js`: consolidação financeira.
- `js/validacao.js`: validações de consistência.
- `js/storage.js`: localStorage, exportação e importação JSON.
- `js/dashboard.js`: apresentação executiva.
- `js/proposta.js`: proposta comercial e impressão.
- `js/app.js`: shell, stepper e eventos da interface.

## Privacidade

Não há backend. Dados digitados não são enviados ao GitHub, nem gravados no repositório. Persistência ocorre apenas no `localStorage` do navegador ou em JSON exportado pelo usuário.

## Precisão financeira

Valores monetários são convertidos para centavos inteiros. Taxas são convertidas para unidades de 0,0001 ponto percentual e custos de cartão são acumulados em microcentavos antes do arredondamento final. O rateio por share usa alocação de centavos com reconciliação para reduzir diferenças de arredondamento.

## PWA

`manifest.json` e `sw.js` habilitam instalação e cache dos arquivos essenciais. Após o primeiro carregamento bem-sucedido, os arquivos principais podem ser utilizados offline.
