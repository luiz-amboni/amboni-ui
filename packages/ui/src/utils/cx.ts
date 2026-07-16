/**
 * Junta classes, ignorando o que for falso.
 * Existe para não trazer a dependência `clsx` por 6 linhas — uma biblioteca deve
 * pesar o mínimo possível no bundle de quem instala.
 *
 * O `0` no tipo não é frouxidão: é o JavaScript sendo o JavaScript. `linhas && 'x'`
 * devolve `0` quando `linhas` é 0, e `itens.length && 'tem'` idem — o `&&` entrega o
 * operando da esquerda, não um booleano. Sem o `0` aqui o TypeScript reprova o uso mais
 * natural do cx e empurra todo mundo para o ternário, ou pior, para `!!linhas && 'x'`.
 * Três componentes tropeçaram nisso no mesmo dia; era a assinatura que estava errada,
 * não os três. O `filter(Boolean)` já descartava em tempo de execução.
 *
 * `number` inteiro fica de fora de propósito: `cx(altura)` seria bug, não intenção, e o
 * tipo é o único lugar onde dá para pegar isso.
 */
export function cx(...partes: Array<string | 0 | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}
