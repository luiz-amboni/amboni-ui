# @amboni/tokens

## 0.2.3

## 0.2.2

## 0.2.1

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
