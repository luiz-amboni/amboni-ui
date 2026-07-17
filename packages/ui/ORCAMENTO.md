# Orçamento de tamanho

Os números do `size-limit` (em `package.json`) são **medidos**, não desejados. Se um PR
passar deles, o CI reprova — é assim que "a biblioteca é leve" deixa de ser alegação de
README e vira contrato.

| | Limite | Medido hoje |
|---|---|---|
| A biblioteca inteira (JS) | 15 kB | **12,71 kB** |
| O CSS inteiro | 9 kB | **7,55 kB** |
| Importando só o `Button` | 7 kB | **5,5 kB** |

Tudo comprimido com brotli, que é o que o servidor entrega ao navegador. (Nos READMEs e
na conversa já falamos "30 kB" — aquilo era gzip, que comprime pior. Os dois números
estão certos; medem coisas diferentes.)

## Por que "só o Button" custa 5,5 kB — e por que está tudo bem

O `Button` sozinho puxa 42% da biblioteca inteira. Isso parece ruim, e um shadcn/ui
entrega um botão em ~1 kB. A diferença é arquitetura: publicamos **um arquivo só**
(`dist/index.js`), então o tree-shaking do consumidor descarta o que não é referenciado
(58%, medido), mas não consegue ser cirúrgico.

A alternativa é publicar um arquivo por componente (`preserveModules`), e aí o `Button`
sairia em 1–2 kB. **Não fizemos, e a decisão é deliberada:**

Os dois produtos que usam esta biblioteca — iSafe e VEAR — são CRMs, e um CRM usa
praticamente tudo: campo, tabela, modal, aviso, selo, paginação. Para eles, o download é
a biblioteca inteira de qualquer jeito: **12,71 kB**. Otimizar o caso "importar só o
Button" seria otimizar um cenário que não existe aqui, em troca de dezenas de arquivos no
pacote e de uma configuração de build mais frágil.

Isto vira dívida no dia em que alguém de fora quiser só o `Button`. Se acontecer, o
caminho é `preserveModules` — e este parágrafo é o aviso de que a conta muda.

## Como conferir

```bash
npm run build
npm run size -w @amboni/ui
```
