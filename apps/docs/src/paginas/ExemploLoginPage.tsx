import { useState, type FormEvent } from 'react'
import { Alerta, Button, Caixa, Campo, CampoForm } from '@amboni/ui'
import { Secao, P, Titulo, H3, Aviso as Destaque, Bloco } from '../lib/blocos'
import './exemplos.css'

/**
 * Tela de acesso — funcional, com estado local e sem backend.
 *
 * O login é a tela mais copiada do mundo e a que mais gente erra, porque ela tem os três
 * momentos difíceis de um formulário juntos: erro DE campo (o e-mail está torto), erro DA
 * OPERAÇÃO (a senha não confere) e espera (o servidor demora). Cada um pede um componente
 * diferente, e trocá-los é o que faz a pessoa não conseguir entrar.
 */

const CONTA = { email: 'ana@isafe.com.br', senha: 'isafe123' }

/**
 * Boa o bastante para uma tela de exemplo, e nada além disso.
 *
 * Validar e-mail por regex "de verdade" é um problema sem fim (a RFC 5322 aceita coisas
 * que nenhum provedor emite). O trabalho aqui é pegar o dedo escorregado — "ana@" ou
 * "ana.isafe.com.br" — antes de gastar uma ida ao servidor. Quem valida de fato é o
 * e-mail de confirmação.
 */
function emailParece(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
}

interface Erros {
  email?: string
  senha?: string
}

function TelaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrar, setLembrar] = useState(true)
  const [erros, setErros] = useState<Erros>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  function validar(): Erros {
    const e: Erros = {}
    // A ordem das mensagens é a ordem da leitura: primeiro "faltou", depois "está torto".
    if (!email.trim()) e.email = 'Informe o e-mail da sua conta.'
    else if (!emailParece(email)) e.email = 'Isso não parece um e-mail. Confira o @ e o ponto.'

    if (!senha) e.senha = 'Informe a senha.'
    return e
  }

  function enviar(ev: FormEvent) {
    ev.preventDefault()

    // A falha anterior sai ANTES de validar. Deixar "senha incorreta" na tela enquanto a
    // pessoa corrige o e-mail é o sistema respondendo a uma pergunta que ninguém fez.
    setFalha(null)

    const e = validar()
    setErros(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    // O servidor que não existe. 900ms porque instantâneo esconderia justamente o estado
    // que esta tela quer mostrar.
    setTimeout(() => {
      setEnviando(false)
      if (email.trim().toLowerCase() === CONTA.email && senha === CONTA.senha) {
        setFalha(null)
        setErros({})
        // Aqui entraria o redirect. Numa página de documentação, um alerta de sucesso.
        setSucesso(true)
      } else {
        setFalha('E-mail ou senha incorretos.')
      }
    }, 900)
  }

  if (sucesso) {
    return (
      <div className="ex-palco">
        <div className="ex-login">
          <div className="ex-login__card">
            <Alerta
              tom="sucesso"
              titulo="Entrou"
              acao={
                <Button
                  onClick={() => {
                    setSucesso(false)
                    setSenha('')
                  }}
                >
                  Voltar ao login
                </Button>
              }
            >
              Numa aplicação de verdade este é o momento do redirect para o painel.
            </Alerta>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ex-palco">
      <div className="ex-login">
        <div className="ex-login__card">
          <div className="ex-login__marca">
            <span className="ex-login__mark" aria-hidden="true">
              i
            </span>
            <div>
              <p className="ex-login__titulo">Entrar no CRM</p>
            </div>
          </div>

          {/* noValidate: o navegador tem a validação dele, com balão próprio, em inglês do
              sistema operacional e por cima da nossa mensagem. Duas mensagens diferentes
              para o mesmo erro é pior que uma. */}
          <form className="ex-login__form" onSubmit={enviar} noValidate>
            {/* A falha da operação vive ACIMA dos campos e permanece. Ver as decisões
                abaixo — este é o ponto todo da tela. */}
            {falha && (
              <Alerta tom="perigo" titulo="Não foi possível entrar">
                {falha} Confira o e-mail e tente de novo.
              </Alerta>
            )}

            <CampoForm label="E-mail" erro={erros.email} obrigatorio>
              <Campo
                type="email"
                autoComplete="username"
                placeholder="voce@empresa.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </CampoForm>

            <CampoForm label="Senha" erro={erros.senha} obrigatorio>
              <Campo
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
            </CampoForm>

            <div className="ex-login__linha">
              <Caixa
                label="Lembrar de mim"
                checked={lembrar}
                onChange={e => setLembrar(e.target.checked)}
              />
              <a
                className="ex-link amb-focus-ring"
                href="#/exemplo-login"
                onClick={e => e.preventDefault()}
              >
                Esqueci a senha
              </a>
            </div>

            <Button type="submit" variant="primary" block loading={enviando}>
              Entrar
            </Button>
          </form>

          <p className="ex-login__rodape">
            É de verdade, dá para tentar: <code>{CONTA.email}</code> / <code>{CONTA.senha}</code>.
            <br />
            Qualquer outra coisa cai no erro.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ExemploLoginPage() {
  return (
    <>
      <Titulo
        eyebrow="Exemplos de tela"
        lead="A tela de acesso inteira: validação por campo, falha de credencial que não some, e o botão que não foge do dedo enquanto carrega."
      >
        Tela de acesso
      </Titulo>

      <Secao>
        <P>
          Componente isolado numa página não prova nada. O que prova é a tela montada — e o
          login tem, em 20 linhas, os três momentos difíceis de qualquer formulário:{' '}
          <strong>erro de campo</strong>, <strong>erro da operação</strong> e{' '}
          <strong>espera</strong>. Cada um pede um componente diferente. Trocá-los é o que
          faz a pessoa não conseguir entrar.
        </P>
        <P>
          A tela abaixo funciona: erre o e-mail e o erro aparece no campo; erre a senha e ele
          aparece em cima, e fica.
        </P>
      </Secao>

      <Secao titulo="A tela">
        <TelaLogin />
      </Secao>

      <Secao titulo="As decisões desta tela">
        <H3>Erro de credencial é Alerta, nunca Aviso</H3>
        <P>
          A tentação é mandar "E-mail ou senha incorretos" num <code>Aviso</code> (o toast):
          é uma linha de código e some sozinho. <strong>Some sozinho é exatamente o
          defeito.</strong> A mensagem que a pessoa mais precisa ler é a que explica por que
          ela não entrou — e ela vai estar olhando para o teclado, ou para o gerenciador de
          senhas, quando o toast aparecer e for embora. Ela volta os olhos para a tela e o
          formulário está lá, limpo, como se nada tivesse acontecido.
        </P>
        <P>
          O <code>Alerta</code> fica na tela até a próxima tentativa. Ele está perto dos
          campos que precisam mudar, entra na rolagem, e sobrevive a qualquer distração.
        </P>

        <Destaque>
          <strong>Sobre o <code>role="alert"</code>:</strong> não se passa à mão — o{' '}
          <code>Alerta</code> nem aceita a prop <code>role</code>. Quem decide é o{' '}
          <code>tom</code>: só <code>perigo</code> vira <code>role="alert"</code> e
          interrompe o leitor de tela; os outros três viram <code>role="status"</code> e
          esperam a vez. É a escolha certa entregue de graça — e não dá para errar mesmo
          querendo.
        </Destaque>

        <H3>Erro de campo fica no campo</H3>
        <P>
          "Isso não parece um e-mail" não é um problema do sistema: é um problema{' '}
          <em>daquele campo</em>. Ele vai no <code>erro</code> do <code>CampoForm</code>, que
          amarra a mensagem ao controle por <code>aria-describedby</code> e marca{' '}
          <code>aria-invalid</code>. Quem usa leitor de tela ouve o rótulo, o erro e a
          instrução — na ordem. Um vermelho na borda não faz nada disso.
        </P>
        <P>
          A divisão é essa, e vale para qualquer formulário:{' '}
          <strong>o que a pessoa digitou errado fica no campo; o que o sistema recusou fica
          no alerta.</strong>
        </P>

        <H3>O botão carrega no lugar</H3>
        <P>
          Com <code>loading</code>, o rótulo some da vista mas continua ocupando o espaço
          dele. O botão não encolhe — não "foge" do dedo no meio do segundo clique. E o
          clique fica bloqueado, então não há como enviar o formulário duas vezes por
          impaciência.
        </P>

        <H3>noValidate no form</H3>
        <P>
          Sem ele, o navegador abre o balãozinho nativo dele por cima da nossa mensagem: duas
          mensagens diferentes, para o mesmo erro, em idiomas diferentes. O{' '}
          <code>obrigatorio</code> do <code>CampoForm</code> liga <code>aria-required</code>{' '}
          — não o <code>required</code> do HTML — exatamente para essa briga não existir.
        </P>

        <Bloco lang="tsx">{`{falha && (
  <Alerta tom="perigo" titulo="Não foi possível entrar">
    {falha} Confira o e-mail e tente de novo.
  </Alerta>
)}

<CampoForm label="E-mail" erro={erros.email} obrigatorio>
  <Campo type="email" value={email} onChange={e => setEmail(e.target.value)} />
</CampoForm>

<Button type="submit" variant="primary" block loading={enviando}>Entrar</Button>`}</Bloco>
      </Secao>
    </>
  )
}
