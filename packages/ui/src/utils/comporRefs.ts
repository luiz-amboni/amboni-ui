import type { Ref } from 'react'

/**
 * Junta vários refs num só.
 *
 * Existe aqui, em 8 linhas, para não trazer dependência. Nasceu dentro do Menu e saiu para
 * cá quando o Popover precisou da mesma coisa: os dois clonam um gatilho que **já pode ter
 * um ref do consumidor**, e substituir esse ref em vez de compor apagaria em silêncio uma
 * ligação alheia (o `useRef` que o produto usa para rolar até o botão, por exemplo).
 */
export function comporRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (valor: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(valor)
      else if (r) (r as { current: T | null }).current = valor
    }
  }
}
