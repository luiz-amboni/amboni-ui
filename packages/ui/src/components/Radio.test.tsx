import { createRef, useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio, GrupoRadio } from './Radio'

/** O uso real: grupo controlado por estado. Repetir isso em cada teste esconde o que
 *  cada um está provando. */
function GrupoDeExemplo({ inicial = 'wa' }: { inicial?: string }) {
  const [canal, setCanal] = useState(inicial)
  return (
    <GrupoRadio label="Canal" name="canal" value={canal} onChange={setCanal}>
      <Radio value="wa" label="WhatsApp" descricao="template aprovado pelo Meta" />
      <Radio value="sms" label="SMS" />
      <Radio value="tel" label="Telefone" />
    </GrupoRadio>
  )
}

describe('GrupoRadio — semântica de grupo', () => {
  test('é um radiogroup E está rotulado pela pergunta', () => {
    render(<GrupoDeExemplo />)
    // Sem este par (role + aria-labelledby) o leitor de tela anuncia 3 rádios soltos
    // e quem chega pelo teclado não sabe de que pergunta são.
    expect(screen.getByRole('radiogroup', { name: 'Canal' })).toBeInTheDocument()
  })

  test('todos os rádios dividem o mesmo `name`', () => {
    render(<GrupoDeExemplo />)
    // O `name` compartilhado é o que delega ao NAVEGADOR a navegação por setas, o
    // "um só marcado" e o "1 de 3". É o motivo de não haver onKeyDown neste componente.
    for (const rotulo of ['WhatsApp', 'SMS', 'Telefone']) {
      expect(screen.getByLabelText<HTMLInputElement>(rotulo).name).toBe('canal')
    }
  })

  test('o erro do grupo é lido, não só pintado', () => {
    render(
      <GrupoRadio label="Canal" name="canal" erro="escolha um canal">
        <Radio value="wa" label="WhatsApp" />
      </GrupoRadio>,
    )
    const grupo = screen.getByRole('radiogroup', { name: 'Canal' })
    expect(grupo).toHaveAccessibleDescription('escolha um canal')
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
  })

  test.each(['vertical', 'horizontal'] as const)('orientação %s', o => {
    const { container } = render(
      <GrupoRadio label="X" name="x" orientacao={o}>
        <Radio value="a" label="A" />
      </GrupoRadio>,
    )
    expect(container.querySelector(`.amb-radio-grupo__itens--${o}`)).toBeTruthy()
  })
})

describe('GrupoRadio — o que a pessoa faz', () => {
  test('o rótulo acha cada opção', () => {
    render(<GrupoDeExemplo />)
    expect(screen.getByLabelText('WhatsApp')).toBeChecked()
    expect(screen.getByLabelText('SMS')).not.toBeChecked()
  })

  test('clicar no TEXTO da opção escolhe', async () => {
    render(<GrupoDeExemplo />)
    await userEvent.click(screen.getByText('SMS'))
    expect(screen.getByLabelText('SMS')).toBeChecked()
    // Escolha única: escolher uma desmarca a outra — de graça, pelo `name`.
    expect(screen.getByLabelText('WhatsApp')).not.toBeChecked()
  })

  test('as SETAS navegam entre as opções', async () => {
    render(<GrupoDeExemplo />)
    screen.getByLabelText('WhatsApp').focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByLabelText('SMS')).toBeChecked()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByLabelText('Telefone')).toBeChecked()

    // Dá a volta no fim da lista — comportamento nativo que não custou nada.
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByLabelText('WhatsApp')).toBeChecked()
  })

  test('a seta para trás também', async () => {
    render(<GrupoDeExemplo inicial="sms" />)
    screen.getByLabelText('SMS').focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByLabelText('WhatsApp')).toBeChecked()
  })

  test('o onChange do grupo recebe o VALUE, não o evento', async () => {
    const mudou = vi.fn()
    render(
      <GrupoRadio label="Canal" name="canal" value="wa" onChange={mudou}>
        <Radio value="wa" label="WhatsApp" />
        <Radio value="sms" label="SMS" />
      </GrupoRadio>,
    )
    await userEvent.click(screen.getByLabelText('SMS'))
    expect(mudou).toHaveBeenCalledWith('sms')
  })

  test('o onChange do próprio Radio convive com o do grupo', async () => {
    const doGrupo = vi.fn()
    const doRadio = vi.fn()
    render(
      <GrupoRadio label="Canal" name="canal" value="wa" onChange={doGrupo}>
        <Radio value="sms" label="SMS" onChange={doRadio} />
      </GrupoRadio>,
    )
    await userEvent.click(screen.getByLabelText('SMS'))
    expect(doGrupo).toHaveBeenCalledWith('sms')
    expect(doRadio).toHaveBeenCalledTimes(1)
  })
})

describe('Radio — o input nativo continua lá', () => {
  test('é um <input type="radio">, não uma div fantasiada', () => {
    render(<Radio value="a" label="A" />)
    const radio = screen.getByLabelText('A')
    expect(radio.tagName).toBe('INPUT')
    expect(radio).toHaveAttribute('type', 'radio')
  })

  test('o ref chega no input nativo', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Radio ref={ref} value="a" label="A" />)
    expect(ref.current?.type).toBe('radio')
    expect(ref.current).toBe(screen.getByLabelText('A'))
  })

  test('a descrição é lida junto com o rótulo', () => {
    render(<GrupoDeExemplo />)
    expect(screen.getByLabelText('WhatsApp')).toHaveAccessibleDescription(
      'template aprovado pelo Meta',
    )
  })

  test('grupo SEM `value` é não-controlado — e continua funcionando', async () => {
    // Se o componente cravasse `checked` aqui, o rádio travaria para sempre: não há
    // estado para atualizar. É o bug clássico de wrapper de formulário.
    render(
      <GrupoRadio label="Canal" name="canal">
        <Radio value="wa" label="WhatsApp" />
        <Radio value="sms" label="SMS" />
      </GrupoRadio>,
    )
    await userEvent.click(screen.getByLabelText('SMS'))
    expect(screen.getByLabelText('SMS')).toBeChecked()
  })

  test('funciona fora de um grupo (com name próprio)', async () => {
    render(<Radio name="solto" value="a" label="A" />)
    await userEvent.click(screen.getByLabelText('A'))
    expect(screen.getByLabelText('A')).toBeChecked()
  })
})
