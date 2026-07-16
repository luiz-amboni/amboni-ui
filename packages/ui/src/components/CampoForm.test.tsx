import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampoForm } from './CampoForm'
import { Campo } from './Campo'
import { AreaTexto } from './AreaTexto'

afterEach(() => vi.restoreAllMocks())

/** Lê os textos que o leitor de tela anuncia ao focar o campo, na ordem do describedby. */
function descricoesDe(elemento: HTMLElement): string[] {
  const ids = elemento.getAttribute('aria-describedby')?.split(' ') ?? []
  return ids.map(id => document.getElementById(id)?.textContent ?? '')
}

describe('CampoForm — a razão de existir: o rótulo ligado ao campo', () => {
  test('o label acha o campo (é isso ou "campo de edição" sem nome)', () => {
    // Sem htmlFor apontando para o id, quem usa leitor de tela ouve só "campo de edição" e
    // não sabe QUAL campo. Se este teste quebrar, o componente perdeu o motivo de existir.
    render(
      <CampoForm label="E-mail">
        <Campo type="email" />
      </CampoForm>,
    )
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  test('clicar no rótulo foca o campo (a prova de que a ligação é real)', async () => {
    render(
      <CampoForm label="Telefone">
        <Campo />
      </CampoForm>,
    )

    await userEvent.click(screen.getByText('Telefone'))
    expect(screen.getByLabelText('Telefone')).toHaveFocus()
  })

  test('funciona com AreaTexto do mesmo jeito', () => {
    render(
      <CampoForm label="Observação">
        <AreaTexto />
      </CampoForm>,
    )
    expect(screen.getByLabelText('Observação')).toBeInTheDocument()
  })

  test('dois CampoForm na mesma tela geram ids diferentes', () => {
    // Id repetido: o htmlFor casa com o primeiro e clicar no segundo rótulo foca o campo
    // errado. useId resolve, mas só se cada instância gerar o seu.
    render(
      <>
        <CampoForm label="Nome"><Campo /></CampoForm>
        <CampoForm label="Sobrenome"><Campo /></CampoForm>
      </>,
    )
    expect(screen.getByLabelText('Nome').id).not.toBe(screen.getByLabelText('Sobrenome').id)
  })

  test('id fixo passado à mão vence o gerado', () => {
    render(
      <CampoForm label="Nome" id="cliente-nome">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByLabelText('Nome')).toHaveAttribute('id', 'cliente-nome')
  })

  test('id declarado no controle: o rótulo segue ELE, não o gerado', () => {
    // A armadilha que este teste trava: o CampoForm gerava um id, punha no htmlFor do
    // label, e o clone respeitava o id que o controle já tinha. Resultado: label apontando
    // para um id que não existe — rótulo mudo, o bug que este componente existe para
    // impedir. getByLabelText só acha o campo se os dois ids forem o mesmo.
    render(
      <CampoForm label="Nome">
        <Campo id="meu-id" />
      </CampoForm>,
    )
    expect(screen.getByLabelText('Nome')).toHaveAttribute('id', 'meu-id')
  })
})

describe('CampoForm — erro', () => {
  test('o erro é anunciado ao aparecer (role="alert") e ligado ao campo', async () => {
    const { rerender } = render(
      <CampoForm label="E-mail">
        <Campo />
      </CampoForm>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(
      <CampoForm label="E-mail" erro="E-mail inválido">
        <Campo />
      </CampoForm>,
    )

    // role="alert" só fala de verdade quando o elemento é MONTADO junto com a mensagem.
    // Um <p role="alert"> parado no DOM trocando de texto passa batido em vários leitores.
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('E-mail inválido')

    // E o alerta precisa estar ligado ao campo: sem isso, quem tabula até o campo depois
    // ouve o nome dele e nada sobre o erro.
    expect(descricoesDe(screen.getByLabelText('E-mail'))).toContain('E-mail inválido')
  })

  test('erro liga aria-invalid no campo', () => {
    render(
      <CampoForm label="E-mail" erro="inválido">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByLabelText('E-mail')).toBeInvalid()
  })

  test('sem erro, o campo não é inválido', () => {
    render(
      <CampoForm label="E-mail">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByLabelText('E-mail')).toBeValid()
  })
})

describe('CampoForm — erro E ajuda juntos', () => {
  test('anuncia os DOIS, erro primeiro', () => {
    // A decisão: a ajuda costuma ser a informação que falta para consertar ("mínimo de 8
    // caracteres"). Escondê-la justamente no erro tira a instrução de quem mais precisa.
    // A ordem é a ordem da fala: primeiro o que houve, depois a regra.
    render(
      <CampoForm label="Senha" ajuda="mínimo de 8 caracteres" erro="Senha muito curta">
        <Campo type="password" />
      </CampoForm>,
    )

    expect(descricoesDe(screen.getByLabelText('Senha'))).toEqual([
      'Senha muito curta',
      'mínimo de 8 caracteres',
    ])
  })

  test('a ajuda continua na tela durante o erro (o olho vê o mesmo que o ouvido)', () => {
    render(
      <CampoForm label="Senha" ajuda="mínimo de 8 caracteres" erro="Senha muito curta">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByText('mínimo de 8 caracteres')).toBeInTheDocument()
    expect(screen.getByText('Senha muito curta')).toBeInTheDocument()
  })

  test('só ajuda: descreve o campo sozinha', () => {
    render(
      <CampoForm label="Valor" ajuda="em reais">
        <Campo prefixo="R$" />
      </CampoForm>,
    )
    expect(descricoesDe(screen.getByLabelText('Valor'))).toEqual(['em reais'])
  })

  test('sem ajuda nem erro, não sobra um aria-describedby apontando para o nada', () => {
    render(
      <CampoForm label="Nome">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-describedby')
  })

  test('describedby do controle SOMA com o do wrapper, não é substituído', () => {
    // aria-describedby aceita vários ids de propósito. Trocar o do controle pelo nosso
    // apagaria uma descrição que alguém pôs por um motivo.
    render(
      <>
        <span id="dica-externa">dica de fora</span>
        <CampoForm label="Nome" ajuda="como no RG">
          <Campo aria-describedby="dica-externa" />
        </CampoForm>
      </>,
    )
    expect(descricoesDe(screen.getByLabelText('Nome'))).toEqual(['como no RG', 'dica de fora'])
  })
})

describe('CampoForm — obrigatório', () => {
  test('o asterisco NÃO é a única indicação: a palavra vai junto', () => {
    // Símbolo sozinho não informa — quem usa leitor de tela ouviria "asterisco" ou nada, e
    // quem não conhece a convenção não sabe o que ele quer dizer.
    render(
      <CampoForm label="Nome" obrigatorio>
        <Campo />
      </CampoForm>,
    )

    // O nome acessível do campo (computado como o leitor de tela computa: pulando o que é
    // aria-hidden) carrega a PALAVRA e não o símbolo.
    expect(screen.getByRole('textbox', { name: /nome \(obrigatório\)/i })).toBeInTheDocument()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByLabelText(/nome/i)).toBeRequired()
  })

  test('usa aria-required, não o `required` nativo', () => {
    // `required` liga a validação do navegador, que abre o balão dele por cima da nossa
    // mensagem — dois avisos diferentes para o mesmo erro. Quem quiser a validação nativa
    // passa `required` no controle, de propósito.
    render(
      <CampoForm label="Nome" obrigatorio>
        <Campo />
      </CampoForm>,
    )

    const campo = screen.getByLabelText(/nome/i)
    expect(campo).toHaveAttribute('aria-required', 'true')
    expect(campo).not.toHaveAttribute('required')
  })

  test('sem obrigatorio, nada de asterisco', () => {
    render(
      <CampoForm label="Apelido">
        <Campo />
      </CampoForm>,
    )
    expect(screen.getByLabelText('Apelido')).not.toHaveAttribute('aria-required')
  })
})

describe('CampoForm — children como função', () => {
  test('entrega a fiação para quem precisa envolver o controle', () => {
    render(
      <CampoForm label="Valor" ajuda="em reais" erro="obrigatório">
        {fiacao => (
          <div>
            <Campo {...fiacao} prefixo="R$" />
            <span>dica ao lado</span>
          </div>
        )}
      </CampoForm>,
    )

    const campo = screen.getByLabelText('Valor')
    expect(campo).toBeInvalid()
    expect(descricoesDe(campo)).toEqual(['obrigatório', 'em reais'])
  })
})

describe('CampoForm — uso errado', () => {
  test('avisa em dev quando não há um elemento para ligar o rótulo', () => {
    // Texto solto não tem onde receber o id: o htmlFor aponta para o nada e o formulário
    // fica sem rótulo. Falha em silêncio na tela — só aparece numa auditoria meses depois.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<CampoForm label="Nome">só um texto</CampoForm>)

    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('UM elemento'))
  })
})
