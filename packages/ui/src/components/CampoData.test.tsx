import { useState } from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampoData, analisarData, formatarData } from './CampoData'
import { criarData } from './Calendario'

const AGORA = new Date(2026, 5, 10, 14, 30)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(AGORA)
})
afterEach(() => vi.useRealTimers())

function usuario() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

function Controlado({
  inicial = null,
  aoMudar,
  ...props
}: Partial<React.ComponentProps<typeof CampoData>> & {
  inicial?: Date | null
  aoMudar?: (d: Date | null) => void
}) {
  const [valor, setValor] = useState<Date | null>(inicial)
  return (
    <CampoData
      aria-label="Data"
      {...props}
      valor={valor}
      onChange={d => {
        setValor(d)
        aoMudar?.(d)
      }}
    />
  )
}

describe('analisarData — ler o que a pessoa digitou', () => {
  test('aceita o formato inteiro, o abreviado e só os dígitos', () => {
    // Quem preenche CRM o dia todo digita "150626" e segue a vida. Recusar isso é implicar
    // com a pessoa por causa de dois caracteres que o campo sabe pôr sozinho.
    expect(analisarData('15/06/2026')).toEqual(criarData(2026, 5, 15))
    expect(analisarData('15/06/26')).toEqual(criarData(2026, 5, 15))
    expect(analisarData('150626')).toEqual(criarData(2026, 5, 15))
    expect(analisarData('15062026')).toEqual(criarData(2026, 5, 15))
    // Digitação solta: quem escreve rápido produz ponto e traço.
    expect(analisarData('15.6.2026')).toEqual(criarData(2026, 5, 15))
    expect(analisarData('15-6-26')).toEqual(criarData(2026, 5, 15))
  })

  test('31/02/2026 é null — NÃO vira 3 de março', () => {
    // O `Date` conserta o impossível sozinho e sem avisar: `new Date(2026, 1, 31)` devolve
    // 03/03/2026. Sem a prova dos nove, quem erra o dedo em "31/02" guarda março no banco e
    // ninguém descobre até o relatório sair torto.
    expect(analisarData('31/02/2026')).toBeNull()
    expect(analisarData('31/04/2026')).toBeNull()
    expect(analisarData('29/02/2026')).toBeNull()
    // 2028 é bissexto — aí 29/02 existe de verdade.
    expect(analisarData('29/02/2028')).toEqual(criarData(2028, 1, 29))
  })

  test('lixo é null, não uma data qualquer', () => {
    expect(analisarData('')).toBeNull()
    expect(analisarData('abc')).toBeNull()
    expect(analisarData('15/13/2026')).toBeNull()
    expect(analisarData('00/06/2026')).toBeNull()
    expect(analisarData('15/06')).toBeNull()
  })

  test('o ano de 2 dígitos vira 1970–2069', () => {
    expect(analisarData('15/06/26')?.getFullYear()).toBe(2026)
    expect(analisarData('15/06/69')?.getFullYear()).toBe(2069)
    // 85 é 1985 — data de nascimento, o caso que justifica a janela.
    expect(analisarData('15/06/85')?.getFullYear()).toBe(1985)
  })

  test('a data lida é meia-noite LOCAL — não anda um dia', () => {
    // `new Date('2026-06-15')` seria lido como UTC e viraria 14/06 às 21h no Brasil. É o bug
    // de data mais comum que existe, e só aparece para quem está a oeste de Greenwich.
    const d = analisarData('15/06/2026')!
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
  })

  test('formato ISO lê na ordem dele', () => {
    expect(analisarData('2026-06-15', 'aaaa-mm-dd')).toEqual(criarData(2026, 5, 15))
    expect(analisarData('20260615', 'aaaa-mm-dd')).toEqual(criarData(2026, 5, 15))
    // 6 dígitos em ISO seria ano 26? mês 06? Ambíguo — e data errada em silêncio é pior
    // que erro na cara.
    expect(analisarData('260615', 'aaaa-mm-dd')).toBeNull()
  })

  test('formatarData usa os campos locais, nunca toISOString', () => {
    expect(formatarData(criarData(2026, 5, 1))).toBe('01/06/2026')
    expect(formatarData(criarData(2026, 5, 1), 'aaaa-mm-dd')).toBe('2026-06-01')
  })
})

describe('CampoData — digitar', () => {
  test('digitar "15/06/2026" chama onChange com a data certa', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)

    await user.type(screen.getByLabelText('Data'), '15/06/2026')

    expect(aoMudar).toHaveBeenCalledTimes(1)
    const d: Date = aoMudar.mock.calls[0][0]
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
  })

  test('a máscara põe as barras — a pessoa digita só os 8 dígitos', async () => {
    const user = usuario()
    render(<Controlado />)
    const campo = screen.getByLabelText('Data')

    await user.type(campo, '15062026')
    expect(campo).toHaveValue('15/06/2026')
  })

  test('a barra digitada fecha o mês — "15/6/26" não vira "15/62/6"', async () => {
    const user = usuario()
    render(<Controlado />)
    const campo = screen.getByLabelText('Data')

    // Gente escreve "15/6/26", não "15/06/26". A máscara ingênua joga fora tudo que não é
    // dígito e reagrupa em blocos fixos — "15","62","6". O "/" não é enfeite: é a pessoa
    // dizendo que o mês acabou, e o zero é a máscara que põe.
    await user.type(campo, '15/6/26')
    expect(campo).toHaveValue('15/06/26')
  })

  test('o Backspace não trava na barra', async () => {
    const user = usuario()
    render(<Controlado />)
    const campo = screen.getByLabelText('Data')

    await user.type(campo, '150')
    expect(campo).toHaveValue('15/0')

    // A armadilha: máscara que gruda a barra assim que o grupo enche transforma "15/0" +
    // Backspace em "15/" → sobram os dígitos "15" → a máscara devolve "15/" de novo → a
    // tecla não faz nada e a pessoa fica presa apertando Backspace.
    await user.keyboard('{Backspace}')
    expect(campo).toHaveValue('15')
    await user.keyboard('{Backspace}')
    expect(campo).toHaveValue('1')
  })

  test('não avisa a tela no meio da digitação — "15/06/20" não vira 2020', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)

    // "15/06/20" já É uma data válida (15/06/2020). Avisar ali faria o calendário pular para
    // 2020 no caminho de 2026 — e a pessoa veria a tela dançar enquanto digita.
    await user.type(screen.getByLabelText('Data'), '150620')
    expect(aoMudar).not.toHaveBeenCalled()
  })

  test('"31/02/2026" não vira 03/03 — o texto fica e o erro aparece', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)
    const campo = screen.getByLabelText('Data')

    await user.type(campo, '31/02/2026')
    await user.tab()

    expect(aoMudar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Data inválida — use dd/mm/aaaa')
    // O texto FICA: apagar o que a pessoa escreveu como se ela não tivesse digitado nada é
    // pior que o erro — ela perde o trabalho e não sabe o que houve.
    expect(campo).toHaveValue('31/02/2026')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
  })

  test('ao sair, o campo reescreve o que ENTENDEU', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)
    const campo = screen.getByLabelText('Data')

    await user.type(campo, '15/6/26')
    await user.tab()

    // É isto que torna o chute do ano de 2 dígitos honesto: a pessoa VÊ que o campo
    // entendeu 2026 e corrige se queria 1926.
    expect(campo).toHaveValue('15/06/2026')
    expect(aoMudar).toHaveBeenCalledWith(criarData(2026, 5, 15))
  })

  test('esvaziar o campo devolve null', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado inicial={criarData(2026, 5, 15)} aoMudar={aoMudar} />)

    await user.clear(screen.getByLabelText('Data'))
    expect(aoMudar).toHaveBeenCalledWith(null)
  })

  test('o placeholder É o formato', () => {
    render(<Controlado />)
    // Nenhuma instrução é mais curta nem mais exata que mostrar o que se espera.
    expect(screen.getByLabelText('Data')).toHaveAttribute('placeholder', 'dd/mm/aaaa')
  })

  test('data fora do min diz QUAL é o limite', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado min={criarData(2026, 5, 10)} aoMudar={aoMudar} />)

    await user.type(screen.getByLabelText('Data'), '05/06/2026')
    await user.tab()

    // "Data inválida" não conserta nada: a pessoa precisa saber qual é a régua.
    expect(screen.getByRole('alert')).toHaveTextContent('A data precisa ser a partir de 10/06/2026')
    expect(aoMudar).not.toHaveBeenCalled()
  })
})

describe('CampoData — o calendário', () => {
  test('o botão anuncia que abre um DIÁLOGO', async () => {
    const user = usuario()
    render(<Controlado />)
    const botao = screen.getByRole('button', { name: 'Abrir calendário' })

    expect(botao).toHaveAttribute('aria-haspopup', 'dialog')
    expect(botao).toHaveAttribute('aria-expanded', 'false')

    await user.click(botao)
    expect(botao).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Escolher data' })).toBeInTheDocument()
  })

  test('o foco entra na grade: quem abriu quer escolher um dia', async () => {
    const user = usuario()
    render(<Controlado inicial={criarData(2026, 5, 15)} />)

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    expect(screen.getByRole('gridcell', { name: '15 de junho de 2026' })).toHaveFocus()
  })

  test('Esc fecha e devolve o foco ao campo', async () => {
    const user = usuario()
    render(<Controlado />)

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Sem devolver o foco, quem fecha pelo teclado é jogado para o topo da página e
    // recomeça a navegar o formulário inteiro.
    expect(screen.getByLabelText('Data')).toHaveFocus()
  })

  test('escolher no calendário preenche o campo e fecha', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado aoMudar={aoMudar} />)

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await user.click(screen.getByRole('gridcell', { name: '20 de junho de 2026' }))

    expect(aoMudar).toHaveBeenCalledWith(criarData(2026, 5, 20))
    expect(screen.getByLabelText('Data')).toHaveValue('20/06/2026')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('o calendário não deixa escolher dia fora do min/max', async () => {
    const user = usuario()
    const aoMudar = vi.fn()
    render(<Controlado min={criarData(2026, 5, 10)} aoMudar={aoMudar} />)

    await user.click(screen.getByRole('button', { name: 'Abrir calendário' }))
    await user.click(screen.getByRole('gridcell', { name: '5 de junho de 2026' }))
    expect(aoMudar).not.toHaveBeenCalled()
  })
})

describe('CampoData — modo nativo (o celular)', () => {
  test('vira um <input type="date"> de verdade', () => {
    render(<Controlado nativo inicial={criarData(2026, 5, 15)} />)
    const campo = screen.getByLabelText('Data')

    // É dele que vem a roda do sistema no toque — nenhum calendário customizado ganha dela.
    expect(campo).toHaveAttribute('type', 'date')
    expect(campo).toHaveValue('2026-06-15')
    // E não existe botão nosso: quem abre o calendário é o sistema operacional.
    expect(screen.queryByRole('button', { name: 'Abrir calendário' })).not.toBeInTheDocument()
  })

  test('o dia não anda ao entrar nem ao sair do input nativo', () => {
    const aoMudar = vi.fn()
    render(<Controlado nativo aoMudar={aoMudar} />)

    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-06-15' } })

    // A armadilha da volta: `new Date('2026-06-15')` é UTC → 14/06 às 21h no Brasil.
    // A armadilha da ida: `toISOString()` converte para UTC → em Tóquio, 15/06 vira
    // "2026-06-14". As duas somem pelo mesmo motivo: campos locais nos dois sentidos.
    const d: Date = aoMudar.mock.calls[0][0]
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
  })

  test('min e max chegam no formato que o input nativo entende', () => {
    render(<Controlado nativo min={criarData(2026, 5, 1)} max={criarData(2026, 5, 30)} />)
    const campo = screen.getByLabelText('Data')
    expect(campo).toHaveAttribute('min', '2026-06-01')
    expect(campo).toHaveAttribute('max', '2026-06-30')
  })

  test('esvaziar devolve null', () => {
    const aoMudar = vi.fn()
    render(<Controlado nativo inicial={criarData(2026, 5, 15)} aoMudar={aoMudar} />)

    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } })
    expect(aoMudar).toHaveBeenCalledWith(null)
  })
})
