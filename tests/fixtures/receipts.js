// Comprovantes e extrato FICTÍCIOS, no formato em que o extrator os recebe
// (depois do PDF ou do OCR). Nenhum dado real de cliente entra aqui.
//
// O que foi preservado é a ESTRUTURA, que é do que o extrator depende: ordem
// das linhas, redação dos rótulos, onde o rodapé começa, agência e conta ora
// na mesma linha ora separadas, o formato do identificador Pix e a quantidade
// de dígitos de um documento mascarado. O conteúdo identificável é inventado.
//
// Os CNPJs têm dígito verificador válido, e cada máscara foi derivada do CNPJ
// completo que ela deve casar — senão os testes de documento mascarado não
// provariam nada.
//
// Nomes de instituição são mantidos de propósito: o extrator casa neles para
// achar o rodapé e para identificar o banco. O CNPJ delas, ainda assim, é
// inventado.

export const DOCUMENTOS = {
  minhaEmpresa: '22.333.444/0001-81',
  minhaEmpresaMascarado: '*****4440001**',
  pagadorItau: '11.222.333/0001-81',
  consultoria: '33.444.555/0001-81',
  escola: '44.555.666/0001-81',
  orgaoPublico: '55.666.777/0001-81',
  instituicaoRodape: '66.777.888/0001-81',
  contraparte: '77.888.999/0001-81',
  contraparteMascarado: '*****9990001**',
}

export const NOMES = {
  minhaEmpresa: 'ACME SOLUCOES FINANCEIRAS E',
  minhaEmpresaCompleto: 'ACME SOLUCOES FINANCEIRAS E DIGITAIS LTDA',
  minhaEmpresaNoExtrato: 'ACME S F D LTDA',
  pagadorItau: 'ALPHA INTERMEDIACOES LTDA',
  consultoria: 'BETA CONSULTING LTDA',
  escola: 'CENTRO EDUCACIONAL EXEMPLO CI',
  orgaoPublico: 'ORGAO PUBLICO EXEMPLO',
  contraparte: 'GAMA MANUTENCOES LTDA',
  remetente1: 'DELTA COMERCIO SO',
  remetente2: 'JOAO PEREIRA',
  destinatarioSaida: 'OMEGA CAPITAL',
}

export const CONTAS = {
  pagadorItau: '1234 / 56789-0',
  consultoriaNubank: '0001 / 123456789-0',
  minhaEmpresaBB: '1234-5 / 67890-1',
}

export const fixtures = {
  'Itaú Pix': `itaú
22 set. 2026, 08:30:23, via SISPAG no app Itaú
tipo de transferência
PIX TRANSFERENCIA
valor da transferência
R$ 7.047,00
de
${NOMES.pagadorItau}
agência 1234 - conta 56789-0
CPF ou CNPJ ${DOCUMENTOS.pagadorItau}
para
${NOMES.minhaEmpresa}
BCO DO BRASIL S.A.
CPF ou CNPJ ${DOCUMENTOS.minhaEmpresa}
chave conta@exemplo.com
ID da transação
E00000000202609221130AB1CD2EF3GH
controle
000111222333444
autenticação do comprovante
AAAA1111BBBB2222CCCC3333DDDD4444EEEE5555
Em caso de dúvidas, de posse do comprovante, contate
seu gerente ou a Central no 40901685`,

  'Nubank boleto': `Comprovante de pagamento
27 AGO 2026 - 19:22:30
Valor R$ 2.255,50
Pagador ${NOMES.consultoria}
Agência 0001
Conta 123456789-0
Documento
Favorecido ${NOMES.escola}
Emissor ITAU UNIBANCO S.A.
Vencimento 05 SET 2026
Código de barras
000010900800810074013599396900005156000002
36500
Nu Pagamentos S.A.
CNPJ ${DOCUMENTOS.instituicaoRodape}
ID da transação: 11112222-3333-4444
Estamos aqui para ajudar se você tiver alguma dúvida.`,

  'Nubank Pix': `Comprovante de pagamento
18 SET 2026 - 14:01:43
Valor R$ 960,00
Tipo de transferência Pix
Destino
Nome ${NOMES.orgaoPublico}
CNPJ 55666777000181
Instituição ITAÚ UNIBANCO S.A.
Tipo de conta Conta corrente
Origem
Nome ${NOMES.consultoria}
Instituição NU PAGAMENTOS - IP
CNPJ 33444555000181
Informações adicionais
Vencimento 21/09/2026
Nu Pagamentos S.A. - Instituição de
Pagamento
CNPJ ${DOCUMENTOS.instituicaoRodape}
ID da transação:
E00000000202609181701ab1cd2ef3gh
Estamos aqui para ajudar se você tiver alguma dúvida.`,

  InfinitePay: `Comprovante de pagamento
R$ 2.600,00
Terça + 22 Set, 2026 + 10:22
Status Aprovado
Meio Pix
Origem
Nome ${NOMES.contraparte}
CNPJ ${DOCUMENTOS.contraparteMascarado}
Instituição Cloudwalk IP LTDA
Destino
Nome ${NOMES.minhaEmpresaCompleto}
CNPJ ${DOCUMENTOS.minhaEmpresaMascarado}
Instituição BCO DO BRASIL S.A.
Chave Pix conta@exemplo.com`,

  'Extrato BB': `Consultas - Extrato de conta corrente
Agência 1234-5
Conta corrente 67890-1 ${NOMES.minhaEmpresaNoExtrato}
Período do extrato de 14 / 08 / 2026 até 31 / 08 / 2026
Lançamentos
Dt. balancete Dt. movimento Ag. origem Lote Histórico Documento Valor R$ Saldo
13/08/2026 0000 00000 000 Saldo Anterior 0,00 C
14/08/2026 0000 14397 821 Pix - Recebido 111.000.000.000.001 1.920,00 C
14/08 10:05 88999111000102 ${NOMES.remetente1}
14/08/2026 0000 14397 821 Pix - Recebido 111.000.000.000.002 7.750,00 C
14/08 10:11 99111222000149 ${NOMES.remetente2}
14/08/2026 0000 13105 144 Pix - Enviado 81.401 101.299,00 D
14/08 15:30 ${NOMES.destinatarioSaida}
31/08/2026 0000 00000 999 S A L D O 13.970,82 C`,
}
