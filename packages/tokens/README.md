# @amboni/tokens

Os tokens de design do sistema Amboni — cor, tipografia, espaço, movimento.
Funciona em **qualquer** stack (MUI, Tailwind, CSS puro), porque a saída é CSS custom properties.

```bash
npm install @amboni/tokens
```

```ts
import '@amboni/tokens/tokens.css'
```

```html
<html data-amb-brand="isafe" data-amb-theme="light">
```

Marcas: `isafe` (ciano) · `vear` (roxo) — a mesma estrutura, cores diferentes.
Modos: `light` · `dark`.

```css
.meu-card {
  background: var(--amb-color-surface);
  color: var(--amb-color-text-primary);
  border: 1px solid var(--amb-color-border-default);
  border-radius: var(--amb-raio-lg);
  padding: var(--amb-espaco-4);
}
```

## As 3 camadas

1. **Primitivos** (`cyan[500]`) — valor cru, sem opinião de uso.
2. **Semântica** (`color.brand.solid`) — significado. **Componentes usam só esta.**
3. **Tema** — a marca e o modo escolhem os valores.

É essa separação que permite o mesmo componente servir iSafe e VEAR.

## Acessibilidade é testada, não prometida

`npm test` roda o cálculo de contraste da WCAG contra **todos** os pares de todos os
temas. Cor bonita porém ilegível **quebra o build**.

Isso já pegou um problema real: texto branco sobre o ciano `#0fa6be` dá **2,91:1** —
a norma exige 4,5:1. Por isso `brand.solid` no modo claro usa o degrau 700 (6,10:1).
A marca continua sendo o 500, mas quando vira fundo de texto, escurece.

## Licença

MIT © Luiz Amboni
