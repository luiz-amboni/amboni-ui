/**
 * Junta classes, ignorando false/null/undefined.
 * Existe para não trazer a dependência `clsx` por 6 linhas — uma biblioteca deve
 * pesar o mínimo possível no bundle de quem instala.
 */
export function cx(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}
