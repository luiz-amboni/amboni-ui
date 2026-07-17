import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Passos, type Passo } from './Passos'

const passos: Passo[] = [
  { id: 'dados', titulo: 'Dados' },
  { id: 'endereco', titulo: 'Endereço', descricao: 'CEP e número' },
  { id: 'pagamento', titulo: 'Pagamento' },
  { id: 'revisao', titulo: 'Revisão' },
]

describe('Passos — onde a pessoa está', () => {
  test('só o passo atual tem aria-current="step"', () => {
    // Sem isto a régua é decoração: quem usa leitor de tela vê quatro títulos e nenhum
    // deles diz "é aqui que você está".
    const { container } = render(<Passos passos={passos} atual={1} />)
    const atuais = container.querySelectorAll('[aria-current="step"]')
    expect(atuais).toHaveLength(1)
    expect(atuais[0]).toHaveTextContent('Endereço')
  })

  test('passo atual COM erro continua sendo o atual', () => {
    // A armadilha de derivar aria-current do estado em vez do índice: um passo que falhou
    // na validação é exatamente onde a pessoa está — e é onde ela precisa voltar.
    const comErro = passos.map((p, i) => (i === 1 ? { ...p, estado: 'erro' as const } : p))
    const { container } = render(<Passos passos={comErro} atual={1} />)
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Endereço')
  })

  test('índice fora da faixa prende na borda em vez de quebrar', () => {
    // `?etapa=99` colado na URL não é erro de programação, é terça-feira.
    const { container } = render(<Passos passos={passos} atual={99} />)
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent('Revisão')
  })
})

describe('Passos — cada estado tem uma FORMA, não só uma cor', () => {
  test('as quatro formas são distintas entre si', () => {
    // O invariante da casa. Se `concluido` e `atual` diferissem só no verde e no azul, a
    // régua não diria nada para quem não distingue as duas cores — nem no preto e branco.
    const comErro: Passo[] = [
      { id: 'a', titulo: 'A' }, // concluído (antes do atual)
      { id: 'b', titulo: 'B', estado: 'erro' },
      { id: 'c', titulo: 'C' }, // atual
      { id: 'd', titulo: 'D' }, // futuro
    ]
    const { container } = render(<Passos passos={comErro} atual={2} />)
    const formas = [...container.querySelectorAll('.amb-passos__marca')].map(m =>
      m.getAttribute('data-amb-forma'),
    )
    expect(formas).toEqual(['check', 'alerta', 'numero-cheio', 'numero-vazado'])
    expect(new Set(formas).size).toBe(4)
  })

  test('concluído e erro dizem o estado por PALAVRA, não só pela marca', () => {
    // A marca (✓, !) é aria-hidden — é símbolo, e símbolo não informa. Mesma decisão do
    // asterisco do <CampoForm>: quem carrega o sentido é o texto.
    const lista: Passo[] = [
      { id: 'a', titulo: 'Dados' },
      { id: 'b', titulo: 'Endereço', estado: 'erro' },
      { id: 'c', titulo: 'Pagamento' },
    ]
    render(<Passos passos={lista} atual={2} />)
    expect(screen.getByText('Dados')).toHaveTextContent('(concluído)')
    expect(screen.getByText('Endereço')).toHaveTextContent('(com erro)')
    // O passo atual NÃO ganha palavra: quem conta isso é o aria-current, e repetir viraria
    // "Pagamento, atual, passo atual".
    expect(screen.getByText('Pagamento')).not.toHaveTextContent('(')
  })

  test('a marca é decorativa', () => {
    const { container } = render(<Passos passos={passos} atual={1} />)
    container.querySelectorAll('.amb-passos__marca').forEach(m => {
      expect(m).toHaveAttribute('aria-hidden', 'true')
    })
  })
})

describe('Passos — navegação', () => {
  test('sem onIrPara, NADA é botão', () => {
    // Um <button> que não faz nada mente para quem navega por teclado: a pessoa para em
    // cima, aperta Enter e não acontece nada. Se não há para onde ir, não há parada.
    render(<Passos passos={passos} atual={2} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  test('sem onIrPara não vira marco de navegação', () => {
    // <nav> entra na lista de regiões da página e promete caminhos. Régua de indicação
    // não tem caminho nenhum — seria um marco que leva ao nada.
    render(<Passos passos={passos} atual={2} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Etapas' })).toBeInTheDocument()
  })

  test('passo FUTURO não é clicável — pular etapa quebra a validação', () => {
    // A regra do componente. O formulário chegaria no fim sem dados obrigatórios, e o erro
    // apareceria longe de onde nasceu.
    render(<Passos passos={passos} atual={1} onIrPara={() => {}} />)
    expect(screen.queryByRole('button', { name: /Pagamento/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Revisão/ })).not.toBeInTheDocument()
  })

  test('passo futuro também não está na ordem de foco fingindo ser clicável', async () => {
    render(<Passos passos={passos} atual={1} onIrPara={() => {}} />)
    // Só o passo concluído ("Dados") é alcançável por Tab. Nada mais.
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /Dados/ })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: /Dados/ })).not.toHaveFocus()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  test('passo CONCLUÍDO é botão e volta para revisar', async () => {
    const irPara = vi.fn()
    render(<Passos passos={passos} atual={2} onIrPara={irPara} />)

    await userEvent.click(screen.getByRole('button', { name: /Dados/ }))
    expect(irPara).toHaveBeenCalledWith(0, passos[0])
  })

  test('passo com ERRO é botão — é para lá que a pessoa precisa voltar', async () => {
    const irPara = vi.fn()
    const comErro = passos.map((p, i) => (i === 1 ? { ...p, estado: 'erro' as const } : p))
    render(<Passos passos={comErro} atual={2} onIrPara={irPara} />)

    await userEvent.click(screen.getByRole('button', { name: /Endereço/ }))
    expect(irPara).toHaveBeenCalledWith(1, comErro[1])
  })

  test('o passo ATUAL não é botão — não se navega para onde já se está', () => {
    // Mesma regra da <Trilha>: um alvo que não leva a lugar nenhum é só mais uma parada.
    render(<Passos passos={passos} atual={2} onIrPara={() => {}} />)
    expect(screen.queryByRole('button', { name: /Pagamento/ })).not.toBeInTheDocument()
  })

  test('os botões são type="button" — dentro de <form> não enviam o formulário', () => {
    render(<Passos passos={passos} atual={2} onIrPara={() => {}} />)
    screen.getAllByRole('button').forEach(b => expect(b).toHaveAttribute('type', 'button'))
  })
})

describe('Passos — o anúncio do avanço', () => {
  test('role="status" diz "Passo 2 de 4: Endereço"', () => {
    // Sem isto, quem usa leitor de tela aperta "Continuar", o conteúdo troca e nada é
    // dito: a pessoa não sabe se avançou, se deu erro ou se o botão não funcionou.
    render(<Passos passos={passos} atual={1} />)
    expect(screen.getByRole('status')).toHaveTextContent('Passo 2 de 4: Endereço')
  })

  test('a região viva existe ANTES de mudar — é o oposto do role="alert"', async () => {
    // A regra que quase todo mundo erra: `alert` precisa ser MONTADO com a mensagem;
    // `status` precisa estar SEMPRE no DOM com o texto trocando dentro. Uma região viva
    // que nasce junto com o texto passa despercebida em parte dos leitores de tela.
    const { rerender } = render(<Passos passos={passos} atual={0} />)
    const regiao = screen.getByRole('status')
    expect(regiao).toHaveTextContent('Passo 1 de 4: Dados')

    rerender(<Passos passos={passos} atual={1} />)
    // O MESMO nó, com texto novo. Se o React tivesse remontado, o anúncio se perderia.
    expect(screen.getByRole('status')).toBe(regiao)
    expect(regiao).toHaveTextContent('Passo 2 de 4: Endereço')
  })

  test('o anúncio é só para leitor de tela — na tela a régua já mostra tudo', () => {
    render(<Passos passos={passos} atual={1} />)
    expect(screen.getByRole('status')).toHaveClass('amb-sr-only')
  })

  test('lista vazia não anuncia "Passo 1 de 0"', () => {
    render(<Passos passos={[]} atual={0} />)
    expect(screen.getByRole('status').textContent).toBe('')
  })
})

describe('Passos — estrutura', () => {
  test('é um <ol>: a ordem das etapas É a informação', () => {
    render(<Passos passos={passos} atual={1} />)
    const lista = screen.getByRole('list')
    expect(lista.tagName).toBe('OL')
    expect(within(lista).getAllByRole('listitem')).toHaveLength(4)
  })

  test('o conector entre passos é decorativo', () => {
    const { container } = render(<Passos passos={passos} atual={1} />)
    const conectores = container.querySelectorAll('.amb-passos__conector')
    // Três conectores para quatro passos — o último não tem para onde ligar.
    expect(conectores).toHaveLength(3)
    conectores.forEach(c => expect(c).toHaveAttribute('aria-hidden', 'true'))
  })

  test.each(['horizontal', 'vertical'] as const)('orientação %s', orientacao => {
    const { container } = render(<Passos passos={passos} atual={1} orientacao={orientacao} />)
    expect(container.querySelector(`.amb-passos__lista--${orientacao}`)).toBeTruthy()
  })
})
