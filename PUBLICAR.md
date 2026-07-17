# Como publicar

## O fluxo normal

1. **Descreva a mudança** — no PR, junto com o código:
   ```bash
   npx changeset
   ```
   Ele pergunta o que mudou e se é `patch` / `minor` / `major`. O arquivo gerado vai no
   commit. Isso não publica nada: só registra a intenção enquanto o contexto ainda está
   fresco na cabeça de quem fez.

2. **Suba a versão** quando for a hora de soltar:
   ```bash
   npx changeset version   # consome os changesets, escreve o CHANGELOG, bumpa os package.json
   git commit -am "chore: versão"
   git push
   ```

3. **Crie a Release no GitHub** (Releases → Draft a new release → tag `v0.1.0`).
   O workflow `publicar.yml` roda sozinho: build, testes (contraste, axe, comportamento),
   orçamento de tamanho e `changeset publish`.

**Publicar é um ato explícito.** Não sai por push — sai por Release. É de propósito: o
`main` recebe commit o dia todo, e nenhum deles deveria poder chegar sozinho na máquina
de quem instalou.

## Os dois pacotes sobem juntos, sempre

`@amboni/ui` lê as variáveis que `@amboni/tokens` gera. Publicar um token novo sem a UI
correspondente deixa quem instalou com componente lendo `var(--amb-algo)` que não existe —
e o sintoma é a **tela sem cor, sem erro nenhum no console**. Por isso o `.changeset/config.json`
declara os dois em `fixed`: versão casada custa alguns bumps a mais e elimina a classe
inteira de bug.

## O `NPM_TOKEN` — e como se livrar dele

### Hoje: precisa (só para a primeira vez)

O `publicar.yml` lê `secrets.NPM_TOKEN`. Para criá-lo:

1. npmjs.com → **Access Tokens** → Generate New Token
2. Permissão **Read and write**, escopo **All packages**
3. Cole em `github.com/luiz-amboni/amboni-ui/settings/secrets/actions` → New repository
   secret → nome exatamente **`NPM_TOKEN`**

### Depois da primeira publicação: apague o token

O npm tem **Trusted Publishing** com OIDC desde julho de 2025: o GitHub prova quem é para
o npm com uma credencial de vida curta, amarrada a este repositório e a este workflow. Sem
segredo guardado, nada para vazar, nada para rotacionar. É estritamente melhor.

**A pegadinha:** só dá para configurar em pacote que **já existe** — a tela vive nas
configurações do pacote publicado. Ovo e galinha: a primeira publicação precisa do token.

Depois que `@amboni/ui@0.1.0` estiver no ar:

1. npmjs.com → o pacote → **Settings** → **Trusted Publisher** → GitHub Actions
2. Repositório `luiz-amboni/amboni-ui`, workflow `publicar.yml`
3. Repita para `@amboni/tokens`
4. **Apague o `NPM_TOKEN`** do GitHub e revogue no npm

O workflow já tem `permissions: id-token: write`, que é o que o OIDC exige — não muda
nada nele. E aí a procedência passa a ser automática: com trusted publishing o npm assina
sozinho, sem `--provenance`.

⚠️ O npm **não valida** a configuração ao salvar. Nome do repositório ou do workflow
errado só aparece na hora de publicar, como falha.

## Conferir antes

```bash
npm pack -w @amboni/ui --dry-run   # o que exatamente vai subir
npm run size -w @amboni/ui         # o orçamento
npm test                           # contraste, axe, comportamento
```

## Depois

```bash
npm view @amboni/ui                # está lá?
npm view @amboni/ui dist.tarball   # o conteúdo publicado
```

E o mais honesto de todos: crie um projeto vazio, instale o pacote **do registro** (não do
workspace) e monte uma tela. É a única forma de descobrir o que o `npm link` esconde —
como o `'use client'` que faltava e só aparecia num build de Next de verdade.
