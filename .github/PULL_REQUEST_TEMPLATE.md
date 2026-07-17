## O que muda, e por quê

<!-- O "por quê" importa mais. O "o que" o diff já conta. -->

## Como você conferiu

<!-- Não "rodei os testes" — o CI faz isso. O que você OLHOU? Testou por teclado?
     Conferiu nos dois temas? Nas duas marcas? -->

## Checklist

- [ ] `npm test` passa (inclui contraste WCAG e axe)
- [ ] `npx tsc -p packages/ui/tsconfig.json --noEmit` limpo
- [ ] **Zero cor literal** — só `var(--amb-*)`. Hex fura os tokens: nenhum teste alcança e ele não troca com a marca nem com o tema
- [ ] Testei **por teclado** (Tab, setas, Enter, Esc)
- [ ] Se há cor comunicando algo, **existe também texto ou forma** dizendo o mesmo
- [ ] Os comentários dizem **por quê**, não o que a linha faz
- [ ] `npx changeset` se isto muda algo publicado

## Se mexeu em componente

- [ ] Ele está no `packages/ui/src/a11y.test.tsx`
- [ ] O JSDoc tem `@default` nas props com padrão — **a referência da doc é gerada dele**; o que não está lá não existe na documentação
