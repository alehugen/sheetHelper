<h1 align="center">sheetHelper</h1>

<p align="center">
  Comprovantes e extratos bancários viram linhas na sua planilha financeira —
  sem que nenhum arquivo saia do seu navegador.
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="Tela do sheetHelper no tema escuro" width="100%">
</p>

---

## O problema

Fechar o mês significa abrir comprovante por comprovante, copiar data, valor e
quem pagou, e digitar tudo na planilha. É trabalho mecânico, demorado e fácil de
errar — e mandar comprovante bancário para um site qualquer para automatizar
isso não é uma opção razoável.

O sheetHelper faz essa transcrição dentro do próprio navegador, e faz mais que
gerar uma planilha nova: ele **preenche a planilha que você já usa**, devolvendo
o mesmo arquivo com as linhas novas e absolutamente nada mais alterado.

## O fluxo

```
①  Comprovantes  →  ②  Conferência  →  ③  Planilha
   PDF, foto          corrija o que      baixe uma nova
   ou extrato         foi lido           ou preencha a sua
```

Cada passo depende do anterior, e dá para voltar a qualquer momento sem perder
nada. No passo 3 você escolhe entre baixar um `.xlsx`/`.csv` novo ou subir a
planilha que já mantém e deixar o app completá-la.

## O que ele faz

- Lê **PDF do banco, foto e print** de comprovante de Pix, TED e boleto
- Lê **extrato de conta corrente**, virando uma linha por lançamento — um PDF
  com 150 Pix recebidos vira 150 linhas de uma vez
- Extrai 14 campos. Os três primeiros da planilha são os que mais importam na
  conciliação — **data, valor e remetente** — e são também os únicos tratados
  como obrigatórios
- Mostra tudo numa **tabela editável** antes de exportar, com o comprovante
  original ao lado para conferência
- **Preenche a planilha que você já usa**, preservando fórmulas, formatação e
  todo o resto do arquivo
- Avisa quando um lançamento **já existe** na sua planilha
- Guarda as **3 últimas planilhas geradas** para baixar de novo
- **3 idiomas** (pt-BR, English, Español), **2 moedas** (BRL, USD com conversão
  real) e tema claro/escuro — tudo salvo no navegador

## Rodando

```bash
npm install
npm run dev
```

Requer Node 20.19+ ou 22.12+ (exigência do Vite 8). Não há backend, banco, nem
variável de ambiente.

```bash
npm run build      # build de produção
npm run format     # prettier
```

---

# Parte 1 — Ler comprovantes

```
arquivo → extração de texto → parser → revisão do usuário → linhas
```

| Entrada                 | Caminho                                                    |
| ----------------------- | ---------------------------------------------------------- |
| PDF com camada de texto | `pdfjs-dist` lê o texto direto (rápido e exato)            |
| PDF digitalizado        | `pdfjs-dist` rasteriza as páginas → `tesseract.js` faz OCR |
| Imagem (PNG/JPG/WEBP)   | `tesseract.js` faz OCR com reconstrução de layout          |

A escolha entre os dois caminhos é automática, por densidade de caracteres por
página: abaixo de 40, o PDF é tratado como digitalizado.

Um arquivo gera **uma ou mais linhas**: um comprovante vira uma, um extrato vira
uma por lançamento.

## Reconstrução de layout no OCR

Comprovante de app é uma tabela de duas colunas. Quando a coluna do rótulo é
estreita, ele quebra em duas linhas e o texto plano do OCR embaralha tudo:

```
Favoreci  CENTRO DE EDUCACAO INFANTIL
do                                 CI
```

Por isso o OCR é pedido com `{ blocks: true }` e as coordenadas de cada palavra
são usadas para remontar as linhas
([`layout.js`](src/infrastructure/extraction/layout.js)):

1. Palavras viram linhas por sobreposição vertical.
2. Dentro da linha, o **maior vão horizontal** separa rótulo de valor — vãos
   entre palavras ficam em ~20 px, entre colunas passam de 120 px.
3. Linha cujo rótulo começa em minúscula é continuação da anterior. Fragmento de
   até 4 caracteres cola sem espaço (`Favoreci` + `do`); maior que isso entra
   como palavra nova (`Nome do` + `recebedor`).

Palavras que são seção por si só (`de`, `para`, usadas pelo Itaú) nunca são
fundidas — sem essa exceção, `de` grudava no valor da linha de cima e as seções
de pagador e recebedor desapareciam.

## Um extrator, um vocabulário

Não há um parser por banco. Há **um extrator** dirigido por um vocabulário único
([`vocabulary.js`](src/domain/receipt/parsing/vocabulary.js)) que mapeia cada
conceito — pagador, recebedor, valor, vencimento — aos seus sinônimos. O tipo do
comprovante (Pix, TED, boleto) é **resultado de classificação**, não seletor de
código: sai do mesmo vocabulário.

Ensinar um banco novo é acrescentar sinônimo em um lugar, e o sinônimo passa a
valer para todos os tipos de comprovante de uma vez.

Seções de partes aceitam duas formas de sinônimo. Os descritivos
(`quem pagou`, `conta de origem`) casam mesmo com valor na mesma linha. Os
curtos e ambíguos (`de`, `para`) só valem quando a linha **é exatamente** aquela
palavra **e** o par correspondente também aparece no documento — um `de` solto
de um parágrafo quebrado criava uma seção de pagador fantasma.

## Motor de rótulos

A extração casa rótulos ancorados no início da linha
([`labels.js`](src/domain/receipt/parsing/labels.js)). Três regras que não são
óbvias até quebrarem:

- **Fronteira de palavra obrigatória.** O rótulo `banco` não pode casar dentro
  de "UNI**BANCO** S.A." — sem isso, o banco do pagador virava `S.A`.
- **Rótulo truncado só vale se o corte for no meio de uma palavra.** `Favoreci`
  é truncamento legítimo de `Favorecido`; `data de` **não** é truncamento de
  `data de vencimento`, senão "Data de pagamento" vira vencimento.
- **Rodapé é separado do corpo.** O bloco final traz o CNPJ da instituição, que
  era capturado como CNPJ do pagador.

Dado faltando é melhor que dado errado: quando a seção do pagador ou do
recebedor não é encontrada, os campos ficam vazios em vez de receberem um chute.

## Conferência cruzada da data pelo ID Pix

O identificador ponta a ponta de um Pix não é aleatório: é
`E` + ISPB do banco (8) + `AAAAMMDD` + `HHMM` + 11 caracteres aleatórios.

```
E60701190202609221130DY5RDBWE2EU
 └─ISPB──┘└─data──┘└hora┘
          2026-09-22  11:30 UTC
```

Quando a data não é lida do texto, ela é **recuperada do ID**; quando é lida e
diverge, o comprovante recebe um aviso. A tolerância é de um dia porque o
carimbo está em UTC e o comprovante mostra o horário local.

## Conferência cruzada do boleto

Quando há linha digitável ou código de barras,
[`boletos-desc-br`](https://www.npmjs.com/package/boletos-desc-br) decodifica o
valor embutido no próprio código e o app compara com o valor lido do texto. Se
divergirem, sai um aviso — é assim que ele detecta sozinho quando o OCR erra um
dígito.

A validação de dígito verificador da biblioteca é parcial, então o código
decodificado **nunca** sobrescreve o que está escrito no comprovante: ele só
confirma, preenche lacuna ou alerta.

## Extrato de conta corrente

Extrato não é comprovante: é uma lista. O
[parser do extrato do BB](src/domain/receipt/statements/bbStatement.js) lê o par
de linhas que o banco usa para cada lançamento e resolve três coisas que o
formato impõe:

- **O indicador `C`/`D` decide quem é quem.** Crédito: a contraparte é a
  pagadora e o titular da conta é o recebedor. Débito: o inverso.
- **CPF vem preenchido com zeros à esquerda** até 14 dígitos
  (`00029220719878` → `292.207.198-78`), do mesmo tamanho de um CNPJ.
- **A quebra de página separa o lançamento do seu detalhe**, com cabeçalho e
  rodapé do navegador no meio.

---

# Parte 2 — Preencher a sua planilha

O cabeçalho da planilha é o contrato. O app lê o arquivo, descobre onde começa o
cabeçalho, quais colunas têm fórmula e onde pode escrever — e então **lista as
colunas dela** para você dizer o que preenche cada uma.

## Por que o mapeamento é coluna → campo

A planilha pode ter qualquer formato; os campos do comprovante são um conjunto
pequeno e fixo. Mapear do conhecido para o desconhecido é mais fácil e erra
menos.

Perguntar "onde vai o **Recebedor**?" faz você olhar uma coluna chamada `HS`,
ver que guarda um nome e escolher — mesmo que `HS` seja quem **pagou**.
Perguntar "o que preenche `HS`?" com os dados do comprovante em mãos elimina a
dúvida.

E como cada coluna tem **um** seletor, **um campo não pode ocupar duas colunas**:
o seletor vai se filtrando conforme você atribui. O conflito deixa de ser
possível por construção.

Numa planilha com cabeçalhos comuns (`Data`, `Valor`, `Pagador`) o app reconhece
tudo sozinho pelo mesmo motor de sinônimos usado nos comprovantes. Numa planilha
com `HS` e `VLR/A` você decide **uma vez** — e o mapa fica guardado pela
impressão digital do cabeçalho.

## Integridade do arquivo é obrigatória

O arquivo original volta intacto. A escrita mexe **apenas** nas células de
destino: preserva estilos, larguras, painel congelado, comentários, outras abas
e fórmulas, e força o Excel a recalcular ao abrir.

Isso não é promessa, é verificação. Depois de gravar, o próprio escritor reabre
o resultado e compara célula a célula com a entrada, recusando-se a entregar se:

- alguma célula **além das previstas** mudou;
- alguma célula foi **removida**;
- alguma célula foi **criada fora de uma linha nova**;
- alguma célula que **deveria** ter sido preenchida não foi.

O último caso importa tanto quanto os outros: uma escrita que silenciosamente
não acontece devolveria o arquivo inalterado como se tivesse funcionado.

## Dois modos de escrita

| Situação                                   | O que acontece                                                                                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| A planilha tem linhas vazias já formatadas | Preenche as células que já existem — sem inserir linha, criar estilo ou mexer em intervalo    |
| A planilha acaba na última linha com dado  | Cria a linha clonando os estilos da última e deslocando as referências relativas das fórmulas |

Fórmulas compartilhadas (`t="shared"`) são puladas de propósito: copiá-las sem o
mestre corromperia o arquivo.

## Deduplicação

Contra os lançamentos já existentes **e** dentro do próprio lote:

- **Duplicata** — mesmo identificador, ou mesma data, valor e pagador
- **Possível duplicata** — mesma data e valor, pagador diferente

O nome é comparado com tolerância a truncamento (`L H DAVID` casa com
`L H DAVID INTERMEDIACOES LTDA`), porque planilha real corta nome.

Medindo numa planilha de 2.121 lançamentos, **16% das linhas colidem entre si só
por data e valor** — por isso o nome não é opcional no critério. Sem ele, um em
cada seis lançamentos legítimos viraria alarme falso.

A linha recebe um aviso na tabela e você decide se remove. O app nunca descarta
sozinho.

## Roteamento de aba e sentido

Planilha com uma aba por conta bancária é comum. O app identifica o banco do
comprovante por uma [tabela de instituições](src/domain/shared/banks.js) — que
sabe que `BCO DO BRASIL` e `BB` são a mesma coisa — e casa com o nome da aba. O
sentido do lançamento (entrada ou saída) sai de comparar o titular no nome da
aba com o pagador e o recebedor.

Ambos são palpites com correção manual: cada linha tem um seletor de aba.

---

## Arquitetura

```
src/
├── domain/            regras de negócio puras (JS, sem Vue, sem libs de UI)
│   ├── shared/        dinheiro, data, CPF/CNPJ, texto, moeda, bancos
│   ├── receipt/       entidade, campos, extrator e parsers de extrato
│   └── spreadsheet/   mapeamento de colunas, duplicatas, roteamento, posicionamento
├── application/       casos de uso e portas (contratos)
├── infrastructure/    adaptadores: pdf.js, tesseract, xlsx, csv, câmbio, storage
├── presentation/      Vue: design system, views, stores, composables
├── i18n/              um arquivo JSON por idioma
└── container.js       composition root — onde tudo é ligado
```

A regra de dependência é única: as setas apontam para dentro.
`presentation → application → domain`, e `infrastructure → application`.
O domínio não conhece ninguém.

Na prática isso significa que o domínio roda no Node puro, sem bundler e sem
browser — os parsers foram desenvolvidos e testados assim, rodando direto contra
o texto de comprovantes reais.

## Pontos de extensão

| Quero adicionar                       | O que fazer                                                                                                         | O que mais muda                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Idioma**                            | Criar `src/i18n/locales/<código>.json`                                                                              | Nada — `import.meta.glob` registra, e o nome do seletor vem do `_meta.label` do próprio arquivo |
| **Moeda**                             | Uma entrada em `CURRENCIES` ([`currency.js`](src/domain/shared/currency.js))                                        | Nada — a cotação vem na mesma chamada da API e o `Intl` formata                                 |
| **Banco (para roteamento de aba)**    | Uma entrada em `BANKS` ([`banks.js`](src/domain/shared/banks.js))                                                   | Nada                                                                                            |
| **Sinônimo de comprovante**           | Acrescentar em `vocabulary.js`                                                                                      | Nada — vale para todos os tipos                                                                 |
| **Sinônimo de cabeçalho de planilha** | Acrescentar em `HEADER_VOCABULARY` ([`headers.js`](src/domain/spreadsheet/headers.js))                              | Nada                                                                                            |
| **Formato de extrato**                | Criar `src/domain/receipt/statements/<nome>.js` com `{ id, score(text), parse(lines) }` e registrar em `STATEMENTS` | Nada                                                                                            |
| **Coluna na planilha gerada**         | Uma entrada em `RECEIPT_FIELDS` + a chave em `fields` nos 3 idiomas                                                 | Nada                                                                                            |

Detectar um formato novo é pontuação, não `if`: cada parser dá uma nota ao texto
e o registry usa o vencedor, caindo num parser genérico se ninguém pontuar.

## O que conta como linha completa

Uma linha só é considerada completa quando tem **data**, **valor** e
**identificação do remetente**. A última é um grupo, não um campo: nome _ou_
CPF/CNPJ serve, porque há extratos em que o banco escreve o documento no lugar
do nome. Os grupos ficam em `REQUIRED_GROUPS`
([`ReceiptFields.js`](src/domain/receipt/ReceiptFields.js)).

No modo de preenchimento, o obrigatório é definido pelas **colunas da sua
planilha**: se ela não tem coluna de pagador, o app não barra a linha por falta
de pagador.

## Design system

A paleta é a escala neutra `ink-50` … `ink-800`
([coolors.co](https://coolors.co/palette/f8f9fa-e9ecef-dee2e6-ced4da-adb5bd-6c757d-495057-343a40-212529)),
mais três cores funcionais dessaturadas para sucesso, alerta e erro — cinza puro
não comunica estado.

Texto nunca referencia a escala direto. Os quatro tokens semânticos ficam em
[`main.css`](src/assets/styles/main.css):

| Token         | Tema claro | Contraste sobre a superfície |
| ------------- | ---------- | ---------------------------- |
| `text-title`  | `ink-800`  | 14,6:1                       |
| `text-body`   | `ink-700`  | 10,9:1                       |
| `text-muted`  | `ink-600`  | 7,8:1                        |
| `text-subtle` | `ink-500`  | 4,5:1                        |

No tema escuro a escala `ink` é invertida, então os quatro tokens acompanham sem
nenhuma variante `dark:` espalhada pelos componentes.

Movimento usa a curva `cubic-bezier(0.22, 1, 0.36, 1)`, entra em ~260 ms e sai
em ~120 ms — sair rápido é o que dá sensação de resposta. Esperas mostram
esqueleto em vez de vazio, e tudo respeita `prefers-reduced-motion`.

## Idioma, moeda e tema

As três preferências ficam no `localStorage` e são lidas na abertura. O padrão é
`pt-BR` com `BRL`.

A cotação é buscada em `open.er-api.com` apenas quando a moeda escolhida não é o
real, e fica em cache por 6 horas. É exibida sempre a partir da moeda mais forte
(`1 USD = 5,11 BRL`, não `1 BRL = 0,1956 USD`), para evitar números quebrados.
Nenhum dado de comprovante é enviado — só o código da moeda base.

O valor é **sempre guardado em reais**: a moeda escolhida afeta exibição, edição
e exportação, nunca o dado.

## Stack

|                                     |                                                    |
| ----------------------------------- | -------------------------------------------------- |
| Vue 3 + Vite                        | `<script setup>`, code splitting por rota          |
| Pinia + Vue Router                  | estado compartilhado e navegação em passos         |
| Tailwind CSS v4                     | tema em CSS via `@theme`, sem `tailwind.config.js` |
| pdfjs-dist                          | leitura de PDF e rasterização                      |
| tesseract.js                        | OCR em WebAssembly, em Web Worker                  |
| fflate                              | abre e reempacota o `.xlsx` da pessoa              |
| write-excel-file                    | geração de `.xlsx` novo                            |
| vue-i18n, vue-currency-input        | idioma e máscara de moeda                          |
| boletos-desc-br, cpf-cnpj-validator | validação de boleto e de documento                 |

O carregamento inicial é ~47 kB gzip. pdf.js (129 kB), tesseract e o gerador de
planilha só são baixados quando alguém envia um arquivo ou exporta.

### Por que essas bibliotecas

- **`write-excel-file` no lugar do SheetJS.** O pacote `xlsx` no npm está parado
  na 0.18.5 desde 2023 e acumula CVEs; a versão mantida só sai por tarball do
  CDN da SheetJS. O `exceljs` está inativo e desempacota 21 MB.
- **`fflate` e XML cru no lugar de uma lib de leitura.** Como preservar o arquivo
  exige mexer no zip e no XML de qualquer jeito, ler pelo mesmo caminho mantém
  **uma representação só** e evita 2,4 MB de dependência.
- **`boletos-desc-br` no lugar de `@mrmgomes/boleto-utils`.** O segundo é mais
  completo, mas arrasta `moment-timezone` (~200 kB).
- **CSV escrito à mão.** Separador `;` e BOM UTF-8, que é o que o Excel em
  português espera.

## Decisões técnicas

- **Datas no `.xlsx` em UTC.** O Excel guarda data como número de dias desde
  1899-12-30, calculado sobre o epoch UTC. Usar meia-noite local deslocaria a
  data em um dia para quem está em fuso positivo.
- **Dados extraídos em caixa alta.** Comprovante bancário vem em maiúsculas e
  planilha contábil espera maiúsculas. Normalizar eliminou toda a lógica de
  capitalização que existia antes.
- **Rótulos de campo fora do domínio.** `RECEIPT_FIELDS` guarda só `key`, `kind`
  e `width`. O texto vem do i18n e é passado para os escritores de planilha.
- **Layout do OCR na infraestrutura, não no domínio.** Reconstruir texto a partir
  de caixas delimitadoras é detalhe do tesseract.
- **Histórico guarda dados, não arquivos.** O `localStorage` armazena as linhas
  das 3 últimas exportações e a planilha é regerada na hora do download.
- **`cpf-cnpj-validator` só filtra achados sem rótulo.** Um CPF/CNPJ logo após o
  rótulo `CPF:` é mantido mesmo se o dígito verificador falhar, porque o OCR pode
  ter trocado um número e o usuário corrige na revisão.

## Limitações conhecidas

- OCR de foto erra dígitos. Identificadores longos são os mais afetados — por
  isso existem as conferências cruzadas e a tela de revisão.
- Os parsers foram calibrados em comprovantes de Nubank, InfinitePay, Banco do
  Brasil e Itaú, e no extrato de conta corrente do Banco do Brasil. Outros
  layouts caem no parser genérico, que acerta valor, data e hora mas costuma
  deixar as partes envolvidas em branco.
- A cotação vem de uma API pública sem chave, com cache de 6 horas. Se ela cair,
  os valores continuam em reais e a interface avisa.
- O primeiro OCR baixa ~2 MB de modelo de idioma do CDN.
- Não há testes automatizados. A verificação foi feita rodando domínio,
  infraestrutura e composables no Node contra arquivos reais, e inspecionando o
  XML do `.xlsx` gerado célula a célula.

## Autor

[Alessandro Hugen](https://www.linkedin.com/in/alehugen)
