import { createRef, useState } from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AreaTexto } from './AreaTexto'

/**
 * jsdom não faz layout: `scrollHeight` é sempre 0 e o autoResize não teria o que medir.
 * Trocamos o getter por um valor nosso — o que está sob teste é a REAÇÃO à medida
 * (limpar a altura antes de medir, e aplicar o resultado), não a medida do navegador.
 */
function fingirScrollHeight(px: number) {
  return vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(px)
}
afterEach(() => vi.restoreAllMocks())

describe('AreaTexto — o básico', () => {
  test('digitar dispara onChange', async () => {
    const aoMudar = vi.fn()
    render(<AreaTexto aria-label="Observação" onChange={aoMudar} />)

    await userEvent.type(screen.getByRole('textbox'), 'oi')
    expect(aoMudar).toHaveBeenCalledTimes(2)
  })

  test('o ref chega no <textarea>', () => {
    const ref = createRef<HTMLTextAreaElement>()
    render(<AreaTexto aria-label="Observação" ref={ref} />)

    expect(ref.current?.tagName).toBe('TEXTAREA')
    ref.current?.focus()
    expect(ref.current).toHaveFocus()
  })

  test('erro liga aria-invalid', () => {
    render(<AreaTexto aria-label="Observação" erro />)
    expect(screen.getByRole('textbox')).toBeInvalid()
  })

  test('aria-invalid vindo do CampoForm pinta a moldura sozinho', () => {
    const { container } = render(<AreaTexto aria-label="Observação" aria-invalid />)
    expect(container.querySelector('.amb-area__campo--erro')).toBeTruthy()
  })
})

describe('AreaTexto — contador', () => {
  test('com maxLength mostra usado/limite', async () => {
    render(<AreaTexto aria-label="Observação" maxLength={500} contador />)
    expect(screen.getByText('0/500')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox'), 'iSafe')
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })

  test('SEM maxLength conta assim mesmo, sem inventar um limite', async () => {
    // Decisão registrada no componente: contar contra nada ainda informa. Sumir com o
    // contador seria ignorar em silêncio uma prop que alguém pediu de propósito.
    render(<AreaTexto aria-label="Observação" contador />)
    await userEvent.type(screen.getByRole('textbox'), 'abc')

    expect(screen.getByText('3 caracteres')).toBeInTheDocument()
  })

  test('conta certo em campo controlado', () => {
    function Controlado() {
      const [v, setV] = useState('MacBook')
      return (
        <AreaTexto aria-label="Obs" maxLength={100} contador value={v} onChange={e => setV(e.target.value)} />
      )
    }
    render(<Controlado />)
    expect(screen.getByText('7/100')).toBeInTheDocument()
  })

  test('defaultValue já conta no primeiro render', () => {
    render(<AreaTexto aria-label="Obs" maxLength={50} contador defaultValue="oi" />)
    expect(screen.getByText('2/50')).toBeInTheDocument()
  })

  test('o contador NÃO é live region (anunciaria a cada tecla digitada)', () => {
    // Um aria-live aqui faz o leitor de tela interromper a pessoa a cada letra. O contador
    // fica legível no DOM; quem anuncia o limite é o texto de ajuda do CampoForm.
    const { container } = render(<AreaTexto aria-label="Obs" maxLength={10} contador />)
    const contador = container.querySelector('.amb-area__contador')

    expect(contador).not.toHaveAttribute('aria-live')
    expect(contador).not.toHaveAttribute('role')
  })

  test('perto do limite muda de tom — mas o número já dizia sozinho', async () => {
    render(<AreaTexto aria-label="Obs" maxLength={10} contador />)
    await userEvent.type(screen.getByRole('textbox'), '123456789')

    expect(screen.getByText('9/10')).toHaveClass('amb-area__contador--perto')
  })

  test('sem a prop `contador`, nada é renderizado', () => {
    const { container } = render(<AreaTexto aria-label="Obs" maxLength={10} />)
    expect(container.querySelector('.amb-area__contador')).toBeNull()
  })
})

describe('AreaTexto — autoResize', () => {
  test('a altura acompanha o conteúdo', async () => {
    fingirScrollHeight(120)
    render(<AreaTexto aria-label="Obs" autoResize />)

    await userEvent.type(screen.getByRole('textbox'), 'linha')
    expect(screen.getByRole('textbox')).toHaveStyle({ height: '120px' })
  })

  test('a altura ENCOLHE ao apagar — a armadilha do `height: auto`', () => {
    // scrollHeight nunca é menor que a altura atual do elemento. Sem zerar a altura antes
    // de medir, a caixa cresce e nunca mais volta: fica um buraco branco no formulário
    // depois que a pessoa apaga o texto.
    const espiao = fingirScrollHeight(200)
    const { rerender } = render(<AreaTexto aria-label="Obs" autoResize value="texto longo" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveStyle({ height: '200px' })

    espiao.mockReturnValue(48)
    rerender(<AreaTexto aria-label="Obs" autoResize value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveStyle({ height: '48px' })
  })

  test('sem autoResize a altura fica com o navegador (respeita `rows`)', async () => {
    fingirScrollHeight(300)
    render(<AreaTexto aria-label="Obs" rows={2} />)

    await userEvent.type(screen.getByRole('textbox'), 'texto')
    const el = screen.getByRole('textbox')
    expect(el.style.height).toBe('')
    expect(el).toHaveAttribute('rows', '2')
  })
})
