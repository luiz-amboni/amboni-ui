import { describe, test, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Acordeao, ItemAcordeao } from './Acordeao'

function Duas({ tipo }: { tipo?: 'unico' | 'multiplo' } = {}) {
  return (
    <Acordeao tipo={tipo as 'multiplo'}>
      <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
        <button>Rastrear</button>
      </ItemAcordeao>
      <ItemAcordeao valor="troca" titulo="Troca e devolução">
        <button>Abrir troca</button>
      </ItemAcordeao>
    </Acordeao>
  )
}

describe('Acordeao — estrutura para quem não vê a tela', () => {
  test('o gatilho mora DENTRO de um heading', () => {
    render(<Duas />)

    // Sem o heading o acordeão vira uma pilha de botões: quem usa leitor de tela navega
    // pulando de heading em heading (o atalho mais usado que existe) e, sem eles, a
    // única forma de achar a seção certa é ouvir todas em ordem.
    const heading = screen.getByRole('heading', { level: 3, name: 'Prazo de entrega' })
    expect(within(heading).getByRole('button', { name: 'Prazo de entrega' })).toBeInTheDocument()
  })

  test('o nível do heading é configurável — nível pulado quebra o índice da página', () => {
    render(
      <Acordeao>
        <ItemAcordeao valor="a" titulo="Seção" nivelTitulo={2}>
          conteúdo
        </ItemAcordeao>
      </Acordeao>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Seção' })).toBeInTheDocument()
  })

  test('aria-expanded alterna, e o gatilho aponta para o painel que comanda', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    const gatilho = screen.getByRole('button', { name: 'Prazo de entrega' })
    // Sem aria-expanded o botão é mudo: a pessoa clica e não tem como saber que abriu.
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')

    await user.click(gatilho)
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')

    await user.click(gatilho)
    // `unico` também fecha o que já está aberto: um acordeão que só deixa trocar prende
    // a pessoa com um painel sempre aberto na cara.
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
  })

  test('o painel aberto é uma região com o nome do gatilho', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))

    // É o que permite entrar no painel e voltar sem se perder.
    const painel = screen.getByRole('region', { name: 'Prazo de entrega' })
    expect(painel.id).toBe(screen.getByRole('button', { name: 'Prazo de entrega' }).getAttribute('aria-controls'))
  })

  test('o painel existe no DOM mesmo fechado (aria-controls não pode apontar para o vazio)', () => {
    const { container } = render(<Duas />)

    // `aria-controls` apontando para um id inexistente é referência quebrada — alguns
    // leitores de tela ignoram o botão inteiro por causa disso.
    const gatilho = screen.getByRole('button', { name: 'Prazo de entrega' })
    const idPainel = gatilho.getAttribute('aria-controls')!
    expect(container.querySelector(`#${CSS.escape(idPainel)}`)).toBeTruthy()
  })
})

describe('Acordeao — o painel fechado tem que sumir DE VERDADE', () => {
  test('o conteúdo fechado não é alcançável pelo Tab', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    // O bug clássico e invisível para quem testa só com mouse: com `height: 0` +
    // `overflow: hidden`, o botão dentro do painel fechado CONTINUA focável. A pessoa
    // tecleja, o anel de foco some da tela, e não há nada para clicar nem para onde
    // voltar. Por isso "fechado" aqui é o atributo `hidden`, não altura zero.
    await user.tab()
    expect(screen.getByRole('button', { name: 'Prazo de entrega' })).toHaveFocus()

    await user.tab()
    // O Tab pula direto para o gatilho seguinte — NÃO entra no painel fechado.
    expect(screen.getByRole('button', { name: 'Troca e devolução' })).toHaveFocus()
  })

  test('o conteúdo fechado some da árvore de acessibilidade', () => {
    render(<Duas />)
    // Não basta não ser clicável: o leitor de tela também não pode encontrá-lo, senão
    // anuncia um botão que a pessoa não consegue ativar de jeito nenhum.
    expect(screen.queryByRole('button', { name: 'Rastrear' })).not.toBeInTheDocument()
  })

  test('abrir devolve o conteúdo ao Tab e ao leitor de tela', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    expect(screen.getByRole('button', { name: 'Rastrear' })).toBeVisible()
  })

  test('fechar de volta esconde o conteúdo (o hidden volta no fim da animação)', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    const gatilho = screen.getByRole('button', { name: 'Prazo de entrega' })
    await user.click(gatilho)
    await user.click(gatilho)

    // Em jsdom não há CSS, então `duracaoDaTransicao` devolve 0 e o `hidden` volta na
    // hora — o mesmo caminho que quem pediu `prefers-reduced-motion` percorre.
    expect(screen.queryByRole('button', { name: 'Rastrear' })).not.toBeInTheDocument()
  })
})

describe('Acordeao — tipo', () => {
  test('unico: abrir um FECHA o outro', async () => {
    const user = userEvent.setup()
    render(<Duas />)

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    await user.click(screen.getByRole('button', { name: 'Troca e devolução' }))

    expect(screen.getByRole('button', { name: 'Prazo de entrega' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Troca e devolução' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Rastrear' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir troca' })).toBeVisible()
  })

  test('multiplo: os dois ficam abertos', async () => {
    const user = userEvent.setup()
    render(<Duas tipo="multiplo" />)

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    await user.click(screen.getByRole('button', { name: 'Troca e devolução' }))

    expect(screen.getByRole('button', { name: 'Rastrear' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Abrir troca' })).toBeVisible()
  })

  test('valorPadrao abre a seção certa já no primeiro render', () => {
    render(
      <Acordeao valorPadrao="troca">
        <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
          a
        </ItemAcordeao>
        <ItemAcordeao valor="troca" titulo="Troca e devolução">
          b
        </ItemAcordeao>
      </Acordeao>,
    )
    expect(screen.getByRole('button', { name: 'Troca e devolução' })).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Acordeao — controlado', () => {
  test('unico avisa com string|null — quem usa não lida com array de um item', async () => {
    const user = userEvent.setup()
    const mudou = vi.fn()

    function Controlado() {
      const [aberto, setAberto] = useState<string | null>(null)
      return (
        <Acordeao
          valor={aberto}
          onChange={v => {
            mudou(v)
            setAberto(v)
          }}
        >
          <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
            a
          </ItemAcordeao>
        </Acordeao>
      )
    }
    render(<Controlado />)

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    expect(mudou).toHaveBeenCalledWith('entrega')
    expect(screen.getByRole('button', { name: 'Prazo de entrega' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    // Fechado é `null`, não `''` nem `[]`: o tipo diz a verdade sobre o que aconteceu.
    expect(mudou).toHaveBeenCalledWith(null)
  })

  test('multiplo avisa com a lista inteira', async () => {
    const user = userEvent.setup()
    const mudou = vi.fn()

    function Controlado() {
      const [abertos, setAbertos] = useState<string[]>(['entrega'])
      return (
        <Acordeao
          tipo="multiplo"
          valor={abertos}
          onChange={v => {
            mudou(v)
            setAbertos(v)
          }}
        >
          <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
            a
          </ItemAcordeao>
          <ItemAcordeao valor="troca" titulo="Troca e devolução">
            b
          </ItemAcordeao>
        </Acordeao>
      )
    }
    render(<Controlado />)

    await user.click(screen.getByRole('button', { name: 'Troca e devolução' }))
    expect(mudou).toHaveBeenCalledWith(['entrega', 'troca'])
  })

  test('controlado obedece o pai, não o clique', async () => {
    const user = userEvent.setup()
    // Sem `onChange` que atualize o estado, nada abre. É o contrato do modo controlado —
    // e é o que permite ao produto vetar a abertura (ex.: seção que exige permissão).
    render(
      <Acordeao valor={null}>
        <ItemAcordeao valor="entrega" titulo="Prazo de entrega">
          a
        </ItemAcordeao>
      </Acordeao>,
    )

    await user.click(screen.getByRole('button', { name: 'Prazo de entrega' }))
    expect(screen.getByRole('button', { name: 'Prazo de entrega' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Acordeao — detalhes', () => {
  test('item disabled não abre, mas continua anunciado', async () => {
    const user = userEvent.setup()
    render(
      <Acordeao>
        <ItemAcordeao valor="a" titulo="Em breve" disabled>
          conteúdo
        </ItemAcordeao>
      </Acordeao>,
    )

    const gatilho = screen.getByRole('button', { name: 'Em breve' })
    await user.click(gatilho)
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
    // Sumir com a seção faria a pessoa procurar o que "estava ali ontem". Ela continua
    // na tela, visivelmente indisponível.
    expect(gatilho).toBeDisabled()
  })

  test('o ícone é decorativo — quem narra a seção é o título', () => {
    render(
      <Acordeao>
        <ItemAcordeao valor="a" titulo="Entrega" icone={<svg data-testid="icone" />}>
          conteúdo
        </ItemAcordeao>
      </Acordeao>,
    )
    // O nome acessível do gatilho é só o título: se o ícone entrasse, o leitor de tela
    // leria "imagem Entrega" ou coisa pior.
    expect(screen.getByRole('button', { name: 'Entrega' })).toBeInTheDocument()
    expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  test('<ItemAcordeao> solto falha alto', () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <ItemAcordeao valor="a" titulo="x">
          y
        </ItemAcordeao>,
      ),
    ).toThrow(/Acordeao/)
    silencio.mockRestore()
  })
})
