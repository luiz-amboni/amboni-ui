import { createRef, useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Deslizador, type DeslizadorRef } from './Deslizador'
import { CampoForm } from './CampoForm'

/** Reais, como um filtro de preço de verdade. É o caso que o `aria-valuetext` existe para servir. */
const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Envolve em estado real: um controlado que nunca atualiza esconde bug de valor. */
function Simples(props: { inicial?: number; aoMudar?: (v: number) => void; passo?: number }) {
  const [valor, setValor] = useState(props.inicial ?? 50)
  return (
    <Deslizador
      aria-label="Preço"
      valor={valor}
      min={0}
      max={100}
      passo={props.passo}
      onChange={v => {
        setValor(v)
        props.aoMudar?.(v)
      }}
    />
  )
}

function Faixa(props: { inicial?: [number, number]; aoMudar?: (v: [number, number]) => void }) {
  const [valor, setValor] = useState<[number, number]>(props.inicial ?? [20, 80])
  return (
    <Deslizador
      intervalo
      aria-label="Faixa de preço"
      valor={valor}
      min={0}
      max={100}
      onChange={v => {
        setValor(v)
        props.aoMudar?.(v)
      }}
    />
  )
}

describe('Deslizador — uma ponta é o <input type="range"> nativo', () => {
  test('é um range de verdade — é dele que vêm o gesto do celular e o teclado', () => {
    render(<Simples />)
    const controle = screen.getByRole('slider', { name: 'Preço' })
    // Se um dia isto virar uma <div role="slider">, o teste quebra e a decisão volta à mesa.
    expect(controle.tagName).toBe('INPUT')
    expect(controle).toHaveAttribute('type', 'range')
  })

  test('o rótulo acha o controle, não o invólucro', () => {
    render(<Simples />)
    // A armadilha: `aria-label` no <div> de fora nomearia uma caixa e deixaria o input mudo.
    expect(screen.getByLabelText('Preço').tagName).toBe('INPUT')
  })
})

describe('Deslizador — teclado do modo nativo', () => {
  /**
   * O que dá para provar aqui, e o que NÃO dá.
   *
   * Setas, Home e End no modo nativo são do NAVEGADOR — nós não escrevemos uma linha para
   * eles, e é justamente esse o motivo de o componente ser um `<input type="range">`. O
   * jsdom não implementa esse comportamento, então um teste de seta aqui não estaria
   * medindo o nosso código: estaria medindo o jsdom, e passaria ou falharia por um motivo
   * que não é nosso.
   *
   * Então provamos as duas coisas que são responsabilidade nossa: que o elemento é mesmo um
   * range de verdade (é ele quem traz o teclado e o gesto), e o PageUp/PageDown, que é o
   * único pedaço de teclado que interceptamos. As setas estão cobertas de verdade no modo
   * `intervalo`, onde a conta é nossa — e a conta é a MESMA função nos dois modos.
   */
  test('PageUp/PageDown andam 10 PASSOS — e é nosso, não do navegador', async () => {
    const aoMudar = vi.fn()
    render(<Simples inicial={50} passo={2} aoMudar={aoMudar} />)

    await userEvent.tab()
    // 10 passos de 2 = 20. Cada navegador escolhe um salto diferente para o PageUp (uns 10%
    // da faixa, outros um punhado de passos): sem tratar, o mesmo controle andaria distâncias
    // diferentes no Chrome e no Firefox — e diferente do modo `intervalo`, no mesmo produto.
    await userEvent.keyboard('{PageUp}')
    expect(aoMudar).toHaveBeenLastCalledWith(70)

    await userEvent.keyboard('{PageDown}')
    expect(aoMudar).toHaveBeenLastCalledWith(50)
  })

  test('o PageUp não passa do max', async () => {
    const aoMudar = vi.fn()
    render(<Simples inicial={100} aoMudar={aoMudar} />)

    await userEvent.tab()
    await userEvent.keyboard('{PageUp}')
    // Um valor acima do max iria para o banco e voltaria como um controle "quebrado" na
    // próxima abertura da tela.
    expect(aoMudar).not.toHaveBeenCalledWith(110)
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * aria-valuetext — o detalhe que quase ninguém faz
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Deslizador — o que a pessoa OUVE', () => {
  test('aria-valuetext traz o rótulo FORMATADO, não o número cru', () => {
    render(
      <Deslizador aria-label="Preço" valor={1500} min={0} max={5000} onChange={vi.fn()} formatarRotulo={reais} />,
    )
    const controle = screen.getByRole('slider')

    // No nativo o `aria-valuenow` é IMPLÍCITO: o navegador o deriva do `value` e não há
    // atributo no DOM. Não escrevemos um por cima de propósito — dois lugares dizendo o
    // valor é um lugar a mais para divergir. O que se afirma aqui é que o valor está lá…
    expect(controle).toHaveValue('1500')
    // …e que o TEXTO é nosso. Sem `aria-valuetext`, o leitor de tela lê o valuenow cru:
    // "1500", e a pessoa não sabe se são reais, centavos, dias ou unidades.
    expect(controle).toHaveAttribute('aria-valuetext', expect.stringContaining('1.500'))
  })

  test('as duas pontas também anunciam o valor formatado', () => {
    render(
      <Deslizador
        intervalo aria-label="Faixa" valor={[1000, 4000]} min={0} max={5000}
        onChange={vi.fn()} formatarRotulo={reais}
      />,
    )
    expect(screen.getByRole('slider', { name: 'Mínimo' })).toHaveAttribute(
      'aria-valuetext', expect.stringContaining('1.000'),
    )
    expect(screen.getByRole('slider', { name: 'Máximo' })).toHaveAttribute(
      'aria-valuetext', expect.stringContaining('4.000'),
    )
  })

  test('sem formatarRotulo NÃO inventamos valuetext', () => {
    render(<Simples />)
    // Um número puro já é lido certo. Um valuetext redundante ("50", "50") só faria o leitor
    // de tela falar duas vezes.
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext')
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * Duas pontas
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Deslizador — intervalo', () => {
  test('cada ponta é um slider com nome DIFERENTE', () => {
    render(<Faixa />)
    // Dois sliders chamados "Faixa de preço" deixariam quem usa leitor de tela sem saber
    // qual está mexendo — a pessoa ouve "Faixa de preço, 20" e "Faixa de preço, 80" e tem
    // que deduzir.
    expect(screen.getByRole('slider', { name: 'Mínimo' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Máximo' })).toBeInTheDocument()
    // O nome guarda-chuva fica no grupo.
    expect(screen.getByRole('group', { name: 'Faixa de preço' })).toBeInTheDocument()
  })

  test('AS DUAS PONTAS NÃO SE CRUZAM — a mínima trava na máxima', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[79, 80]} aoMudar={aoMudar} />)

    const minimo = screen.getByRole('slider', { name: 'Mínimo' })
    minimo.focus()

    // Encosta: 79 → 80. Permitido.
    await userEvent.keyboard('{ArrowRight}')
    expect(aoMudar).toHaveBeenLastCalledWith([80, 80])

    // E PARA. A alternativa comum (deixar cruzar e trocar os papéis) é hostil: a pessoa
    // segura a seta para a direita, o valor cruza, o controle vira o OUTRO e o número começa
    // a descer enquanto ela ainda aperta para a direita.
    await userEvent.keyboard('{ArrowRight}')
    expect(aoMudar).toHaveBeenLastCalledWith([80, 80])
    expect(aoMudar).not.toHaveBeenCalledWith([81, 80])
  })

  test('a máxima também trava na mínima', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[20, 21]} aoMudar={aoMudar} />)

    screen.getByRole('slider', { name: 'Máximo' }).focus()
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')

    expect(aoMudar).toHaveBeenLastCalledWith([20, 20])
    expect(aoMudar).not.toHaveBeenCalledWith([20, 19])
  })

  test('o aria-valuemin/max de cada ponta reflete o limite REAL — a outra ponta', () => {
    render(<Faixa inicial={[20, 80]} />)

    // A mínima não pode passar de 80: anunciar `aria-valuemax=100` seria prometer um alcance
    // que o controle não tem, e quem usa leitor de tela descobriria batendo numa parede.
    const minimo = screen.getByRole('slider', { name: 'Mínimo' })
    expect(minimo).toHaveAttribute('aria-valuemin', '0')
    expect(minimo).toHaveAttribute('aria-valuemax', '80')

    const maximo = screen.getByRole('slider', { name: 'Máximo' })
    expect(maximo).toHaveAttribute('aria-valuemin', '20')
    expect(maximo).toHaveAttribute('aria-valuemax', '100')
  })

  test('as duas pontas são paradas do Tab', async () => {
    render(<Faixa />)
    // tabIndex -1 na segunda a tornaria inalcançável sem mouse: metade do controle não
    // existiria para quem usa teclado.
    await userEvent.tab()
    expect(screen.getByRole('slider', { name: 'Mínimo' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('slider', { name: 'Máximo' })).toHaveFocus()
  })

  test('as setas andam 1 passo (a conta que o modo nativo delega ao navegador)', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[20, 80]} aoMudar={aoMudar} />)

    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(aoMudar).toHaveBeenLastCalledWith([21, 80])

    await userEvent.keyboard('{ArrowLeft}')
    expect(aoMudar).toHaveBeenLastCalledWith([20, 80])
  })

  test('seta para cima cresce e para baixo diminui — num slider horizontal', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[20, 80]} aoMudar={aoMudar} />)

    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    // O hábito e o APG: cima/direita crescem. Trocar isso é o tipo de detalhe que ninguém
    // reporta como bug — a pessoa só acha o controle "estranho".
    await userEvent.keyboard('{ArrowUp}')
    expect(aoMudar).toHaveBeenLastCalledWith([21, 80])

    await userEvent.keyboard('{ArrowDown}')
    expect(aoMudar).toHaveBeenLastCalledWith([20, 80])
  })

  test('Home e End vão para o limite — que é a OUTRA PONTA, não o min/max', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[20, 80]} aoMudar={aoMudar} />)

    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    await userEvent.keyboard('{Home}')
    expect(aoMudar).toHaveBeenLastCalledWith([0, 80])

    // End na ponta mínima pede o max (100), mas ela trava em 80: o End respeita a mesma
    // regra de não-cruzamento que a seta. Um End que cruzasse seria uma porta dos fundos
    // para o estado que o resto do componente proíbe.
    await userEvent.keyboard('{End}')
    expect(aoMudar).toHaveBeenLastCalledWith([80, 80])
  })

  test('PageUp anda 10 passos aqui também — os dois modos batem', async () => {
    const aoMudar = vi.fn()
    render(<Faixa inicial={[20, 80]} aoMudar={aoMudar} />)

    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    await userEvent.keyboard('{PageUp}')
    expect(aoMudar).toHaveBeenLastCalledWith([30, 80])
  })

  test('desabilitado não anda pelo teclado', async () => {
    const aoMudar = vi.fn()
    render(<Deslizador intervalo disabled aria-label="Faixa" valor={[20, 80]} onChange={aoMudar} />)

    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(aoMudar).not.toHaveBeenCalled()
  })
})

describe('Deslizador — passo', () => {
  test('passo fracionário não vaza ponto flutuante', async () => {
    const aoMudar = vi.fn()
    // No modo `intervalo` porque a conta de teclado é NOSSA — a mesma função que o modo
    // nativo usa no PageUp e no arrasto.
    render(
      <Deslizador
        intervalo aria-label="Nota" valor={[0.2, 1]} min={0} max={1} passo={0.1} onChange={aoMudar}
      />,
    )
    screen.getByRole('slider', { name: 'Mínimo' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    // Sem o arredondamento, 0.2 + 0.1 = 0.30000000000000004 — que apareceria no rótulo e
    // iria assim para o banco.
    expect(aoMudar).toHaveBeenLastCalledWith([0.3, 1])
  })
})

describe('Deslizador — ref', () => {
  test('o ref chega no input nativo', () => {
    const ref = createRef<DeslizadorRef>()
    render(<Deslizador ref={ref} aria-label="Preço" valor={50} onChange={vi.fn()} />)
    // O uso real é `.focus()` — mandar o foco para o controle que falhou na validação.
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  test('com intervalo, o ref chega na ponta mínima (que é focável)', () => {
    const ref = createRef<DeslizadorRef>()
    render(<Deslizador ref={ref} intervalo aria-label="Faixa" valor={[20, 80]} onChange={vi.fn()} />)
    // O componente muda de natureza junto com a prop — mas `.focus()` continua funcionando,
    // que é o que quem chama quer.
    expect(ref.current).toHaveAttribute('aria-label', 'Mínimo')
  })
})

/* ══════════════════════════════════════════════════════════════════════════════
 * A fiação do <CampoForm>
 * ════════════════════════════════════════════════════════════════════════════ */
describe('Deslizador — obedece ao <CampoForm>', () => {
  test('o id injetado chega no INPUT, não no invólucro', () => {
    render(
      <CampoForm label="Preço máximo">
        <Deslizador valor={50} onChange={vi.fn()} />
      </CampoForm>,
    )
    // Regressão de um bug real, pego pelo axe ("Form elements must have labels"): o `id` que
    // o CampoForm injeta caía no <div> de desenho, o `<label htmlFor>` apontava para uma
    // CAIXA, e o slider ficava sem nome nenhum. Um controle mudo dentro de um wrapper que
    // existe justamente para dar nome a ele.
    expect(screen.getByLabelText('Preço máximo').tagName).toBe('INPUT')
  })

  test('o erro do wrapper é anunciado no controle', () => {
    render(
      <CampoForm label="Preço" erro="Escolha um valor">
        <Deslizador valor={50} onChange={vi.fn()} />
      </CampoForm>,
    )
    const controle = screen.getByRole('slider')
    expect(controle).toBeInvalid()
    // Sem o vínculo, quem usa leitor de tela ouve "inválido" e nunca o motivo.
    expect(controle).toHaveAccessibleDescription('Escolha um valor')
  })

  test('com intervalo, o erro é anunciado em CADA PONTA — que é onde o foco está', () => {
    render(
      <CampoForm label="Faixa de preço" erro="Faixa inválida">
        <Deslizador intervalo aria-label="Faixa de preço" valor={[20, 80]} onChange={vi.fn()} />
      </CampoForm>,
    )
    // Pendurar a descrição só no <div role="group"> faria a mensagem nunca ser lida: o leitor
    // de tela anuncia o que está FOCADO, e o foco vive nas pontas — nunca no grupo.
    expect(screen.getByRole('slider', { name: 'Mínimo' })).toHaveAccessibleDescription('Faixa inválida')
    expect(screen.getByRole('slider', { name: 'Máximo' })).toHaveAccessibleDescription('Faixa inválida')
  })

  test('com intervalo, o `aria-label` é obrigação de quem usa — o label do wrapper não alcança', () => {
    render(
      <CampoForm label="Faixa de preço">
        <Deslizador intervalo aria-label="Faixa de preço" valor={[20, 80]} onChange={vi.fn()} />
      </CampoForm>,
    )
    // A limitação assumida, escrita como teste para ninguém "consertar" por engano: um
    // `<label htmlFor>` só nomeia elemento de formulário de verdade, e o controle aqui é um
    // <div role="group">. Quem nomeia o grupo é o aria-label. Ver o JSDoc.
    expect(screen.getByRole('group', { name: 'Faixa de preço' })).toBeInTheDocument()
  })
})

describe('Deslizador — marcas', () => {
  test('as marcas são decorativas: o valor quem anuncia é o controle', () => {
    const { container } = render(
      <Deslizador
        aria-label="Prazo" valor={7} min={0} max={30} onChange={vi.fn()}
        marcas={[{ valor: 0 }, { valor: 15, rotulo: 'quinze' }, { valor: 30 }]}
      />,
    )
    // Um leitor de tela lendo "0 quinze 30" solto entre os campos é ruído: o número já sai
    // pelo aria-valuenow do próprio slider.
    expect(container.querySelector('.amb-deslizador__marcas')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('quinze')).toBeInTheDocument()
  })
})
