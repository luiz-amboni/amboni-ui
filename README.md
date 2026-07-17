<div align="center">

# @amboni/ui

**O contraste é testado, não prometido.**

Design system em React: neutro (convive com MUI, Tailwind ou CSS puro), temável por
atributo, e com a legibilidade **verificada por teste que reprova o build**.

[![CI](https://github.com/luiz-amboni/amboni-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/luiz-amboni/amboni-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@amboni/ui?color=0e7490)](https://www.npmjs.com/package/@amboni/ui)
[![tamanho](https://img.shields.io/badge/brotli-12.7%20kB%20%2B%207.5%20kB%20CSS-0e7490)](packages/ui/ORCAMENTO.md)
[![licença](https://img.shields.io/npm/l/@amboni/ui?color=0e7490)](LICENSE)

**[📖 Documentação e exemplos ao vivo →](https://luiz-amboni.github.io/amboni-ui/)**

</div>

---

## A diferença

Quase todo design system diz ser acessível. Este **prova** — e a prova já custou caro para
quem estava errado: nós mesmos.

Os testes rodam a fórmula de contraste da WCAG contra todo par de cor de todo tema. Cor
ilegível não vira ticket: **quebra o build**. Isso pegou três bugs que estavam em produção
havia meses, em dois CRMs de verdade:

| O que | Contraste | Norma |
|---|---|---|
| Azul da marca com texto branco — o botão principal do CRM | **2,91:1** | 4,5:1 |
| Texto apagado do tema escuro — o motivo de um valor ausente | **3,75:1** | 4,5:1 |
| Botão "Apagar" | **3,76:1** | 4,5:1 |

Nenhum tinha sido reportado. **Contraste ruim não gera chamado — gera gente indo embora
calada.** E quem escolhe a cor da marca costuma ter a melhor visão da sala, num monitor
bom, com luz controlada: o problema é invisível de onde a decisão é tomada.

Contraste, porém, é a parte fácil — é aritmética. Por isso os 28 componentes também passam
pelo **axe-core** na configuração real de uso, e o comportamento (teclado, foco, o que o
leitor de tela anuncia) tem teste próprio. São **739 testes**.

## Instalação

```bash
npm install @amboni/ui @amboni/tokens
```

```tsx
import '@amboni/tokens/tokens.css'   // as variáveis
import '@amboni/ui/styles.css'       // o estilo dos componentes
import { Button } from '@amboni/ui'
```

```html
<html data-amb-brand="isafe" data-amb-theme="dark">
```

É isso. Trocar de marca ou de tema é **um atributo** — sem provider, sem re-render, sem
recarregar. O navegador cascateia as variáveis sozinho.

## Pacotes

| Pacote | O que é |
|---|---|
| [`@amboni/tokens`](packages/tokens) | 91 tokens em três camadas (primitiva → semântica → tema). CSS vars: serve React, Vue ou HTML puro. |
| [`@amboni/ui`](packages/ui) | 28 componentes React sobre os tokens. |

## Os 28

**Ação** — `Button` · `Menu`
**Formulário** — `CampoForm` · `Campo` · `AreaTexto` · `Selecao` · `Caixa` · `Radio` · `Interruptor`
**Dados** — `Card` · `StatCard` · `Tabela` · `EstadoVazio`
**Identidade** — `Selo` · `Etiqueta` · `Avatar`
**Retorno** — `Alerta` · `Aviso` (toast) · `Giro` · `Progresso` · `Esqueleto`
**Sobreposição** — `Dialogo` · `Gaveta` · `Dica`
**Navegação** — `Abas` · `Acordeao` · `Trilha` · `Paginacao`

Nomes em português: os produtos que a biblioteca serve são escritos em português, e
`<Caixa>` ao lado de `<Cliente>` lê melhor que `<Checkbox>`.

## Peso

**12,7 kB de JS + 7,5 kB de CSS** (brotli), com o orçamento
[conferido no CI](packages/ui/ORCAMENTO.md): se um PR passar do limite, reprova.

Isso vem de duas escolhas. **CSS puro com variáveis** em vez de CSS-in-JS — zero
JavaScript em tempo de execução só para pintar, e nenhum flash de estilo no SSR. E **zero
dependência de runtime** além do React: nada de Radix, Floating UI ou TanStack por baixo.

O comportamento difícil foi escrito aqui — o modal usa o `<dialog>` nativo (top layer, sem
guerra de z-index), as abas têm *roving tabindex* e navegação por seta de verdade, o
grupo de rádio deixa o `name` compartilhado fazer o trabalho em vez de reimplementar
teclado. **O preço é conhecido e está escrito**: o `Menu` não detecta a borda da janela, a
`Dica` não faz *flip*, o `Selecao` buscável esbarra num bug do VoiceOver no Safari.

## O que torna isto diferente de um kit qualquer

- **A referência de API é gerada do código** a cada build. Não tem como envelhecer.
- **As limitações estão escritas.** Cada componente documenta o que não faz, e por quê.
- **Os erros também.** As decisões carregam a história do bug que as motivou — inclusive
  os nossos. O `Button` conta por que o padrão dele é `type="button"`; o `Selo` conta por
  que a variante sólida inverte um par testado em vez de inventar cor.
- **A cor nunca é o único sinal.** Cerca de 1 em cada 12 homens não distingue vermelho de
  verde: um selo que só muda de cor não muda de nada. Há teste exigindo que os quatro
  ícones do `Alerta` sejam desenhos distintos, para ninguém "simplificar" e unificá-los.
- **Semântica de verdade.** Card clicável é `<button>`, não `<div onClick>` — que não
  recebe foco, ignora Enter, e não é anunciada. Para quem não usa mouse, a funcionalidade
  simplesmente não existe. E essas pessoas não reclamam: vão embora.

## Convivendo com o que você já tem

Não é tudo-ou-nada. O CSS tem prefixo `amb-` e não colide com o que já está na página.

```ts
// MUI: alimente o createTheme com os mesmos tokens, e os dois param de divergir
import { construirTema } from '@amboni/tokens'
const t = construirTema('isafe', 'light')
```

```css
/* Tailwind */
@theme { --color-brand: var(--amb-color-brand-solid); }
```

Guias completos de [MUI](https://luiz-amboni.github.io/amboni-ui/#/guia-mui) e
[Tailwind](https://luiz-amboni.github.io/amboni-ui/#/guia-tailwind).

## Desenvolvimento

```bash
npm ci
npm run build     # tokens primeiro: a UI depende do CSS gerado
npm test          # contraste WCAG + axe + comportamento
npm run docs      # o site
```

[Como contribuir](CONTRIBUTING.md) · [Segurança](SECURITY.md) · [Mudanças](packages/ui/CHANGELOG.md)

## Licença

MIT © Luiz Amboni
