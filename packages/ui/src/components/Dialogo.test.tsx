import { useState } from 'react'
import { describe, test, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialogo, type DialogoProps } from './Dialogo'

/* ── O <dialog> do jsdom é uma casca ─────────────────────────────────────────
 * O jsdom 25 dá ao HTMLDialogElement só o `open` (atributo refletido). NÃO existe
 * `showModal`, `close`, evento `cancel`, top layer nem ::backdrop — `HTMLDialogElement-impl.js`
 * é literalmente uma classe vazia. Sem um dublê, o Dialogo estoura no primeiro render
 * e NENHUM teste de modal roda.
 *
 * Este dublê imita só o CONTRATO que o componente usa, do jeito que o navegador se
 * comporta — inclusive nas duas partes que o componente existe para tratar:
 * `showModal()` num dialog já aberto LANÇA, e o Esc dispara um `cancel` cancelável
 * antes de fechar. Um mock que não fizesse isso passaria verde com o bug em produção.
 */
const abertos: HTMLDialogElement[] = []

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    if (this.open) {
      throw new DOMException('The element already has an "open" attribute', 'InvalidStateError')
    }
    this.open = true
    abertos.push(this)
    // O navegador manda o foco para dentro do modal ao abrir. É o que faz o teste do
    // "foco volta para quem abriu" significar alguma coisa — sem isto o foco nunca sai
    // do abridor e o teste passaria sozinho.
    this.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )?.focus()
  }

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    const i = abertos.indexOf(this)
    if (i >= 0) abertos.splice(i, 1)
    this.dispatchEvent(new Event('close'))
  }

  // O Esc do navegador: `cancel` cancelável no dialog do topo e, se ninguém barrar,
  // fecha. O Dialogo barra sempre — quem fecha é o `aberto` do React.
  document.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape') return
    const topo = abertos[abertos.length - 1]
    if (!topo) return
    if (topo.dispatchEvent(new Event('cancel', { cancelable: true }))) topo.close()
  })
})

/** jsdom não faz layout: todo retângulo é zero. Sem fingir um, "dentro" e "fora" são o
 *  mesmo ponto e o teste de clique no fundo não prova nada. */
function fingirRetangulo(el: Element, r: { left: number; top: number; right: number; bottom: number }) {
  el.getBoundingClientRect = () =>
    ({
      ...r, x: r.left, y: r.top,
      width: r.right - r.left, height: r.bottom - r.top,
      toJSON: () => '',
    }) as DOMRect
}

/** Modal controlado por estado, com um abridor de verdade — é assim que ele é usado. */
function Exemplo({ onFechar, ...props }: Partial<DialogoProps>) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button onClick={() => setAberto(true)}>Abrir</button>
      <Dialogo
        aberto={aberto}
        onFechar={() => { setAberto(false); onFechar?.() }}
        titulo="Excluir cliente"
        {...props}
      >
        <p>corpo do modal</p>
      </Dialogo>
    </>
  )
}

describe('Dialogo — fechar pelo Esc', () => {
  test('Esc fecha E avisa o onFechar', async () => {
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    await userEvent.keyboard('{Escape}')

    expect(fechou).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('depois do Esc, o modal ABRE DE NOVO', async () => {
    // O bug clássico do <dialog>: o navegador fecha no Esc sem passar pelo React. Se o
    // componente não avisar o onFechar, o estado fica `aberto: true` para sempre —
    // `setAberto(true)` não muda prop nenhuma, o efeito não roda, e o modal morre na
    // primeira vez que alguém aperta Esc. Este teste é a razão do preventDefault no
    // evento `cancel`.
    render(<Exemplo />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })

    await userEvent.click(abrir)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(abrir)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('fecharNoEsc={false}: o Esc não fecha nem avisa', async () => {
    const fechou = vi.fn()
    render(<Exemplo fecharNoEsc={false} onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    await userEvent.keyboard('{Escape}')

    expect(fechou).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('Dialogo — clique no fundo', () => {
  test('clique FORA fecha', async () => {
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    fingirRetangulo(dialog, { left: 100, top: 100, right: 300, bottom: 300 })

    // O clique no ::backdrop chega com target = o próprio <dialog>: o fundo é
    // pseudo-elemento, não dá para clicar "nele". Quem separa dentro de fora é a
    // coordenada. `detail: 1` = clique de mouse mesmo (0 seria teclado).
    fireEvent.mouseDown(dialog, { clientX: 10, clientY: 10 })
    fireEvent.click(dialog, { clientX: 10, clientY: 10, detail: 1 })

    expect(fechou).toHaveBeenCalledTimes(1)
  })

  test('clique DENTRO não fecha', async () => {
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    fingirRetangulo(dialog, { left: 100, top: 100, right: 300, bottom: 300 })

    const corpo = screen.getByText('corpo do modal')
    fireEvent.mouseDown(corpo, { clientX: 150, clientY: 150 })
    fireEvent.click(corpo, { clientX: 150, clientY: 150, detail: 1 })

    expect(fechou).not.toHaveBeenCalled()
  })

  test('seleção de texto que começa dentro e solta fora NÃO fecha', async () => {
    // O caso real que quebra quase toda implementação caseira: o `click` de uma seleção
    // arrastada sai no ancestral comum (o dialog) com a coordenada da SOLTURA, lá fora.
    // Olhando só o clique, o modal fecha no meio da seleção e o texto se perde.
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    fingirRetangulo(dialog, { left: 100, top: 100, right: 300, bottom: 300 })

    fireEvent.mouseDown(screen.getByText('corpo do modal'), { clientX: 150, clientY: 150 })
    fireEvent.click(dialog, { clientX: 10, clientY: 400, detail: 1 })

    expect(fechou).not.toHaveBeenCalled()
  })

  test('fecharNoFundo={false}: clique no fundo não fecha', async () => {
    const fechou = vi.fn()
    render(<Exemplo fecharNoFundo={false} onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    fingirRetangulo(dialog, { left: 100, top: 100, right: 300, bottom: 300 })
    fireEvent.mouseDown(dialog, { clientX: 10, clientY: 10 })
    fireEvent.click(dialog, { clientX: 10, clientY: 10, detail: 1 })

    expect(fechou).not.toHaveBeenCalled()
  })

  test('Enter num botão de dentro não é lido como clique no fundo', async () => {
    // Clique sintético de teclado vem com clientX/clientY = 0, que cai fora do
    // retângulo. Sem o guarda do `detail === 0`, cada Enter fecharia o modal.
    const fechou = vi.fn()
    render(
      <Exemplo onFechar={fechou} rodape={<button>Confirmar</button>} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    fingirRetangulo(screen.getByRole('dialog'), { left: 100, top: 100, right: 300, bottom: 300 })

    screen.getByRole('button', { name: 'Confirmar' }).focus()
    await userEvent.keyboard('{Enter}')

    expect(fechou).not.toHaveBeenCalled()
  })
})

describe('Dialogo — foco', () => {
  test('o foco volta para quem abriu', async () => {
    render(<Exemplo />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })

    await userEvent.click(abrir)
    // O navegador jogou o foco para dentro do modal — quem abriu perdeu o lugar.
    expect(abrir).not.toHaveFocus()

    await userEvent.keyboard('{Escape}')

    // Sem devolver, a pessoa é cuspida no topo do documento e navega tudo de novo até
    // onde estava.
    expect(abrir).toHaveFocus()
  })

  test('não quebra quando quem abriu saiu da tela junto', async () => {
    // Fechar o modal costuma ser o que apaga a linha da tabela que o abriu. Devolver o
    // foco a um elemento solto do documento não faz nada — só não pode explodir.
    function Some() {
      const [aberto, setAberto] = useState(false)
      const [temBotao, setTemBotao] = useState(true)
      return (
        <>
          {temBotao && <button onClick={() => setAberto(true)}>Abrir</button>}
          <Dialogo
            aberto={aberto}
            onFechar={() => { setAberto(false); setTemBotao(false) }}
            titulo="Excluir"
          >
            x
          </Dialogo>
        </>
      )
    }
    render(<Some />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    await expect(userEvent.keyboard('{Escape}')).resolves.not.toThrow()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Dialogo — nome acessível', () => {
  test('o modal é anunciado pelo título', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    // Sem o aria-labelledby, o leitor de tela anuncia só "diálogo" — a pessoa é
    // interrompida por uma caixa sem nome.
    expect(screen.getByRole('dialog', { name: 'Excluir cliente' })).toBeInTheDocument()
  })

  test('a descrição é ligada por aria-describedby', async () => {
    render(<Exemplo descricao="Esta ação não tem volta." />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialog = screen.getByRole('dialog')
    const descricao = screen.getByText('Esta ação não tem volta.')
    expect(dialog).toHaveAttribute('aria-describedby', descricao.id)
  })

  test('o botão de fechar tem nome — não é um X mudo', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Dialogo — rolagem do fundo', () => {
  test('trava ao abrir e destrava ao fechar', async () => {
    render(<Exemplo />)
    expect(document.body.style.overflow).toBe('')

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    // Sem travar, a página do fundo rola atrás do modal quando a pessoa gira a roda —
    // e ela perde o lugar onde estava sem nem ter fechado o modal.
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })

  test('destrava mesmo desmontando ABERTO', () => {
    // Troca de rota com o modal aberto. Se a trava vazar aqui, a página fica congelada
    // sem nenhum modal na tela — e ninguém liga o sintoma à causa.
    const { unmount } = render(<Dialogo aberto onFechar={() => {}} titulo="X">c</Dialogo>)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  test('dois modais: o de baixo só destrava quando o último fecha', () => {
    // A trava é contada, não booleana. Com um booleano, fechar a confirmação devolveria
    // a rolagem com o modal de trás ainda aberto.
    const primeiro = render(<Dialogo aberto onFechar={() => {}} titulo="Um">a</Dialogo>)
    const segundo = render(<Dialogo aberto onFechar={() => {}} titulo="Dois">b</Dialogo>)
    expect(document.body.style.overflow).toBe('hidden')

    segundo.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    primeiro.unmount()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('Dialogo — estrutura', () => {
  test('fechado não aparece na tela', () => {
    render(<Exemplo />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('mostra corpo e rodapé', async () => {
    render(<Exemplo rodape={<button>Confirmar</button>} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    expect(screen.getByText('corpo do modal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  test('o título é um heading de verdade — leitor de tela navega por eles', async () => {
    render(<Exemplo />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('heading', { name: 'Excluir cliente', level: 2 })).toBeInTheDocument()
  })

  test.each(['sm', 'md', 'lg', 'full'] as const)('tamanho %s', async tamanho => {
    render(<Exemplo size={tamanho} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog')).toHaveClass(`amb-dialogo--${tamanho}`)
  })

  test('<form method="dialog"> nos children avisa o React', async () => {
    // HTML legítimo que fecha o dialog por fora do React. Sem ouvir o `close`, cai no
    // mesmo buraco do Esc: fechado na tela, aberto no estado, nunca mais abre.
    const fechou = vi.fn()
    render(<Exemplo onFechar={fechou} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    // act(): o close() dispara onFechar, que muda estado fora de um evento do React.
    const dialog = screen.getByRole('dialog') as HTMLDialogElement
    act(() => { dialog.close() })

    expect(fechou).toHaveBeenCalledTimes(1)
  })
})
