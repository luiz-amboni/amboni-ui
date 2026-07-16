import { useState } from 'react'
import { describe, test, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Gaveta } from './Gaveta'

/* Mesmo dublê do <dialog> do Dialogo.test.tsx — o jsdom 25 não implementa showModal,
 * close nem o evento cancel. Repetido de propósito: importar de outro arquivo de teste
 * arrastaria as suítes dele para dentro desta, que rodariam duas vezes. É a duplicação
 * mais barata do que a alternativa. Ver o comentário longo em Dialogo.test.tsx. */
const abertos: HTMLDialogElement[] = []

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    if (this.open) throw new DOMException('já aberto', 'InvalidStateError')
    this.open = true
    abertos.push(this)
    this.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')?.focus()
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    const i = abertos.indexOf(this)
    if (i >= 0) abertos.splice(i, 1)
    this.dispatchEvent(new Event('close'))
  }
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return
    const topo = abertos[abertos.length - 1]
    if (topo && topo.dispatchEvent(new Event('cancel', { cancelable: true }))) topo.close()
  })
})

function Exemplo({ onFechar, ...props }: Partial<Parameters<typeof Gaveta>[0]>) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button onClick={() => setAberto(true)}>Abrir</button>
      <Gaveta
        aberto={aberto}
        onFechar={() => { setAberto(false); onFechar?.() }}
        titulo="Filtros"
        {...props}
      >
        <p>conteúdo da gaveta</p>
      </Gaveta>
    </>
  )
}

describe('Gaveta', () => {
  test('abre com nome acessível e conteúdo', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument()
    expect(screen.getByText('conteúdo da gaveta')).toBeInTheDocument()
  })

  test.each(['esquerda', 'direita', 'baixo'] as const)('lado %s', async lado => {
    render(<Exemplo lado={lado} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog')).toHaveClass(`amb-gaveta--${lado}`)
  })

  test('direita é o padrão', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog')).toHaveClass('amb-gaveta--direita')
  })

  test('o size vira a classe do Dialogo — é ela que o CSS da Gaveta traduz em medida', async () => {
    render(<Exemplo size="lg" />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const gaveta = screen.getByRole('dialog')
    expect(gaveta).toHaveClass('amb-dialogo--lg')
    expect(gaveta).toHaveClass('amb-gaveta')
  })

  test('herda o Esc do Dialogo — inclusive avisando o onFechar', async () => {
    // A Gaveta é o Dialogo por dentro justamente para não ter uma segunda versão deste
    // bug para consertar. O teste existe para provar que a herança está de pé.
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })

    await userEvent.click(abrir)
    await userEvent.keyboard('{Escape}')
    expect(fechou).toHaveBeenCalledTimes(1)

    // E reabre — o buraco clássico.
    await userEvent.click(abrir)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('herda o foco de volta e a trava da rolagem', async () => {
    render(<Exemplo />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })

    await userEvent.click(abrir)
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(abrir).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  test('rodapé: é onde mora o "Aplicar" de uma gaveta de filtro', async () => {
    render(<Exemplo rodape={<button>Aplicar</button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })
})
