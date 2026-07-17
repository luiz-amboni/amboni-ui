# Orçamento de tamanho

Os números do `size-limit` (em `package.json`) são **medidos**, não desejados. Se um PR
passar deles, o CI reprova — é assim que "a biblioteca é leve" deixa de ser alegação de
README e vira contrato.

| | Limite | Medido hoje |
|---|---|---|
| A biblioteca inteira (JS) | 26 kB | **23,09 kB** |
| O CSS inteiro | 11 kB | **9,92 kB** |
| Importando só o `Button` | 1 kB | **317 B** |
| Uma tela de CRM típica ¹ | 12 kB | **3,66 kB** |

¹ `Button` + `Campo` + `CampoForm` + `Tabela` + `Selo` + `Paginacao`.

Tudo comprimido com brotli, que é o que o servidor entrega ao navegador. (Já falamos
"30 kB" um dia — aquilo era gzip, que comprime pior. Os dois números estão certos; medem
coisas diferentes.)

## A decisão que estava certa e ficou errada sozinha

Vale registrar, porque é a lição mais útil deste arquivo.

A biblioteca publicava **um bundle único** (`index.js`), e a escolha estava documentada
como deliberada:

> iSafe e VEAR são CRMs e usam a biblioteca quase toda. Para eles o download é a
> biblioteca inteira de qualquer jeito. Otimizar o caso "importar só o Button" seria
> otimizar um cenário que não existe aqui.

Era **razoável e verdadeira** quando escrita. Com 28 componentes, importar só o `Button`
custava 42% do pacote — ruim, mas o argumento fechava.

Aí a biblioteca foi para **39 componentes** e o mesmo número virou **64%**. Tree-shaking
degrada conforme o bundle cresce: num arquivo só, o empacotador precisa provar que cada
trecho é descartável, e a teia de referências entre componentes vai fechando o cerco. A
conta mudou sem ninguém mexer na decisão.

Trocamos para **um arquivo por componente** (`preserveModules`). Medido:

| | Antes | Depois |
|---|---|---|
| Importar só o `Button` | 52.584 B | **855 B** |
| A biblioteca inteira | 22,07 kB | 23,09 kB |

**Sessenta e uma vezes menor** no caso granular. A biblioteca inteira engordou 1 kB de
overhead de módulo — troco.

A lição não é "preserveModules é melhor". É que **uma decisão de arquitetura tomada com 28
componentes não se autorrenova aos 39** — e que decisão bem documentada é fácil de
revisar: foi o comentário explicando o porquê que deixou claro que o porquê tinha
evaporado.

Brinde: o `'use client'` passou a ser emitido **por arquivo**, que é a forma correta da
diretiva — em vez de marcar o pacote inteiro como cliente por causa dos componentes que
têm estado.

## Como conferir

```bash
npm run build
npm run size -w @amboni/ui
```
