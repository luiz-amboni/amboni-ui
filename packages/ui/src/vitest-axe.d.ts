import 'vitest'
import type { AxeMatchers } from 'vitest-axe/matchers'

/**
 * Ensina o TypeScript sobre o `toHaveNoViolations`.
 *
 * O `expect.extend()` acrescenta o matcher em tempo de execução, mas o TypeScript não tem
 * como saber disso — ele só enxerga a interface `Assertion` do Vitest. Sem este arquivo o
 * teste roda e o `tsc` reprova: o pior par possível, porque o teste passa e o build
 * quebra em outro lugar, sem relação aparente.
 *
 * O pacote traz os tipos; falta só costurá-los na interface do Vitest, que é o que
 * `declare module` faz.
 */
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
