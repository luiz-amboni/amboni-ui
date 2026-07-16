import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Esqueleto } from './Esqueleto'

describe('Esqueleto — o leitor de tela não lê caixas vazias', () => {
  test('as formas são aria-hidden e o carregamento é anunciado UMA vez só', () => {
    const { container } = render(<Esqueleto variante="texto" linhas={4} />)

    // A armadilha: deixar as caixas visíveis à árvore de acessibilidade. A pessoa ouve
    // "grupo, grupo, grupo, grupo" e tenta navegar por quatro retângulos vazios que
    // somem em 300ms. Elas são desenho — aria-hidden.
    const formas = container.querySelectorAll('.amb-esqueleto__forma')
    expect(formas).toHaveLength(4)
    formas.forEach(f => expect(f).toHaveAttribute('aria-hidden', 'true'))

    // Quem fala é UM status no container: uma frase, uma vez.
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })

  test('usa role="status", não "alert"', () => {
    render(<Esqueleto />)
    // Carregar é informação, não emergência: não corta a frase que a pessoa está ouvindo.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('rótulo específico diz o que está carregando', () => {
    render(<Esqueleto rotulo="Carregando clientes" />)
    expect(screen.getByRole('status', { name: 'Carregando clientes' })).toBeInTheDocument()
  })

  test('anunciar={false} some inteiro da árvore de acessibilidade', () => {
    // Numa lista de 10 linhas, 10 status fazem o leitor dizer "carregando" 10 vezes.
    // O certo é silenciar os filhos e anunciar uma vez no container da lista.
    render(
      <div role="status" aria-label="Carregando clientes">
        {[0, 1, 2].map(i => (
          <Esqueleto key={i} anunciar={false} />
        ))}
      </div>,
    )
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByRole('status', { name: 'Carregando clientes' })).toBeInTheDocument()
  })
})

describe('Esqueleto — parecer texto de verdade', () => {
  test('com várias linhas, a ÚLTIMA é mais curta', () => {
    const { container } = render(<Esqueleto variante="texto" linhas={3} />)
    const formas = container.querySelectorAll<HTMLElement>('.amb-esqueleto__forma')

    // Linhas todas do mesmo comprimento não parecem parágrafo, parecem tabela cinza.
    // Parágrafo de verdade termina no meio da linha.
    expect(formas[0].style.width).toBe('100%')
    expect(formas[1].style.width).toBe('100%')
    expect(formas[2].style.width).toBe('60%')
  })

  test('uma linha só NÃO é encurtada (senão fica um toco solto)', () => {
    const { container } = render(<Esqueleto variante="texto" linhas={1} />)
    const forma = container.querySelector<HTMLElement>('.amb-esqueleto__forma')
    expect(forma?.style.width).toBe('100%')
  })

  test('linhas < 1 ainda renderiza uma (vem de `linhas={lista.length}` com lista vazia)', () => {
    const { container } = render(<Esqueleto variante="texto" linhas={0} />)
    expect(container.querySelectorAll('.amb-esqueleto__forma')).toHaveLength(1)
  })
})

describe('Esqueleto — variantes e medidas', () => {
  test('círculo usa a largura nos dois eixos (senão vira ovo)', () => {
    const { container } = render(<Esqueleto variante="circulo" largura={42} />)
    const forma = container.querySelector<HTMLElement>('.amb-esqueleto__forma')
    expect(forma?.style.width).toBe('42px')
    expect(forma?.style.height).toBe('42px')
  })

  test('número vira px, string passa direto', () => {
    const { container } = render(<Esqueleto variante="retangulo" largura="12rem" altura={180} />)
    const forma = container.querySelector<HTMLElement>('.amb-esqueleto__forma')
    expect(forma?.style.width).toBe('12rem')
    expect(forma?.style.height).toBe('180px')
  })

  test('`linhas` é ignorado fora da variante texto', () => {
    // Três avatares empilhados não é o que ninguém quis dizer com linhas={3}.
    const { container } = render(<Esqueleto variante="circulo" linhas={3} />)
    expect(container.querySelectorAll('.amb-esqueleto__forma')).toHaveLength(1)
  })

  test.each(['texto', 'circulo', 'retangulo'] as const)('variante %s', v => {
    const { container } = render(<Esqueleto variante={v} />)
    expect(container.querySelector(`.amb-esqueleto--${v}`)).toBeTruthy()
  })
})
