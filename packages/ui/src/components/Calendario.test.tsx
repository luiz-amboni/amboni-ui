import { useState } from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Calendario,
  compararDias,
  criarData,
  mesmoDia,
  somarDias,
  somarMeses,
} from './Calendario'

/**
 * "Hoje" é 10/06/2026, uma quarta-feira — **e com hora**, 14h30, de propósito: metade dos
 * bugs de calendário só aparece quando a data tem hora diferente de zero. Se o componente
 * comparasse por `getTime()`, um "hoje" às 14h30 nunca casaria com a meia-noite da grade e
 * o `aria-current` sumiria. O relógio falso é o que torna "hoje" um fato e não o dia em que
 * o CI rodou.
 *
 * Junho de 2026 escolhido a dedo: começa numa segunda-feira, então com a semana começando
 * no domingo (Brasil) a primeira linha da grade OBRIGATORIAMENTE mostra 31 de maio — que é
 * o caso dos dias de fora do mês.
 */
const AGORA = new Date(2026, 5, 10, 14, 30)

function ligarRelogioFalso() {
  vi.useFakeTimers()
  vi.setSystemTime(AGORA)
}

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

beforeEach(ligarRelogioFalso)
afterEach(() => vi.useRealTimers())

/** 15/06/2026 é uma segunda-feira. Escolhido por isso: dá para testar Home e End na mesma semana. */
const QUINZE = criarData(2026, 5, 15)

function Controlado({
  inicial = QUINZE,
  aoMudar,
  ...props
}: Partial<React.ComponentProps<typeof Calendario>> & { inicial?: Date | null; aoMudar?: (d: Date) => void }) {
  const [valor, setValor] = useState<Date | null>(inicial)
  return (
    <Calendario
      {...props}
      valor={valor}
      onChange={d => {
        setValor(d)
        aoMudar?.(d)
      }}
    />
  )
}

/** Foca a célula pelo nome acessível. `.focus()` direto porque o clique ESCOLHERIA o dia. */
function focar(nome: string) {
  const celula = screen.getByRole('gridcell', { name: nome })
  celula.focus()
  return celula
}

describe('Calendario — a aritmética que parece trivial', () => {
  test('somarDias atravessa mês e ano sem uma condicional', () => {
    expect(somarDias(criarData(2026, 5, 30), 1)).toEqual(criarData(2026, 6, 1))
    expect(somarDias(criarData(2026, 11, 31), 1)).toEqual(criarData(2027, 0, 1))
    expect(somarDias(criarData(2026, 0, 1), -1)).toEqual(criarData(2025, 11, 31))
  })

  test('toda data que sai é meia-noite LOCAL — é o que torna o horário de verão inofensivo', () => {
    // Este teste não consegue provar o horário de verão sem trocar o TZ do processo. O que
    // ele prova é o INVARIANTE que torna aquele bug impossível: a data é reconstruída pelos
    // campos (ano, mês, dia), nunca somando 86.400.000 ms. No dia em que o relógio adianta,
    // o dia tem 23h — e somar 24h pularia ou repetiria um dia. Reconstruir não erra nunca.
    const d = somarDias(new Date(2026, 9, 17, 23, 59), 1)
    expect(d.getDate()).toBe(18)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })

  test('31 de janeiro + 1 mês é 28 de fevereiro — o setMonth daria 3 de MARÇO', () => {
    // O bug clássico: `new Date(2026,0,31).setMonth(1)` pede "31 de fevereiro" e o Date
    // "conserta" para 03/03, pulando fevereiro inteiro e sem avisar ninguém.
    expect(somarMeses(criarData(2026, 0, 31), 1)).toEqual(criarData(2026, 1, 28))
    // E o 29 de fevereiro do ano bissexto vira 28 no ano que não é.
    expect(somarMeses(criarData(2028, 1, 29), 12)).toEqual(criarData(2029, 1, 28))
  })

  test('mesmoDia compara o DIA, não o instante', () => {
    // 8h e 22h do mesmo dia são o MESMO dia e dois `getTime()` diferentes. Um calendário que
    // compara instante marca o dia errado conforme a hora em que a pessoa abriu a tela.
    expect(mesmoDia(new Date(2026, 5, 15, 8, 0), new Date(2026, 5, 15, 22, 0))).toBe(true)
    expect(mesmoDia(new Date(2026, 5, 15, 23, 59), new Date(2026, 5, 16, 0, 1))).toBe(false)
  })

  test('compararDias ordena por dia, ignorando a hora', () => {
    expect(compararDias(new Date(2026, 5, 15, 23, 0), new Date(2026, 5, 15, 1, 0))).toBe(0)
    expect(compararDias(criarData(2026, 5, 15), criarData(2026, 5, 16))).toBe(-1)
    expect(compararDias(criarData(2026, 5, 16), criarData(2026, 5, 15))).toBe(1)
  })

  test('o ano 26 não vira 1926', () => {
    // `new Date(26, 0, 1)` devolve 1926 — compatibilidade dos anos 90 que o JavaScript
    // arrasta até hoje. Sem a correção, um "26" que escapasse do parser viraria 1926.
    expect(criarData(26, 0, 1).getFullYear()).toBe(26)
  })
})

describe('Calendario — é uma tabela de verdade', () => {
  test('role=grid, com os dias da semana em <th scope="col">', () => {
    render(<Controlado />)
    // Se um dia isto virar uma pilha de <div>, o teste quebra e a decisão volta à mesa:
    // num monte de divs não existe coluna, não existe "segunda-feira", não existe tabela.
    const grade = screen.getByRole('grid', { name: 'junho de 2026' })
    expect(grade.tagName).toBe('TABLE')

    const colunas = screen.getAllByRole('columnheader')
    expect(colunas).toHaveLength(7)
    colunas.forEach(c => expect(c).toHaveAttribute('scope', 'col'))
    // O olho lê "dom"; o leitor de tela ouve "domingo".
    expect(colunas[0]).toHaveTextContent('dom')
    expect(colunas[0]).toHaveTextContent('domingo')
  })

  test('sempre 6 semanas, mesmo quando o mês cabe em 5', () => {
    const { container } = render(<Controlado />)
    // Com linhas variando, o painel muda de altura ao trocar de mês e o botão "próximo" foge
    // de debaixo do cursor — quem clica três meses seguidos erra o terceiro.
    expect(container.querySelectorAll('tbody tr')).toHaveLength(6)
  })

  test('os dias do mês vizinho aparecem, mas são inertes', async () => {
    const aoMudar = vi.fn()
    const user = usuario()
    render(<Controlado aoMudar={aoMudar} />)

    // "31" na grade de junho é MAIO. Clicar ali é exatamente o erro que põe a data errada
    // no campo — por isso ele aparece (a grade ficaria com buraco no canto) e não clica.
    const foraDoMes = screen.getByRole('gridcell', { name: '31 de maio de 2026' })
    expect(foraDoMes).toHaveAttribute('aria-disabled', 'true')

    await user.click(foraDoMes)
    expect(aoMudar).not.toHaveBeenCalled()
  })
})

describe('Calendario — hoje e o escolhido são coisas diferentes', () => {
  test('aria-current="date" está em HOJE; aria-selected, no ESCOLHIDO', () => {
    render(<Controlado />)

    // A confusão que faz o leitor de tela anunciar "hoje" para uma data de 2019. São dois
    // fatos independentes: 10/06 é hoje, 15/06 é o escolhido, e nenhum é o outro.
    expect(screen.getByRole('gridcell', { current: 'date' })).toHaveAccessibleName('10 de junho de 2026')
    expect(screen.getByRole('gridcell', { selected: true })).toHaveAccessibleName('15 de junho de 2026')
  })

  test('hoje às 14h30 continua sendo hoje na grade da meia-noite', () => {
    // Se a comparação fosse por getTime(), "hoje" com hora nunca casaria com o dia da grade
    // e o aria-current simplesmente não apareceria — depois das 00h00, todo dia.
    render(<Controlado />)
    expect(screen.getByRole('gridcell', { current: 'date' })).toBeInTheDocument()
  })
})

describe('Calendario — o teclado é o componente', () => {
  test('as setas andam 1 dia', async () => {
    const user = usuario()
    render(<Controlado />)
    focar('15 de junho de 2026')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('gridcell', { name: '16 de junho de 2026' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('gridcell', { name: '14 de junho de 2026' })).toHaveFocus()
  })

  test('↑ e ↓ andam 1 semana', async () => {
    const user = usuario()
    render(<Controlado />)
    focar('15 de junho de 2026')

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('gridcell', { name: '22 de junho de 2026' })).toHaveFocus()

    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(screen.getByRole('gridcell', { name: '8 de junho de 2026' })).toHaveFocus()
  })

  test('Home e End vão às pontas da SEMANA (não do mês)', async () => {
    const user = usuario()
    render(<Controlado />)
    focar('15 de junho de 2026')

    // 15/06/2026 é segunda. No Brasil a semana começa no domingo: Home = 14, End = 20.
    await user.keyboard('{Home}')
    expect(screen.getByRole('gridcell', { name: '14 de junho de 2026' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('gridcell', { name: '20 de junho de 2026' })).toHaveFocus()
  })

  test('PageUp e PageDown trocam o mês', async () => {
    const user = usuario()
    render(<Controlado />)
    focar('15 de junho de 2026')

    await user.keyboard('{PageDown}')
    expect(screen.getByRole('gridcell', { name: '15 de julho de 2026' })).toHaveFocus()

    await user.keyboard('{PageUp}{PageUp}')
    expect(screen.getByRole('gridcell', { name: '15 de maio de 2026' })).toHaveFocus()
  })

  test('PageDown em 31 de janeiro para em 28 de fevereiro, não em 3 de março', async () => {
    const user = usuario()
    render(<Controlado inicial={criarData(2026, 0, 31)} />)
    focar('31 de janeiro de 2026')

    // O `setMonth` cru pularia fevereiro inteiro e ninguém entenderia por quê.
    await user.keyboard('{PageDown}')
    expect(screen.getByRole('gridcell', { name: '28 de fevereiro de 2026' })).toHaveFocus()
  })

  test('Shift+PageUp/PageDown trocam o ANO', async () => {
    const user = usuario()
    render(<Controlado />)
    focar('15 de junho de 2026')

    await user.keyboard('{Shift>}{PageDown}{/Shift}')
    expect(screen.getByRole('gridcell', { name: '15 de junho de 2027' })).toHaveFocus()

    await user.keyboard('{Shift>}{PageUp}{/Shift}{Shift>}{PageUp}{/Shift}')
    expect(screen.getByRole('gridcell', { name: '15 de junho de 2025' })).toHaveFocus()
  })

  test('só o dia focado é tabulável — um Tab entra na grade, o próximo sai', async () => {
    const user = usuario()
    const { container } = render(<Controlado />)
    focar('15 de junho de 2026')
    await user.keyboard('{ArrowRight}')

    // Sem roving tabindex, sair de um calendário custa 42 Tabs.
    const tabulaveis = container.querySelectorAll('[role="gridcell"][tabindex="0"]')
    expect(tabulaveis).toHaveLength(1)
    expect(tabulaveis[0]).toHaveAccessibleName('16 de junho de 2026')
  })

  test('Enter e Espaço escolhem o dia focado', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado inicial={null} aoMudar={aoMudar} />)

    focar('10 de junho de 2026')
    await user.keyboard('{ArrowRight}{Enter}')
    expect(aoMudar).toHaveBeenCalledTimes(1)
    expect(mesmoDia(aoMudar.mock.calls[0][0], criarData(2026, 5, 11))).toBe(true)

    await user.keyboard('{ArrowRight}[Space]')
    expect(mesmoDia(aoMudar.mock.calls[1][0], criarData(2026, 5, 12))).toBe(true)
  })
})

describe('Calendario — fuso horário', () => {
  test('o dia escolhido não "anda" um dia', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado inicial={null} aoMudar={aoMudar} />)

    await user.click(screen.getByRole('gridcell', { name: '15 de junho de 2026' }))

    // A armadilha: `new Date('2026-06-15')` é lido como UTC e vira 14/06 às 21h no Brasil.
    // Quem clica em 15 tem que receber 15 — em qualquer fuso, a qualquer hora do dia.
    const escolhido: Date = aoMudar.mock.calls[0][0]
    expect(escolhido.getFullYear()).toBe(2026)
    expect(escolhido.getMonth()).toBe(5)
    expect(escolhido.getDate()).toBe(15)
    // Meia-noite LOCAL: é isso que prova que a data é um dia do calendário e não um instante
    // convertido de UTC.
    expect(escolhido.getHours()).toBe(0)
  })
})

describe('Calendario — min, max e dias bloqueados', () => {
  test('min e max desabilitam de verdade', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado min={criarData(2026, 5, 10)} max={criarData(2026, 5, 20)} aoMudar={aoMudar} />)

    expect(screen.getByRole('gridcell', { name: '9 de junho de 2026' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('gridcell', { name: '21 de junho de 2026' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('gridcell', { name: '10 de junho de 2026' })).not.toHaveAttribute('aria-disabled')

    // Apagado no visual não basta: a prova é o onChange nunca disparar.
    await user.click(screen.getByRole('gridcell', { name: '9 de junho de 2026' }))
    expect(aoMudar).not.toHaveBeenCalled()
  })

  test('a seta não pousa em dia desabilitado — ela para na ponta válida', async () => {
    const user = usuario()
    render(<Controlado inicial={criarData(2026, 5, 10)} min={criarData(2026, 5, 10)} />)
    focar('10 de junho de 2026')

    // Um foco que pousa onde o Enter não faz nada é um beco sem saída: a pessoa aperta
    // Enter, não acontece nada, e ela não tem como saber por quê.
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('gridcell', { name: '10 de junho de 2026' })).toHaveFocus()
  })

  test('a seta PULA o dia bloqueado pelo `desabilitar` e segue em frente', async () => {
    const user = usuario()
    render(<Controlado desabilitar={d => d.getDate() === 16} />)
    focar('15 de junho de 2026')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('gridcell', { name: '17 de junho de 2026' })).toHaveFocus()
  })
})

describe('Calendario — a troca de mês é anunciada', () => {
  test('role="status" diz onde a pessoa chegou', async () => {
    const user = usuario()
    render(<Controlado />)

    // Sem isto, quem usa leitor de tela clica em "próximo mês", ouve "botão próximo mês" de
    // novo, e não faz ideia de onde chegou: a única coisa que mudou na tela é justamente o
    // que ele não vê.
    expect(screen.getByRole('status')).toHaveTextContent('junho de 2026')

    await user.click(screen.getByRole('button', { name: 'Próximo mês, julho de 2026' }))
    expect(screen.getByRole('status')).toHaveTextContent('julho de 2026')
  })

  test('o rótulo da seta diz PARA ONDE vai, não só "anterior"', () => {
    render(<Controlado />)
    // "Mês anterior" sozinho obriga a pessoa a clicar para descobrir onde caiu.
    expect(screen.getByRole('button', { name: 'Mês anterior, maio de 2026' })).toBeInTheDocument()
    // O ano tem botão próprio: sem ele, chegar em 1985 custaria 490 cliques no mês.
    expect(screen.getByRole('button', { name: 'Ano anterior, junho de 2025' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximo ano, junho de 2027' })).toBeInTheDocument()
  })
})
