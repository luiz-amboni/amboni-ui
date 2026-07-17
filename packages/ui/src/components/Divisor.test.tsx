import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divisor } from './Divisor'

describe('Divisor — o papel e a orientação', () => {
  test('sem rótulo é um separator de verdade', () => {
    // Uma <div> com uma borda em cima é um separador para o olho e nada para o resto.
    // O papel `separator` é o que faz o leitor de tela anunciar a fronteira entre seções.
    render(<Divisor />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  test('a orientação é declarada, inclusive na horizontal', () => {
    // A armadilha: o `<hr>` tem orientação implícita HORIZONTAL. No modo vertical, sem o
    // atributo, o elemento estaria mentindo — desenhado em pé e anunciado deitado.
    const { rerender } = render(<Divisor />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal')

    rerender(<Divisor orientacao="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  test.each(['fina', 'grossa'] as const)('espessura %s', espessura => {
    const { container } = render(<Divisor espessura={espessura} />)
    expect(container.querySelector(`.amb-divisor--${espessura}`)).toBeTruthy()
  })
})

describe('Divisor — com rótulo', () => {
  test('o rótulo é CONTEÚDO: ele é lido', () => {
    // O ponto do componente. Se o wrapper fosse `role="separator"`, a norma ARIA trataria
    // os filhos como decoração e este "ou" sumiria da árvore de acessibilidade — a pessoa
    // veria "ou" na tela e ouviria só "separador". É o que várias bibliotecas fazem.
    render(<Divisor rotulo="ou" />)
    expect(screen.getByText('ou')).toBeInTheDocument()
  })

  test('as linhas ao lado do rótulo são decorativas', () => {
    // Sem aria-hidden nelas, a leitura vira "separador, ou, separador": três coisas onde
    // existe uma só.
    const { container } = render(<Divisor rotulo="ou" />)
    const linhas = container.querySelectorAll('.amb-divisor__linha')
    expect(linhas).toHaveLength(2)
    linhas.forEach(linha => expect(linha).toHaveAttribute('aria-hidden', 'true'))
  })

  test('rótulo 0 continua sendo rótulo', () => {
    // `rotulo && <span>` imprimiria "0" solto e cairia no ramo errado. O componente testa
    // presença, não veracidade — mesma lição do `Boolean(ajuda)` no <CampoForm>.
    render(<Divisor rotulo={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
