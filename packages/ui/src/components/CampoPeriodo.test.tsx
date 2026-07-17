import { useState } from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampoPeriodo, ATALHOS_PADRAO, type Periodo } from './CampoPeriodo'
import { criarData } from './Calendario'

/** "Hoje" é 10/06/2026, às 14h30 — com hora de propósito: os atalhos têm que devolver DIA. */
const AGORA = new Date(2026, 5, 10, 14, 30)
const HOJE = criarData(2026, 5, 10)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(AGORA)
})
afterEach(() => vi.useRealTimers())

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

const VAZIO: Periodo = { inicio: null, fim: null }

function Controlado({
  inicial = VAZIO,
  aoMudar,
  ...props
}: Partial<React.ComponentProps<typeof CampoPeriodo>> & {
  inicial?: Periodo
  aoMudar?: (p: Periodo) => void
}) {
  const [valor, setValor] = useState<Periodo>(inicial)
  return (
    <CampoPeriodo
      aria-label="Período"
      {...props}
      valor={valor}
      onChange={p => {
        setValor(p)
        aoMudar?.(p)
      }}
    />
  )
}

async function abrir(user: ReturnType<typeof usuario>) {
  await user.click(screen.getByRole('button', { name: /Período/ }))
}

describe('CampoPeriodo — os atalhos são o componente', () => {
  test('"Últimos 7 dias" são 7 dias CONTANDO hoje, não 8', () => {
    // O off-by-one que todo mundo erra: "últimos 7 dias" a partir de hoje-7 dá OITO dias.
    const p = ATALHOS_PADRAO.find(a => a.rotulo === 'Últimos 7 dias')!.periodo()
    expect(p.inicio).toEqual(criarData(2026, 5, 4))
    expect(p.fim).toEqual(HOJE)

    const dias = Math.round((p.fim!.getTime() - p.inicio!.getTime()) / 86400000) + 1
    expect(dias).toBe(7)
  })

  test('"Últimos 30 dias" gera o intervalo certo', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)

    await abrir(user)
    await user.click(screen.getByRole('button', { name: 'Últimos 30 dias' }))

    expect(aoMudar).toHaveBeenCalledTimes(1)
    expect(aoMudar).toHaveBeenCalledWith({ inicio: criarData(2026, 4, 12), fim: HOJE })
    // 12/05 a 10/06 = 30 dias contando as duas pontas.
    const p: Periodo = aoMudar.mock.calls[0][0]
    expect(Math.round((p.fim!.getTime() - p.inicio!.getTime()) / 86400000) + 1).toBe(30)
  })

  test('os atalhos devolvem DIA, não o instante de agora', () => {
    // "Hoje" às 14h30 tem que virar 10/06 às 00h00: um `fim` com hora deixaria de fora tudo
    // que aconteceu depois das 14h30 no filtro do banco — e ninguém entenderia por quê.
    const p = ATALHOS_PADRAO.find(a => a.rotulo === 'Hoje')!.periodo()
    expect(p.inicio).toEqual(HOJE)
    expect(p.fim).toEqual(HOJE)
    expect(p.fim!.getHours()).toBe(0)
  })

  test('"Este mês" vai do dia 1 até HOJE, não até o dia 30', () => {
    // Um intervalo que termina no futuro faz a média diária despencar por causa de dias que
    // ainda nem chegaram.
    const p = ATALHOS_PADRAO.find(a => a.rotulo === 'Este mês')!.periodo()
    expect(p.inicio).toEqual(criarData(2026, 5, 1))
    expect(p.fim).toEqual(HOJE)
  })

  test('"Mês passado" é o mês INTEIRO — esse já acabou', () => {
    const p = ATALHOS_PADRAO.find(a => a.rotulo === 'Mês passado')!.periodo()
    expect(p.inicio).toEqual(criarData(2026, 4, 1))
    expect(p.fim).toEqual(criarData(2026, 4, 31))
  })

  test('o atalho respeita o min — não devolve data fora do permitido', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado min={criarData(2026, 5, 1)} aoMudar={aoMudar} />)

    await abrir(user)
    await user.click(screen.getByRole('button', { name: 'Últimos 30 dias' }))

    // 30 dias atrás seria 12/05, antes do min. O relógio não manda no que o produto permite.
    expect(aoMudar).toHaveBeenCalledWith({ inicio: criarData(2026, 5, 1), fim: HOJE })
  })

  test('o foco entra no primeiro atalho — para a maioria, o teclado inteiro é um Enter', async () => {
    const user = usuario()
    render(<Controlado />)
    await abrir(user)

    expect(screen.getByRole('button', { name: 'Hoje' })).toHaveFocus()
  })
})

describe('CampoPeriodo — as duas pontas', () => {
  test('o primeiro clique NÃO avisa o produto; o segundo avisa uma vez só', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)
    await abrir(user)

    // Meio intervalo não é um valor: avisar aqui recarregaria a tela inteira com um filtro
    // que a pessoa ainda está montando.
    await user.click(screen.getByRole('gridcell', { name: '15 de junho de 2026' }))
    expect(aoMudar).not.toHaveBeenCalled()

    await user.click(screen.getByRole('gridcell', { name: '20 de junho de 2026' }))
    expect(aoMudar).toHaveBeenCalledTimes(1)
    expect(aoMudar).toHaveBeenCalledWith({ inicio: criarData(2026, 5, 15), fim: criarData(2026, 5, 20) })
  })

  test('fim antes do início: o intervalo é invertido, não recusado', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)
    await abrir(user)

    // Clicou 30 e depois 15. Recusar obrigaria a pessoa a recomeçar por causa de uma ordem
    // que ela não sabia que existia — e a intenção é inequívoca: ela apontou as duas pontas.
    await user.click(screen.getByRole('gridcell', { name: '30 de junho de 2026' }))
    await user.click(screen.getByRole('gridcell', { name: '15 de junho de 2026' }))

    expect(aoMudar).toHaveBeenCalledWith({ inicio: criarData(2026, 5, 15), fim: criarData(2026, 5, 30) })
  })

  test('um `valor` que chega trocado é lido na ordem certa', () => {
    // Filtro salvo torto, API que devolveu ao contrário: pintar um intervalo vazio faria o
    // componente parecer quebrado por causa de um dado de fora.
    render(<Controlado inicial={{ inicio: criarData(2026, 5, 30), fim: criarData(2026, 5, 15) }} />)
    // Regex e não string exata: entre as duas datas o botão tem o travessão que só o olho vê
    // E o " a " que só o leitor de tela ouve, e o textContent junta os dois. Quem manda aqui
    // é a ORDEM — 15 antes de 30, mesmo tendo chegado ao contrário.
    expect(screen.getByRole('button', { name: /Período/ })).toHaveTextContent(/15\/06\/2026.*30\/06\/2026/)
  })

  test('o intervalo escolhido fica marcado de ponta a ponta', async () => {
    const user = usuario()
    render(<Controlado inicial={{ inicio: criarData(2026, 5, 15), fim: criarData(2026, 5, 20) }} />)
    await abrir(user)

    // 15 a 20 = 6 dias, e todos eles fazem parte da seleção — não só as pontas.
    expect(screen.getAllByRole('gridcell', { selected: true })).toHaveLength(6)
    // A grade precisa DIZER que aceita mais de um, senão "selecionado" seis vezes é ruído.
    expect(screen.getByRole('grid', { name: 'junho de 2026' })).toHaveAttribute('aria-multiselectable', 'true')
  })

  test('a prévia acompanha o mouse antes do segundo clique', async () => {
    const user = usuario()
    render(<Controlado />)
    await abrir(user)

    await user.click(screen.getByRole('gridcell', { name: '15 de junho de 2026' }))
    // Só a ponta fixa, enquanto não há para onde olhar.
    expect(screen.getAllByRole('gridcell', { selected: true })).toHaveLength(1)

    await user.hover(screen.getByRole('gridcell', { name: '18 de junho de 2026' }))
    // Sem a prévia, escolher intervalo é apontar no escuro e conferir depois.
    expect(screen.getAllByRole('gridcell', { selected: true })).toHaveLength(4)
  })

  test('as duas pontas também se escolhem pelo teclado', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)
    await abrir(user)

    screen.getByRole('gridcell', { name: '10 de junho de 2026' }).focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}')

    expect(aoMudar).toHaveBeenCalledWith({ inicio: criarData(2026, 5, 10), fim: criarData(2026, 5, 12) })
  })
})

describe('CampoPeriodo — o painel', () => {
  test('o gatilho anuncia que abre um DIÁLOGO', async () => {
    const user = usuario()
    render(<Controlado />)
    const gatilho = screen.getByRole('button', { name: /Período/ })

    expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog')
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')

    await user.click(gatilho)
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Escolher período' })).toBeInTheDocument()
  })

  test('Esc fecha e devolve o foco ao gatilho', async () => {
    const user = usuario()
    render(<Controlado />)
    await abrir(user)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Período/ })).toHaveFocus()
  })

  test('sem valor, o gatilho instrui em vez de mentir', () => {
    render(<Controlado />)
    expect(screen.getByRole('button', { name: /Período/ })).toHaveTextContent('Escolha o período')
  })

  test('o travessão é desenho — quem ouve recebe a palavra "a"', () => {
    render(<Controlado inicial={{ inicio: criarData(2026, 5, 15), fim: criarData(2026, 5, 30) }} />)
    // O leitor de tela leria "traço" ou nada. O nome acessível precisa dizer "15/06/2026 a
    // 30/06/2026" para o intervalo fazer sentido no ouvido.
    expect(screen.getByRole('button', { name: /15\/06\/2026 a 30\/06\/2026/ })).toBeInTheDocument()
  })

  test('um mês só quando não dá para saber a largura da tela', async () => {
    const user = usuario()
    render(<Controlado />)
    await abrir(user)

    // Sem matchMedia (jsdom, SSR) a resposta é "estreito": um mês SEMPRE cabe, dois estouram
    // a tela do celular. Errar para o lado que cabe é o único erro reversível dos dois.
    expect(screen.getAllByRole('grid')).toHaveLength(1)
  })
})
