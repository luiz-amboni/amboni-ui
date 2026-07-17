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

## Regressão visual

Os testes de jsdom **não olham um pixel**. jsdom não faz layout: `getBoundingClientRect()`
devolve zero, CSS não é avaliado. Numa biblioteca de design, isso deixava de fora
exatamente o que ela entrega. Quem cobre essa parte é o Playwright, em
`packages/ui/visual/`, com a galeria (`packages/ui/galeria/`) de cenário.

```bash
npm run galeria -w @amboni/ui      # abre a galeria em http://127.0.0.1:5199
npm run visual:layout -w @amboni/ui   # medidas — roda em qualquer sistema
AMB_VISUAL_LOCAL=1 npm run visual -w @amboni/ui   # prints, com baseline local
```

### A baseline é do Linux. Sempre.

Chromium desenha texto e sombra com pixels diferentes em cada sistema operacional.
Baseline feita no seu Mac **reprova inteira** no Ubuntu do CI. Por isso:

- **no CI (Ubuntu)** o print roda, compara e reprova o PR — é a única fonte da verdade;
- **no seu Mac** o print é pulado por padrão. `AMB_VISUAL_LOCAL=1` liga uma baseline local
  (`__baseline-local__/`, fora do git) para você iterar. Ela **nunca** entra no commit;
- **os testes de layout rodam em todo lugar**: medem número, e número não muda com
  antialiasing. É a rede que você tem antes de abrir o PR.

**A baseline mudou de propósito?** Actions → *Atualizar baseline visual* → Run workflow. Ele
regenera no Ubuntu e abre um PR com as imagens, para alguém **olhar** antes de entrar.
Baseline que se atualiza sozinha é carimbo, não teste.

> **A baseline ainda não existe.** Ela nasce vazia — o primeiro job de regressão visual
> reprova com `A snapshot doesn't exist`, e é o esperado. Rode o workflow acima uma vez
> (motivo: `baseline inicial`) para preenchê-la. Ver
> `packages/ui/visual/__baseline__/LEIA-ME.md`.

**Reprovou e você não sabe o quê?** O job sobe o relatório como artefato quando falha:
esperado / recebido / diff lado a lado.

### A regra da cena

Nada na galeria pode mudar sozinho: **sem `Math.random()`, sem `new Date()`, sem hover, sem
animação em curso, sem imagem da rede**. Data é literal e o relógio do navegador é congelado
(`clock.setFixedTime`); as fontes são servidas do disco (`galeria/fontes/`), nunca do Google
Fonts. Um print que reprova por conta própria treina o time a rodar `--update-snapshots` sem
olhar — e aí a suíte inteira deixa de proteger qualquer coisa.

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
7. **Uma cena em `packages/ui/galeria/galeria.tsx`**, na seção do papel dele, com os
   estados que valem um pixel: normal, foco, desabilitado, erro, carregando, vazio.
   Componente fora da galeria é componente sem rede visual — e ninguém percebe a falta,
   porque o CI fica verde do mesmo jeito

A referência de API é **gerada do código** no build (`scripts/gerar-api.mjs`). Escreva o
JSDoc pensando nisso: `@default` na prop, e o "porquê" no texto. O que não estiver no
JSDoc não existe na documentação.

## Antes de abrir o PR

```bash
npm test
npx tsc -p packages/ui/tsconfig.json --noEmit
npx tsc -p apps/docs/tsconfig.json --noEmit

# Layout: mede altura, transbordo e posição num navegador de verdade. Roda no seu Mac.
npm run visual:layout -w @amboni/ui
```

O print em si só reprova no CI (a baseline é de Linux — ver acima). Se ele acusar
diferença, o relatório fica no artefato do job.

Falha de segurança **não** vem por PR nem por issue — ver [SECURITY.md](./SECURITY.md).
