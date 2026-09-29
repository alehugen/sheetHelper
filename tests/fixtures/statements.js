// Fatura de cartão FICTÍCIA, no formato em que o extrator a recebe (camada de
// texto do PDF). Nenhum dado real entra aqui.
//
// A ESTRUTURA é o que foi preservado, porque é dela que o parser depende:
//
//   · cabeçalho com vencimento e período vigente
//   · páginas de "alternativas de pagamento", que são SIMULAÇÕES — trazem
//     valores grandes que não são lançamentos e precisam ser ignorados
//   · RESUMO DA FATURA ATUAL, que fecha:
//     anterior + pagamento + compras + IOF + outros = total a pagar
//   · PRÓXIMAS FATURAS, onde o emissor declara o saldo já comprometido
//   · TRANSAÇÕES, com subtotal por titular, quatro dígitos do cartão,
//     parcela "N/M", compra internacional em três linhas e linha de IOF
//   · "Pagamentos e Financiamentos", com sinal de menos U+2212 (−), não hífen
//
// Os números foram escolhidos para o resumo fechar de verdade, senão o teste
// do guarda de integridade não provaria nada.

export const TOTAIS = {
  anterior: 800.0,
  pagamento: -900.0,
  comprasTodosCartoes: 1538.0,
  iof: 2.1,
  outros: 50.0,
  total: 1490.1,
  subtotalTitular: 1440.1,
  saldoProximaFatura: 1030.0,
  saldoTotal: 5230.0,
  outroCartao: 100.0,
}

export const faturaNubank = `Olá, Fulano.
Esta é a sua fatura de
agosto, no valor de
R$ 1.490,10
Data de vencimento: 10 AGO 2026
Período vigente: 03 JUL a 03 AGO
Limite total do cartão de crédito: R$ 10.000,00
1 de 6
FULANO DE TAL EXEMPLO
FATURA 10 AGO 2026 EMISSÃO E ENVIO 03 AGO 2026
Alternativas de pagamento para a sua
fatura no valor de R$ 1.490,10
1. Pagar o valor total da fatura
Pagamento total da fatura
R$ 1.490,10
2. Parcele a sua fatura
Parcelar em 3
meses
Parcelar em 6
meses
Total a pagar
Valor de entrada
Valor da parcela
Juros totais
(4,35% a.m.)
IOF
CET
R$ 1.470,00 R$ 1.562,00
R$ 0,00
R$ 490,00
R$ 110,00
R$ 12,00
66,71% ao ano
R$ 0,00
R$ 260,33
R$ 197,00
R$ 17,00
66,31% ao ano
3. Faça o pagamento mínimo e entre no rotativo
Pagamento mínimo de
R$ 0,00
2 de 6
FULANO DE TAL EXEMPLO
FATURA 10 AGO 2026 EMISSÃO E ENVIO 03 AGO 2026
Nu Pagamentos S.A.
CNPJ 66.777.888/0001-81
Juros rotativo 16,1% ao mês CET 503,15% ao ano
3 de 6
FULANO DE TAL EXEMPLO
FATURA 10 AGO 2026 EMISSÃO E ENVIO 03 AGO 2026
RESUMO DA FATURA ATUAL
Fatura anterior   R$ 800,00
Pagamento recebido   −R$ 900,00
Total de compras de todos os cartões, 03 JUL a 03 AGO   R$ 1.538,00
IOF de compras internacionais   R$ 2,10
Outros lançamentos   R$ 50,00
Total a pagar   R$ 1.490,10
Pagamento mínimo para não ficar em atraso R$ 0,00
PRÓXIMAS FATURAS
Fechamento da próxima fatura 03 SET 2026
Saldo em aberto da próxima fatura   R$ 1.030,00
Saldo em aberto total   R$ 5.230,00
LIMITES DISPONÍVEIS
Utilizado Disponível
Limite total R$ 4.740,10 R$ 10.000,00
4 de 6
FULANO DE TAL EXEMPLO
FATURA 10 AGO 2026 EMISSÃO E ENVIO 03 AGO 2026
TRANSAÇÕES   DE 03 JUL A 03 AGO
Fulano Exemplo   R$ 1.440,10
03 JUL   Transação de Tag de Pedágio   R$ 21,50
03 JUL   •••• 1111   Loja Exemplo Movel - Parcela 5/10   R$ 150,00
03 JUL   •••• 1111   Otica Exemplo - Parcela 2/5   R$ 300,00
04 JUL   Magazine Exemplo - Pagamento - Parcela 9/10   R$ 80,00
05 JUL   •••• 2222   Cia Aerea Exemplo - Parcela 1/8   R$ 500,00
06 JUL •••• 2222 Servico Exemplo Intl
USD 10.00
Conversão: USD 1 = R$ 6,00
R$ 60,00
06 JUL   IOF de "Servico Exemplo Intl"   R$ 2,10
09 JUL   •••• 2222   Streaming Exemplo   R$ 40,00
13 JUL   Transporte Exemplo - Pagamento   R$ 25,00
20 JUL   •••• 1111   Mercado Exemplo   R$ 120,00
25 JUL   •••• 1111   Mercado Exemplo   R$ 120,00
5 de 6
FULANO DE TAL EXEMPLO
FATURA 10 AGO 2026 EMISSÃO E ENVIO 03 AGO 2026
TRANSAÇÕES   DE 03 JUL A 03 AGO
02 AGO   Transação de Tag de Pedágio   R$ 21,50
Pagamentos e Financiamentos   -R$ 780,00
03 JUL   Pagamento em 03 JUL   −R$ 900,00
03 JUL Parcelamento de Compra "Farmacia Exemplo" - Parcela 2/2
Total a pagar: R$ 240,00 (valor da transação de R$ 230,00 + R$ 2,00 de
IOF + R$ 8,00 de juros) divididos em 2 parcelas de R$ 120,00.
R$ 120,00
6 de 6`

// Fatura FICTÍCIA no formato do Itaú, que é bem diferente do Nubank:
//
//   · a parcela vem nua — "02/06" — e é indistinguível de uma data se você
//     não usar a posição na linha (data no começo, parcela antes do valor)
//   · a categoria vem na linha DE BAIXO, junto da cidade
//   · o nome do estabelecimento é truncado e às vezes a cidade vem colada
//   · existe uma seção de PARCELAS FUTURAS que repete as mesmas compras —
//     somá-la junto com as atuais infla a fatura, que foi o primeiro bug
//   · os totais declarados encadeiam: compras + internacionais = atuais

export const TOTAIS_ITAU = {
  anterior: 500.0,
  pagamento: -500.0,
  compras: 380.0,
  internacionais: 20.0,
  iof: 0.7,
  internacionaisComIof: 20.7,
  atuais: 400.7,
  total: 400.7,
  proximaFatura: 200.0,
  totalFuturo: 800.0,
}

export const faturaItau = `FULANO DE TAL EXEMPLO
Resumo da fatura em R$
Total da fatura anterior   500,00
Pagamento efetuado em 10/08/2026 -500,00
Saldo financiado 0,00
Lançamentos atuais   400,70
Total desta fatura   400,70
Pagamento mínimo:
R$ 20,04
Valor total financiado R$ 400,70 100,00%
Encargos R$ 60,00 -
Total a pagar R$ 460,70 -
Com vencimento em:
10/09/2026
Limite total de crédito:
R$ 10.000,00
Cartão 1234.XXXX.XXXX.5678
Pagamentos efetuados
DATA VALOR EM R$
10/08 PAGAMENTO DEB AUTOMATIC -500,00
Total dos pagamentos   -500,00
Lançamentos: compras e saques
FULANO DE TAL EXEM
DATA ESTABELECIMENTO VALOR EM R$
02/08 MERCADO EXEMPLOCURITIBA 100,00
supermercado CURITIBA
15/05 LOJA EXEMPLO M 02/06 200,00
vestuário SAO PAULO
04/08 RESTAURANTE EXEMPLOCUR 50,00
restaurante CURITIBA
06/08 FARMACIA EXEMPLOCURITI 30,00
saúde CURITIBA
Lançamentos no cartão   380,00
Lançamentos internacionais
07/08 SERVICO EXEMPLO INTER 20,00
3,70 BRL 0,70
Dólar de Conversão R$ 5,40
Total transações inter. em R$   20,00
Repasse de IOF em R$   0,70
Total lançamentos inter. em R$   20,70
Total dos lançamentos atuais   400,70
Compras parceladas - próximas faturas
DATA ESTABELECIMENTO VALOR EM R$
15/05 LOJA EXEMPLO M 03/06 200,00
Próxima fatura   200,00
Total para próximas faturas   800,00
Encargos cobrados nesta fatura
Credito Rotativo / Atraso
Valor original da dívida 0,00`
