# Política de segurança

## Como reportar uma falha

**Não abra uma issue pública.** Issue é o lugar errado para isso: ela avisa o mundo
inteiro antes de existir correção, e quem lê primeiro raramente é quem conserta.

Use o canal privado do GitHub:
[**Security → Report a vulnerability**](https://github.com/luiz-amboni/amboni-ui/security/advisories/new)

Você recebe resposta em até 7 dias. Se a falha for real, o aviso público sai junto com a
correção — nunca antes.

## O que é falha aqui, e o que não é

Esta é uma biblioteca de **componentes de interface**, sem servidor, sem banco e sem
rede. Ela não lê arquivo, não faz requisição e não guarda credencial. Isso muda bastante
o que conta como vulnerabilidade.

**Conta:**

- XSS através de uma prop — se passar `{'<img onerror=...>'}` para algum componente fizer
  o navegador executar aquilo, é falha nossa. O React escapa por padrão, então isso só
  aconteceria onde a biblioteca contorna o padrão.
- Qualquer coisa que force `dangerouslySetInnerHTML` no consumidor para uso normal.
- Dependência comprometida no pacote publicado.
- O pacote publicado carregar código de fora (ele não faz — e não deve passar a fazer).

**Não conta** (mas mande mesmo assim, como bug):

- Falha de acessibilidade. É levada a sério — tem teste que reprova o build —, mas não é
  buraco de segurança e não precisa de canal privado.
- `npm audit` acusando dependência de **desenvolvimento**. O pacote publicado não tem
  dependência de runtime além do React (que é `peerDependency`): o que roda na máquina de
  quem instala é só o nosso código. Vulnerabilidade no Vite ou no Vitest afeta quem
  desenvolve a biblioteca, não quem a usa.

## Superfície do pacote publicado

O que vai para o npm são dois arquivos e o texto da licença:

| | |
|---|---|
| Dependências de runtime | nenhuma |
| `peerDependencies` | `react`, `react-dom` |
| Conteúdo do pacote | `dist/index.js`, `dist/styles.css`, tipos, `LICENSE` |
| Script de instalação | nenhum (sem `postinstall`) |
| Acesso a rede/disco | nenhum |
| Procedência | assinada (`npm publish --provenance`) — dá para provar que o pacote saiu deste repositório, neste commit |

## Como conferir por conta própria

Não confie nesta página; ela é texto. Rode:

```bash
npm view @amboni/ui dist.tarball        # o que exatamente foi publicado
npm audit --omit=dev                    # vulnerabilidade no que de fato roda
```

O contrato do pacote também é testado — `packages/ui/src/pacote.test.ts` lê o `dist/` e
reprova o build se aparecer cor literal, se o React for empacotado junto (duas cópias do
React quebram hooks) ou se a diretiva `'use client'` sumir.
