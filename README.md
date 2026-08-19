# Simulador Cielo — Proposta Integrada de Pagamentos

Aplicação web estática para simulação comercial, comparação de custos, visão financeira e geração de proposta de pagamentos.

## Regimes de cotação

- **Geral por cartão**: uma condição atual e uma condição proposta por modalidade.
- **Por bandeira**: Visa, Master, Elo e Diners/Amex com mix e taxas independentes. Diners/Amex não possui Débito.

## Componentes considerados

- Cartões: Débito, Crédito à vista e 2x a 12x
- Pix
- Equipamentos / POS
- Antecipação de recebíveis
- Cobrança bancária
- Pacote / serviços bancários
- Outros serviços
- Pontos BB Empresas (campo estimativo opcional)

## Privacidade

O repositório contém somente o código da aplicação e ativos visuais. Os dados digitados durante o uso não são enviados ao GitHub.

O botão **Salvar localmente** usa `localStorage`, portanto os dados ficam armazenados no navegador daquele dispositivo até serem apagados pelo usuário/navegador. Também é possível exportar e importar uma simulação em JSON.

## GitHub Pages

O projeto é totalmente estático e pode ser publicado a partir da branch `main`, pasta `/ (root)`.
