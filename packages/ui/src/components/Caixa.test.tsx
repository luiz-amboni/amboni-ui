import { createRef } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Caixa } from './Caixa'

describe('Caixa — o input nativo continua lá', () => {
  test('o rótulo acha o controle (prova que label/input estão ligados)', () => {
    render(<Caixa label="Aceito os termos" />)
    // Se este teste cair, o componente virou uma <div> desenhada: sem esta ligação
    // não há leitor de tela, não há clique no texto e não há autofill.
    expect(screen.getByLabelText('Aceito os termos')).toBeInTheDocument()
  })

  test('é um <input type="checkbox"> de verdade, não uma div fantasiada', () => {
    render(<Caixa label="X" />)
    const caixa = screen.getByLabelText('X')
    expect(caixa.tagName).toBe('INPUT')
    expect(caixa).toHaveAttribute('type', 'checkbox')
  })

  test('o ref chega no input nativo — react-hook-form registra por ele', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Caixa ref={ref} label="X" />)
    // Um ref apontando para o wrapper compila igual e quebra o formulário inteiro.
    expect(ref.current?.tagName).toBe('INPUT')
    expect(ref.current?.type).toBe('checkbox')
    expect(ref.current).toBe(screen.getByLabelText('X'))
  })
})

describe('Caixa — o que a pessoa faz', () => {
  test('clicar no TEXTO do rótulo marca', async () => {
    render(<Caixa label="Aceito os termos" />)
    // 18px de quadrado é alvo pequeno demais no dedo: todo mundo mira no texto.
    await userEvent.click(screen.getByText('Aceito os termos'))
    expect(screen.getByLabelText('Aceito os termos')).toBeChecked()
  })

  test('Espaço marca (teclado)', async () => {
    render(<Caixa label="X" />)
    const caixa = screen.getByLabelText('X')
    caixa.focus()
    await userEvent.keyboard(' ')
    expect(caixa).toBeChecked()
  })

  test('desabilitada não marca', async () => {
    const mudou = vi.fn()
    render(<Caixa label="X" disabled onChange={mudou} />)
    await userEvent.click(screen.getByText('X'))
    expect(mudou).not.toHaveBeenCalled()
    expect(screen.getByLabelText('X')).not.toBeChecked()
  })

  test('o onChange de quem usa continua chegando com o evento nativo', async () => {
    const mudou = vi.fn()
    render(<Caixa label="X" onChange={mudou} />)
    await userEvent.click(screen.getByLabelText('X'))
    expect(mudou).toHaveBeenCalledTimes(1)
    expect(mudou.mock.calls[0][0].target.checked).toBe(true)
  })
})

describe('Caixa — indeterminado (a armadilha)', () => {
  test('liga a PROPRIEDADE do DOM: não existe atributo `indeterminate`', () => {
    render(<Caixa label="Todos" indeterminado />)
    const caixa = screen.getByLabelText<HTMLInputElement>('Todos')
    // `<input indeterminate>` no JSX não faria nada. Só a propriedade liga o estado
    // misto — e é ela que ativa o `:indeterminate` do CSS, que desenha o traço.
    expect(caixa.indeterminate).toBe(true)
  })

  test('anuncia "mixed" ao leitor de tela', () => {
    render(<Caixa label="Todos" indeterminado />)
    expect(screen.getByLabelText('Todos')).toHaveAttribute('aria-checked', 'mixed')
  })

  test('sem indeterminado NÃO escreve aria-checked (quem manda é o estado nativo)', () => {
    render(<Caixa label="Todos" defaultChecked />)
    // Reescrever `checked` em ARIA é como as caixas "acessíveis" mentem sobre o
    // próprio estado: o ARIA congela e o nativo segue mudando.
    expect(screen.getByLabelText('Todos')).not.toHaveAttribute('aria-checked')
  })

  test('deixa de ser misto quando a prop volta a false', () => {
    const { rerender } = render(<Caixa label="Todos" indeterminado />)
    rerender(<Caixa label="Todos" indeterminado={false} />)
    const caixa = screen.getByLabelText<HTMLInputElement>('Todos')
    expect(caixa.indeterminate).toBe(false)
    expect(caixa).not.toHaveAttribute('aria-checked')
  })
})

describe('Caixa — apoio e erro', () => {
  test('a descrição é lida junto com o rótulo, não só vista', () => {
    render(<Caixa label="Receber avisos" descricao="no máximo um por semana" />)
    expect(screen.getByLabelText('Receber avisos')).toHaveAccessibleDescription(
      'no máximo um por semana',
    )
  })

  test('o erro é texto lido, não só borda vermelha', () => {
    render(<Caixa label="Aceito" erro="é obrigatório aceitar para continuar" />)
    const caixa = screen.getByLabelText('Aceito')
    // Cor não é sinal: quem não distingue vermelho precisa receber a mesma informação.
    expect(caixa).toHaveAccessibleDescription('é obrigatório aceitar para continuar')
    expect(caixa).toHaveAttribute('aria-invalid', 'true')
  })

  test('sem erro não há aria-invalid pendurado', () => {
    render(<Caixa label="X" />)
    expect(screen.getByLabelText('X')).not.toHaveAttribute('aria-invalid')
  })

  test('não engole o aria-describedby de quem usa o componente', () => {
    render(
      <>
        <span id="externo">vindo de fora</span>
        <Caixa label="X" descricao="daqui" aria-describedby="externo" />
      </>,
    )
    expect(screen.getByLabelText('X')).toHaveAccessibleDescription('vindo de fora daqui')
  })
})
