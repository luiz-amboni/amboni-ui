import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Selo } from './Selo'

describe('Selo — a cor nunca é o único sinal', () => {
  test('o significado está no TEXTO, não na cor', () => {
    // O teste que mais importa neste componente. Um selo verde "Entregue" e um vermelho
    // "Falhou" são o MESMO selo para quem não distingue vermelho de verde (1 em cada 12
    // homens), para quem imprime em preto e branco e para quem usa leitor de tela.
    // Se um dia alguém "simplificar" o selo para só a bolinha, isto reprova.
    render(
      <>
        <Selo tom="sucesso" pontinho>Entregue</Selo>
        <Selo tom="perigo" pontinho>Falhou</Selo>
      </>,
    )
    expect(screen.getByText('Entregue')).toBeInTheDocument()
    expect(screen.getByText('Falhou')).toBeInTheDocument()
  })

  test('o pontinho é decorativo — não substitui o texto nem fala sozinho', () => {
    const { container } = render(<Selo tom="sucesso" pontinho>Entregue</Selo>)
    const ponto = container.querySelector('.amb-selo__pontinho')
    // Se o pontinho fosse anunciado, o leitor de tela leria lixo antes do rótulo.
    expect(ponto).toHaveAttribute('aria-hidden', 'true')
  })

  test('selo sem texto avisa em desenvolvimento (o tipo não pega `cond && texto`)', () => {
    // `children={false}` passa pelo TypeScript e chega aqui como bolinha muda.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // @ts-expect-error — children é obrigatório de propósito; aqui simulamos o furo real
    render(<Selo tom="sucesso" pontinho />)
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('sem texto'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})

describe('Selo — tons e variantes', () => {
  test.each(['neutro', 'marca', 'sucesso', 'aviso', 'perigo', 'info'] as const)('tom %s', tom => {
    const { container } = render(<Selo tom={tom}>Texto</Selo>)
    expect(container.querySelector(`.amb-selo--${tom}`)).toBeTruthy()
  })

  test.each(['suave', 'solido', 'contorno'] as const)('variante %s', v => {
    const { container } = render(<Selo variante={v}>Texto</Selo>)
    expect(container.querySelector(`.amb-selo--${v}`)).toBeTruthy()
  })

  test('o padrão é neutro + suave: um selo não pede atenção sem motivo', () => {
    const { container } = render(<Selo>Rascunho</Selo>)
    expect(container.querySelector('.amb-selo--neutro')).toBeTruthy()
    expect(container.querySelector('.amb-selo--suave')).toBeTruthy()
  })

  test('aceita className e resto de props sem perder as próprias classes', () => {
    // Quem instala precisa conseguir posicionar o selo (margem numa célula, por ex.)
    // sem que isso apague o estilo do componente.
    const { container } = render(<Selo className="minha-margem" data-testid="x">Ativo</Selo>)
    const selo = screen.getByTestId('x')
    expect(selo).toHaveClass('amb-selo')
    expect(selo).toHaveClass('minha-margem')
    expect(container.querySelector('.amb-selo--neutro')).toBeTruthy()
  })
})
