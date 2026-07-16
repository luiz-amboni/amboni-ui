import { createRef } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Interruptor } from './Interruptor'

describe('Interruptor — é um switch, não uma caixa', () => {
  test('tem role="switch"', () => {
    render(<Interruptor label="Enviar dicas automáticas" />)
    // Não é preciosismo: o leitor de tela anuncia switch como "ligado/desligado" e
    // checkbox como "marcado/desmarcado". Um vale AGORA, o outro espera o "Salvar".
    // Usar o errado mente sobre o que vai acontecer no clique.
    expect(screen.getByRole('switch', { name: 'Enviar dicas automáticas' })).toBeInTheDocument()
  })

  test('NÃO se anuncia como checkbox', () => {
    render(<Interruptor label="X" />)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  test('por baixo continua um checkbox nativo — é de onde vêm teclado e `checked`', () => {
    render(<Interruptor label="X" />)
    const chave = screen.getByRole('switch')
    expect(chave.tagName).toBe('INPUT')
    expect(chave).toHaveAttribute('type', 'checkbox')
  })

  test('o rótulo acha o controle', () => {
    render(<Interruptor label="Enviar dicas automáticas" />)
    expect(screen.getByLabelText('Enviar dicas automáticas')).toBeInTheDocument()
  })

  test('o ref chega no input nativo', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Interruptor ref={ref} label="X" />)
    expect(ref.current?.type).toBe('checkbox')
    expect(ref.current).toBe(screen.getByRole('switch'))
  })
})

describe('Interruptor — o que a pessoa faz', () => {
  test('clicar no TEXTO do rótulo aciona', async () => {
    render(<Interruptor label="Enviar dicas automáticas" />)
    await userEvent.click(screen.getByText('Enviar dicas automáticas'))
    expect(screen.getByRole('switch')).toBeChecked()
  })

  test('Espaço aciona (teclado)', async () => {
    render(<Interruptor label="X" />)
    const chave = screen.getByRole('switch')
    chave.focus()
    await userEvent.keyboard(' ')
    expect(chave).toBeChecked()
    // De novo desliga: interruptor não é caminho sem volta.
    await userEvent.keyboard(' ')
    expect(chave).not.toBeChecked()
  })

  test('avisa quem usa com o estado novo — a ação vale na hora', async () => {
    const salvarAgora = vi.fn()
    render(<Interruptor label="X" onChange={e => salvarAgora(e.target.checked)} />)
    await userEvent.click(screen.getByRole('switch'))
    expect(salvarAgora).toHaveBeenCalledWith(true)
  })

  test('desabilitado não aciona', async () => {
    const mudou = vi.fn()
    render(<Interruptor label="X" disabled onChange={mudou} />)
    await userEvent.click(screen.getByText('X'))
    expect(mudou).not.toHaveBeenCalled()
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  test('a descrição é lida junto com o rótulo', () => {
    render(<Interruptor label="Enviar dicas" descricao="começa no próximo ciclo, às 9h" />)
    // É onde cabe o aviso de que vale na hora — e ele precisa ser OUVIDO, não só visto.
    expect(screen.getByRole('switch')).toHaveAccessibleDescription(
      'começa no próximo ciclo, às 9h',
    )
  })

  test.each(['sm', 'md'] as const)('tamanho %s', s => {
    const { container } = render(<Interruptor size={s} label="X" />)
    expect(container.querySelector(`.amb-interruptor--${s}`)).toBeTruthy()
  })

  test('md é o padrão', () => {
    const { container } = render(<Interruptor label="X" />)
    expect(container.querySelector('.amb-interruptor--md')).toBeTruthy()
  })
})
