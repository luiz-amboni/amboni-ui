<div align="center">

# @amboni/ui

**Um design system para produtos de verdade.**
Neutro (funciona com MUI, Tailwind ou CSS puro) · Temável · Acessível por prova.

</div>

---

## Por que existe

Dois CRMs, duas stacks, duas marcas — e o mesmo problema: cor cravada no código.
Só o VEAR tinha **522 hex hardcoded**, 313 deles a mesma cor da marca. Trocar um tom
significava busca-e-substitui em 42 arquivos.

Esta biblioteca resolve isso na raiz: **uma fonte da verdade**, tipada, testada e
publicada.

## Pacotes

| Pacote | O que é |
|---|---|
| [`@amboni/tokens`](packages/tokens) | Cor, tipografia, espaço, movimento. CSS vars — serve qualquer stack. |
| `@amboni/ui` | Componentes React em cima dos tokens. *(em construção)* |

## Princípios

**1. Acessibilidade é calculada, não opinada.**
O contraste de todo par de cores é verificado pela fórmula da WCAG no `npm test`. Se
reprovar, o build quebra. Já pegou um botão primário ilegível em produção.

**2. Temável desde o primeiro dia.**
`isafe` (ciano) e `vear` (roxo) usam os mesmos componentes. Marca nova = uma linha.

**3. Comportamento não se reinventa.**
Foco preso em diálogo, navegação por teclado, leitor de tela — isso é onde bibliotecas
caseiras morrem. Os componentes se apoiam em primitivos headless testados pela indústria,
e colocam o design por cima.

**4. O nome diz a intenção.**
`color.text.muted`, não `color.cinzaClaro`. `color.danger.bg`, não `color.vermelho100`.

## Desenvolvimento

```bash
npm install
npm run build    # gera o CSS a partir dos tokens
npm test         # inclui o contrato de acessibilidade
```

## Licença

MIT © Luiz Amboni
