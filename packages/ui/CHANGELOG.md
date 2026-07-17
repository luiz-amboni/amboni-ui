# @amboni/ui

## 0.2.4

### Patch Changes

- Responsividade — a resposta honesta a "o UI kit funciona em várias telas?" era "nunca
  testei". Agora testa, e três bugs reais apareceram.

  **box-sizing próprio no CSS publicado.** A biblioteca usava `width: 100%` em vários
  componentes contando que o produto tivesse escrito `* { box-sizing: border-box }`. Quase
  todo projeto tem — por isso o defeito ficava escondido até um projeto sem reset instalar o
  pacote e ver cada Card estourar a coluna em 42px, em toda largura de tela. Uma biblioteca
  não pode depender de CSS que não trouxe. O seletor é `[class*="amb-"]`, não `*`: alcança só
  os nossos elementos.

  **O número do StatCard cede tamanho, nunca dígito.** Num card estreito, "R$ 1.994,31"
  quebrava em duas linhas; um `white-space: nowrap` ingênuo só trocou a quebra por um CORTE,
  que sumia o último dígito. A saída certa foi container query: o card se mede pelo próprio
  espaço (não pela tela) e encolhe a fonte de 28 para 18px, depois esconde o ícone — o número
  por último. 28px no notebook, 18px no celular, o mesmo componente, zero código no produto.

  **A Caixa vinha de 0.2.3**, com o ✓ centrado.

  Testado em 320, 375, 768 e 1440px: nada vaza da tela. E o contrato do box-sizing é
  verificado no CSS publicado, não só no fonte.

  - @amboni/tokens@0.2.4

## 0.2.3

### Patch Changes

- **Caixa**: o ✓ ficava fora do centro e espremido.

  Dentro da marca vivem dois desenhos — o ✓ e o tracinho do estado parcial. Só um aparece por
  vez; o outro é escondido com `opacity: 0`. Mas **transparente não é ausente**: como itens de
  flex, os dois seguiam ocupando espaço lado a lado.

  Medido: o ✓ encolhia de 12 para 8px e ficava com 1px de folga de um lado e 9px do outro,
  numa caixa de 18. O `justify-content: center` estava lá e funcionava — só que centralizava
  o PAR, não o símbolo visível. Por isso ninguém achou lendo o CSS: ele parecia certo.

  Agora os dois vão para a mesma célula de um grid: empilhados, não enfileirados. Folga de
  3px nos quatro lados.

  Achado a olho nu por quem estava usando. Rádio e Interruptor foram conferidos e estão
  limpos — cada um tem um símbolo só, então não havia com quem brigar.

  - @amboni/tokens@0.2.3

## 0.2.2

### Patch Changes

- **Card**: encolhia até o tamanho do texto quando era item de um container `flex`.

  Como `<div>` ele ocupa a linha sozinho, então o defeito não aparecia. Dentro de um flex, o
  item vale `width: auto`: quatro KPIs com rótulos de comprimentos diferentes viravam quatro
  caixas de larguras diferentes — medido: 118, 327, 90 e 127 pixels.

  O `.amb-card--interactive` já tinha `width: 100%`, porque virar `<button>` deixa o
  encolhimento óbvio na hora. Como `<div>` o mesmo defeito existia e só aparecia em flex:
  mais raro, e por isso pior — passa no teste e aparece na tela de alguém.

  Achado migrando uma tela de VERDADE (Métricas do iSafe), não um exemplo. Quem tropeçou
  resolveu com um `display: flex` no pai — uma muleta no produto para um defeito da
  biblioteca. Agora há teste de layout em navegador travando as quatro larguras.

  - @amboni/tokens@0.2.2

## 0.2.1

### Patch Changes

- **Dica**: o balão pousava longe do gatilho quando a Dica era item de um `flex`.

  O invólucro é `inline-flex`, o que resolve a caixa quando ele é o container — mas não
  quando é ITEM de outro flex. Aí valia o `align-items: stretch` do pai, e o invólucro
  esticava até a altura da linha: medido, 560px de altura contra 44 do botão, com o balão
  pousando ~520px longe. Ele não sumia; pousava no meio do nada, apontando para nada.

  Não era arranjo exótico — uma barra de ações com `display: flex` é o lugar mais provável
  de existir uma Dica. Nenhum dos 974 testes podia pegar: jsdom não faz layout. O primeiro
  print de regressão visual num navegador de verdade mostrou na primeira tentativa.

  - @amboni/tokens@0.2.1

## 0.2.0

### Minor Changes

- Onze componentes novos, fechando os buracos que um CRM bate todo dia.

  **Data** — `CampoData`, `CampoPeriodo` e `Calendario`, sem nenhuma dependência de data: só
  `Intl` e `Date`. Toda data é dia local reconstruído por campos, nunca instante —
  `new Date('2026-06-15')` é UTC e vira 14/06 no Brasil —, e `somarMeses` grampeia o fim do
  mês (31/01 + 1 = 28/02, não 03/03). No celular o campo vira `<input type="date">` nativo:
  quem preenche CRM no computador digita 8 dígitos; quem está no dedo merece a roda do
  sistema.

  **`Autocomplete`** — para lista grande ou que vem do servidor, com corrida de resposta
  tratada (resposta velha não sobrescreve a nova). O combobox foi extraído para
  `utils/combobox.ts` e a `Selecao` migrada: os 32 testes dela passam sem alteração, o que
  prova que o refactor é neutro.

  **`Popover`** — o painel com conteúdo interativo, terceiro da família: `Dica` é texto no
  hover e não recebe foco, `Menu` é ação, `Popover` prende o Tab.

  Mais **`Deslizador`**, **`CampoArquivo`**, **`LinhaDoTempo`**, **`Passos`**, **`Divisor`**
  e **`Tecla`**.

  **Agora é um arquivo por componente.** Importar só o `Button` caiu de 52.584 para **855
  bytes** — 61 vezes menor. A decisão anterior (bundle único) estava certa com 28
  componentes e ficou errada sozinha aos 39: tree-shaking degrada conforme o bundle cresce.

### Patch Changes

- Updated dependencies
  - @amboni/tokens@0.2.0

## 0.1.0

### Minor Changes

- Primeira versão pública.

  **Tokens em três camadas** (primitiva → semântica → tema), 91 variáveis CSS, duas marcas
  × claro e escuro. Trocar tema é um atributo no `<html>`, não um provider: `data-amb-theme="dark"`.

  **28 componentes React**, sem nenhuma dependência de runtime além do React — nada de
  Radix, Floating UI ou TanStack por baixo. 12,7 kB de JS + 7,5 kB de CSS (brotli), com o
  orçamento conferido no CI.

  **O contraste é testado, não prometido.** Os testes rodam a fórmula da WCAG contra todo
  par de cor de todo tema e **reprovam o build** se algo ficar ilegível. Isso não é retórica:
  já pegou três bugs que estavam em produção havia meses — o azul da marca com texto branco
  em 2,91:1, o texto apagado do tema escuro em 3,75:1 e o botão "Apagar" em 3,76:1. Nenhum
  tinha sido reportado, porque contraste ruim não gera chamado: gera gente indo embora
  calada.

  Além do contraste, os 28 componentes passam pelo **axe-core** na configuração real de uso,
  e o comportamento (teclado, foco, anúncio) tem teste próprio.

  **A referência de API é gerada do código** a cada build — ela não tem como envelhecer.

  Documentação: https://luiz-amboni.github.io/amboni-ui/

### Patch Changes

- Updated dependencies
  - @amboni/tokens@0.1.0
