import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tecla } from './Tecla'

describe('Tecla', () => {
  test('renderiza <kbd>, não um <span> pintado', () => {
    // A armadilha é achar que isto é só desenho. `<kbd>` diz "isto é uma tecla que você
    // aperta"; um <span> com borda diz "isto é um texto qualquer com uma borda".
    render(<Tecla>K</Tecla>)
    expect(screen.getByText('K').tagName).toBe('KBD')
  })

  test('aceita rótulo acessível para símbolo mudo', () => {
    // ⌘ sozinho é anunciado como "sinal de local de interesse" — ou como nada, dependendo
    // do leitor de tela. O componente não adivinha o nome, mas deixa passar o rótulo.
    render(<Tecla aria-label="Command">⌘</Tecla>)
    expect(screen.getByLabelText('Command')).toBeInTheDocument()
  })

  test('a combinação são duas teclas, com o + fora', () => {
    // Duas caixinhas, e o "+" como texto normal: ele não é uma tecla do atalho e não pode
    // ganhar borda de tecla. `Ctrl+K` dentro de um <kbd> só desenharia uma caixa comprida.
    const { container } = render(
      <p>
        <Tecla>Ctrl</Tecla> + <Tecla>K</Tecla>
      </p>,
    )
    const teclas = container.querySelectorAll('kbd')
    expect(teclas).toHaveLength(2)
    expect([...teclas].map(t => t.textContent)).toEqual(['Ctrl', 'K'])
  })

  test('a classe do produto soma, não substitui', () => {
    const { container } = render(<Tecla className="minha">K</Tecla>)
    expect(container.querySelector('kbd')).toHaveClass('amb-tecla', 'minha')
  })
})
