import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

/**
 * Faz o `userEvent` conviver com `vi.useFakeTimers()`.
 *
 * Sem isto, **todo `await user.click()` trava** quando o relógio falso está ligado — até
 * num `<button>` pelado. O sintoma não tem nenhuma relação com a causa, e é por isso que
 * mora aqui e não em cada arquivo: dois componentes desta biblioteca (Aviso e Dica)
 * perderam a mesma tarde no mesmo beco, em paralelo, sem saber um do outro.
 *
 * A causa: depois de cada interação, a Testing Library drena a fila de microtasks com um
 * `setTimeout(resolve, 0)`, e só adianta o relógio para esse timer disparar se existir um
 * global `jest`. Sob o Vitest esse global não existe — ninguém adianta o relógio falso, o
 * `setTimeout(0)` nunca dispara, e a espera fica pendurada até estourar o timeout.
 *
 * O objeto abaixo é só um bilhete dizendo à Testing Library como adiantar o relógio do
 * Vitest (que é o do sinon, não o do Jest). Ele é instalado sempre, mas só tem efeito
 * quando o relógio falso está ligado — com relógio real, `advanceTimersByTime` é inócuo.
 *
 * Descartamos `shouldAdvanceTime: true`: destrava, mas faz o relógio falso correr junto
 * com o tempo real, e aí asserção de fronteira ("4999ms ainda está lá, 5001ms sumiu")
 * passa a depender da velocidade da máquina — teste instável é pior que teste ausente.
 */
;(globalThis as unknown as { jest?: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
}
