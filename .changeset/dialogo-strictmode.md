---
"@amboni/ui": patch
---

Dialogo: o modal fechava sozinho no StrictMode

`close()` do `<dialog>` não dispara o evento na hora — ele é enfileirado. A limpeza do
efeito levantava a bandeira `fechandoPeloReact`, chamava `close()` e a baixava na linha
seguinte, antes de o evento chegar. Quando chegava, encontrava `false` e chamava
`onFechar()`.

Em desenvolvimento, onde o StrictMode roda efeito → limpeza → efeito, isso derrubava o
modal recém-aberto: a limpeza fechava, o segundo efeito reabria, e o evento atrasado
fechava de novo. Para quem estava olhando, o modal não abria e o botão parecia morto.
Medido num app real: o `<dialog>` entrava no DOM aos 106 ms e sumia, sem erro no console.

A bandeira passou a ser consumida por quem recebe o evento.

O dublê de `<dialog>` usado nos testes disparava `close` de forma síncrona, e por isso
nenhum teste pegava. Agora ele enfileira, como o navegador — com o dublê fiel, dois testes
reprovam sem a correção.
