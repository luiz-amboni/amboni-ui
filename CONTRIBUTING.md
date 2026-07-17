# Contribuindo

Obrigado por olhar. Este documento é curto de propósito — o essencial é entender **por
que** as regras abaixo existem, não decorá-las.

## Rodando

```bash
npm ci
npm run build     # tokens primeiro: o pacote de UI depende do CSS gerado
npm test          # inclui o contrato de contraste — cor ilegível reprova aqui
npm run docs      # o site em http://localhost:5173
```

## As três regras que não se negociam

### 1. Nenhuma cor literal fora dos tokens

Nada de `#hex`, `rgb()`, `hsl()` em componente. Só `var(--amb-*)`.

Não é preferência estética. Cor literal **fura os tokens**: nenhum teste de contraste
alcança, e ela não troca com a marca nem com o tema. Foi assim que o botão "Apagar" ficou
em 3,76:1 por meses — cravava `#fff`, e o `#fff` não é variável, então não existia teste
que pudesse pegá-lo. Hoje `pacote.test.ts` reprova o build se um hex escapar para o CSS
distribuído.

Se faltar um token, o caminho é acrescentar um em `packages/tokens` — não contornar.

### 2. Semântica de verdade, não aparência de

Card clicável é `<button>`, não `<div onClick>`. Modal é `<dialog>` nativo. Título de card
é heading. Rádio usa o `name` compartilhado em vez de `onKeyDown`.

O motivo é sempre o mesmo: o navegador já sabe fazer, e faz melhor. Uma `<div onClick>` não
recebe foco, ignora Enter, e o leitor de tela não anuncia que dá para clicar — a
funcionalidade simplesmente **não existe** para quem não usa mouse. E ninguém reporta:
essas pessoas vão embora caladas.

### 3. A cor nunca é o único sinal

Cerca de 1 em cada 12 homens não distingue vermelho de verde. Um selo verde "Entregue" e
um vermelho "Falhou" são idênticos para eles.

Quem carrega o significado é o **texto**; a forma reforça; a cor é o terceiro sinal. Os
quatro tons do `Alerta` têm ícones de formatos diferentes, e há teste exigindo que os
quatro desenhos sejam únicos — para ninguém "simplificar" e unificá-los.

## Testes

Teste **comportamento e acessibilidade**, nunca classe CSS.

```tsx
// ✅ se o teste acha pelo papel, um leitor de tela também acha
expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()

// ❌ isto testa o CSS, e passa mesmo com o componente inacessível
expect(container.querySelector('.amb-btn')).toBeTruthy()
```

**Todo teste que trava uma armadilha ganha um comentário dizendo qual.** O teste é o único
lugar onde o "por quê" sobrevive a um refactor.

Duas lições que este repositório pagou caro para aprender:

- **Teste de `key` com estado controlado não protege nada.** Trocamos `chaveLinha` por
  índice numa mutação e 40 de 40 testes continuaram verdes: eles conferiam a ordem do
  texto, que o React reescreve de qualquer jeito. Use estado que só existe no DOM
  (`<input defaultValue>`).
- **`userEvent` + `vi.useFakeTimers()` trava todo `await user.click()`** no Vitest. Já está
  resolvido em `packages/ui/src/test-setup.ts` — não perca a tarde de novo.

## Comentários

Comentário **não descreve o que a linha faz**. Ele registra a decisão e o porquê: a
armadilha evitada, o bug que causaria, quem quebra sem aquilo.

```ts
// ❌ inútil
// define o tipo como button
type = 'button'

// ✅ o padrão do HTML é "submit", que dentro de um <form> envia o formulário sem
// querer. Bug clássico e difícil de achar.
type = 'button'
```

E **nunca repita um número** que o código já tem. Um comentário aqui dizia "mesma altura
do Button md" ao lado de `min-height: 40px`; era verdade no dia em que foi escrito e virou
mentira quando o token foi para 44px, sem ninguém notar. Leia o token: assim não tem como
mentir.

## Componente novo

1. `packages/ui/src/components/<Nome>.tsx` + `.css` + `.test.tsx`
2. Nome em português (os produtos que a biblioteca serve são escritos em português)
3. Classes com prefixo `amb-`, padrão BEM
4. `forwardRef` em todo controle de formulário — `react-hook-form` depende disso
5. Exportar em `src/index.ts`, no grupo certo
6. Uma página em `apps/docs/src/paginas/` e a rota em `rotas.ts`

A referência de API é **gerada do código** no build (`scripts/gerar-api.mjs`). Escreva o
JSDoc pensando nisso: `@default` na prop, e o "porquê" no texto. O que não estiver no
JSDoc não existe na documentação.

## Antes de abrir o PR

```bash
npm test
npx tsc -p packages/ui/tsconfig.json --noEmit
npx tsc -p apps/docs/tsconfig.json --noEmit
```

Falha de segurança **não** vem por PR nem por issue — ver [SECURITY.md](./SECURITY.md).
