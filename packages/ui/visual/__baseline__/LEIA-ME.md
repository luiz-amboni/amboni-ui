# A baseline

As imagens de referência do teste de regressão visual moram aqui. **Elas são geradas no
Ubuntu, pelo CI — nunca no seu Mac.**

## Por que esta pasta está vazia agora

Ela nasceu vazia de propósito, e o primeiro job de "Regressão visual" no GitHub **vai
reprovar** dizendo `A snapshot doesn't exist`. É o esperado — não é bug.

A alternativa seria eu commitar imagens geradas no macOS, e elas reprovariam **todas** no
Ubuntu do CI: Chromium desenha texto e sombra com outros pixels em cada sistema
operacional. Baseline errada é pior que baseline ausente, porque parece certa.

## Como preencher (uma vez)

**Actions → "Atualizar baseline visual" → Run workflow**, com o motivo `baseline inicial`.

Ele roda a suíte no Ubuntu, gera as imagens e abre um PR com elas. Revise o PR **olhando
cada print** — é a única vez em que ninguém pode comparar com nada, então o que entrar aqui
vira a definição de "certo" para todo mundo depois. Depois do merge, o job passa a comparar
contra estas imagens.

## Depois disso

- **Mudou de propósito?** Mesmo workflow, com o motivo de verdade. O PR existe para alguém
  olhar o diff antes de aceitar.
- **Nunca** commite imagem gerada no seu Mac (`AMB_VISUAL_LOCAL=1` escreve em
  `__baseline-local__/`, que o git ignora).

O raciocínio completo está em `packages/ui/playwright.config.ts`.
