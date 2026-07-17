import { useState, type FormEvent } from 'react'
import {
  Acordeao,
  Alerta,
  AreaTexto,
  Button,
  Campo,
  CampoForm,
  GrupoRadio,
  Interruptor,
  ItemAcordeao,
  Radio,
  Selecao,
} from '@amboni/ui'
import { Secao, P, Titulo, H3, Aviso as Destaque, Bloco } from '../lib/blocos'
import './exemplos.css'

/**
 * Cadastro de cliente — o formulário longo, que é onde formulário fica difícil.
 *
 * Quatro blocos, 11 controles. O problema desta tela não é desenhar campo: é o que
 * acontece quando alguém erra o e-mail no bloco 1 e clica em "Salvar" com o bloco 4
 * aberto. Um erro dentro de uma seção fechada é um erro que não existe.
 */

const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
].map(uf => ({ valor: uf, rotulo: uf }))

interface Erros {
  nome?: string
  email?: string
  telefone?: string
  cidade?: string
}

/** Em que bloco mora cada campo. É o que permite abrir a seção certa quando dá erro. */
const BLOCO_DO_CAMPO: Record<keyof Erros, string> = {
  nome: 'pessoais',
  email: 'pessoais',
  telefone: 'pessoais',
  cidade: 'endereco',
}

function CadastroCliente() {
  const [aberto, setAberto] = useState<string[]>(['pessoais'])

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('SC')

  const [whats, setWhats] = useState(true)
  const [ofertas, setOfertas] = useState(false)
  const [horario, setHorario] = useState('tarde')
  const [obs, setObs] = useState('')

  const [erros, setErros] = useState<Erros>({})
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function validar(): Erros {
    const e: Erros = {}
    if (!nome.trim()) e.nome = 'Informe o nome do cliente.'
    else if (nome.trim().split(/\s+/).length < 2) e.nome = 'Informe o nome completo, com sobrenome.'

    if (!email.trim()) e.email = 'Informe o e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'Isso não parece um e-mail.'

    // O telefone só é obrigatório se ele vai receber WhatsApp — a regra do formulário
    // depende de um interruptor que está em OUTRO bloco. É por isso que o exemplo existe.
    if (whats && !telefone.trim()) {
      e.telefone = 'Sem telefone não dá para enviar no WhatsApp. Preencha, ou desligue o envio em Preferências.'
    }

    if (!cidade.trim()) e.cidade = 'Informe a cidade.'
    return e
  }

  function salvar(ev: FormEvent) {
    ev.preventDefault()
    setSalvo(false)

    const e = validar()
    setErros(e)

    const campos = Object.keys(e) as (keyof Erros)[]
    if (campos.length > 0) {
      // Abre TODO bloco que tem erro. Um erro dentro de uma seção fechada é um erro que
      // ninguém vê — a pessoa clica em "Salvar", nada acontece, e ela conclui que o botão
      // está quebrado. Abrir é obrigação de quem monta a tela: o Acordeao não tem como
      // saber o que é erro.
      const comErro = [...new Set(campos.map(c => BLOCO_DO_CAMPO[c]))]
      setAberto(a => [...new Set([...a, ...comErro])])
      return
    }

    setSalvando(true)
    setTimeout(() => {
      setSalvando(false)
      setSalvo(true)
    }, 800)
  }

  const totalErros = Object.keys(erros).length

  return (
    <div className="ex-palco">
      <div className="ex-topo">
        <span className="ex-topo__nome">iSafe CRM</span>
        <span className="ex-topo__spacer" />
      </div>

      <form onSubmit={salvar} noValidate>
        <div className="ex-corpo">
          <div>
            <h3 className="ex-corpo__titulo">Novo cliente</h3>
            <p className="ex-corpo__sub">Só o nome, o e-mail e a cidade são obrigatórios.</p>
          </div>

          {/* O resumo em cima só aparece DEPOIS de tentar salvar, e some quando conserta.
              Nasce antes disso, ele acusa a pessoa de errar o que ela ainda ia digitar. */}
          {totalErros > 0 && (
            <Alerta tom="perigo" titulo={`Faltou ${totalErros === 1 ? 'um campo' : `${totalErros} campos`}`}>
              As seções com problema foram abertas abaixo. Cada erro está no campo dele.
            </Alerta>
          )}

          {salvo && (
            <Alerta tom="sucesso" titulo="Cliente cadastrado" dispensavel onDispensar={() => setSalvo(false)}>
              {nome.trim()} entra no pipeline no D+3.
            </Alerta>
          )}

          {/* `multiplo`: quem revisa o cadastro inteiro antes de salvar quer os quatro
              blocos abertos ao mesmo tempo. Com `unico`, abrir "Endereço" fecharia
              "Dados pessoais" — e conferir dois blocos juntos vira um vai e volta. */}
          <Acordeao tipo="multiplo" valor={aberto} onChange={setAberto}>
            <ItemAcordeao valor="pessoais" titulo="Dados pessoais" nivelTitulo={4}>
              <div className="ex-form">
                <CampoForm label="Nome completo" erro={erros.nome} obrigatorio>
                  <Campo
                    autoComplete="name"
                    placeholder="Marina Rodrigues Lima"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                  />
                </CampoForm>

                <div className="ex-form__par">
                  <CampoForm
                    label="E-mail"
                    ajuda="Usamos só para a nota fiscal."
                    erro={erros.email}
                    obrigatorio
                  >
                    <Campo
                      type="email"
                      autoComplete="email"
                      placeholder="marina@email.com.br"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </CampoForm>

                  <CampoForm
                    label="WhatsApp"
                    ajuda="Com DDD. É por aqui que as mensagens do pipeline saem."
                    erro={erros.telefone}
                  >
                    <Campo
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(48) 99612-4471"
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                    />
                  </CampoForm>
                </div>
              </div>
            </ItemAcordeao>

            <ItemAcordeao valor="endereco" titulo="Endereço" nivelTitulo={4}>
              <div className="ex-form">
                <div className="ex-form__par ex-form__cep">
                  <CampoForm label="CEP">
                    {/* inputMode="numeric": no celular abre o teclado de número direto.
                        Não é `type="number"`, que traria as setinhas de incremento —
                        ninguém incrementa um CEP. */}
                    <Campo
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="88801-000"
                      value={cep}
                      onChange={e => setCep(e.target.value)}
                    />
                  </CampoForm>

                  <CampoForm label="Cidade" erro={erros.cidade} obrigatorio>
                    <Campo
                      autoComplete="address-level2"
                      placeholder="Criciúma"
                      value={cidade}
                      onChange={e => setCidade(e.target.value)}
                    />
                  </CampoForm>
                </div>

                <div className="ex-form__par">
                  {/* Sem `buscavel`: são 27 opções, e o JSDoc do Selecao diz para ligar
                      só com 30+. Ligar aqui trocaria a roda nativa do celular — que todo
                      mundo já sabe usar — por um combobox, para ganhar um filtro que
                      ninguém pediu numa lista que cabe na tela. */}
                  <CampoForm label="Estado">
                    {({ id, ...aria }) => (
                      <Selecao
                        id={id}
                        {...aria}
                        opcoes={ESTADOS}
                        valor={uf}
                        onChange={setUf}
                        placeholder="UF"
                      />
                    )}
                  </CampoForm>
                </div>
              </div>
            </ItemAcordeao>

            <ItemAcordeao valor="prefs" titulo="Preferências de contato" nivelTitulo={4}>
              <div className="ex-form">
                {/* Interruptor e não Caixa? Aqui é dívida honesta: num formulário com
                    "Salvar", a escolha só vale depois do botão — o que, pelo JSDoc da
                    própria biblioteca, é caso de Caixa. Ficou Interruptor de propósito,
                    para o exemplo mostrar o componente. Numa tela de produto, seria Caixa. */}
                <Interruptor
                  label="Recebe mensagens no WhatsApp"
                  descricao="Boas-vindas, dicas de uso e aniversário. Desligado, o cliente sai do pipeline."
                  checked={whats}
                  onChange={e => setWhats(e.target.checked)}
                />
                <Interruptor
                  label="Recebe ofertas e promoções"
                  descricao="No máximo uma por mês. Exige o consentimento do cliente."
                  checked={ofertas}
                  onChange={e => setOfertas(e.target.checked)}
                />

                {/* O label do grupo é a PERGUNTA. É o que o leitor de tela anuncia ao
                    entrar no conjunto de rádios — "Manhã" sozinho não diz manhã de quê. */}
                <GrupoRadio
                  label="Melhor horário para receber"
                  name="horario"
                  value={horario}
                  onChange={setHorario}
                >
                  <Radio value="manha" label="Manhã" descricao="Entre 9h e 12h" />
                  <Radio value="tarde" label="Tarde" descricao="Entre 13h e 18h" />
                  <Radio value="noite" label="Noite" descricao="Entre 18h e 20h. Fora da janela recomendada." />
                </GrupoRadio>
              </div>
            </ItemAcordeao>

            <ItemAcordeao valor="obs" titulo="Observações" nivelTitulo={4}>
              <div className="ex-form">
                <CampoForm
                  label="Observações internas"
                  ajuda="O cliente nunca vê isto. Serve para quem atende."
                >
                  <AreaTexto
                    rows={4}
                    autoResize
                    contador
                    maxLength={500}
                    placeholder="Prefere ser chamada de Mari. Comprou para a filha."
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                  />
                </CampoForm>
              </div>
            </ItemAcordeao>
          </Acordeao>
        </div>

        <div className="ex-form__rodape">
          <Button type="button" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={salvando}>
            Salvar cliente
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function ExemploFormularioPage() {
  return (
    <>
      <Titulo
        eyebrow="Exemplos de tela"
        lead="Onze controles em quatro blocos — e a única pergunta que importa num formulário longo: o que acontece quando o erro está numa seção fechada?"
      >
        Cadastro
      </Titulo>

      <Secao>
        <P>
          Formulário longo é fácil de desenhar e difícil de acertar. O problema não é o campo:
          é o que a tela faz quando alguém erra o e-mail no primeiro bloco e clica em "Salvar"
          com o quarto aberto.
        </P>
        <P>
          Clique em "Salvar cliente" com tudo vazio — o formulário abre as seções com
          problema.
        </P>
      </Secao>

      <Secao titulo="A tela">
        <CadastroCliente />
      </Secao>

      <Secao titulo="As decisões desta tela">
        <H3>Erro em seção fechada é erro que não existe</H3>
        <P>
          Esta é a decisão que justifica a tela. Sem ela, a pessoa clica em "Salvar", nada
          visível acontece, e a conclusão razoável é que <strong>o botão está
          quebrado</strong>. O <code>Acordeao</code> não tem como resolver isso sozinho — ele
          não sabe o que é um erro. Quem sabe é a tela: existe um mapa de campo → bloco, e o{' '}
          <code>salvar</code> abre todo bloco que tenha erro antes de desistir.
        </P>
        <P>
          O <code>Alerta</code> no topo conta <em>quantos</em> e diz onde procurar. Ele não
          repete as mensagens: cada erro continua morando no campo dele, que é onde a correção
          acontece.
        </P>

        <H3>Acordeao múltiplo, não único</H3>
        <P>
          Quem revisa um cadastro antes de salvar quer ver blocos juntos. Com{' '}
          <code>tipo="unico"</code>, abrir "Endereço" fecharia "Dados pessoais" — e conferir
          os dois vira um vai e volta. Pior: com dois erros em blocos diferentes, seria
          impossível mostrar os dois.
        </P>

        <H3>O Estado usa a forma de função do CampoForm</H3>
        <P>
          O <code>CampoForm</code> clona o filho para injetar <code>id</code> e ARIA. O{' '}
          <code>Selecao</code> tem <code>valor</code>/<code>onChange</code> próprios (recebe o
          valor, não o evento), então aqui a fiação é ligada à mão — é para isso que a forma{' '}
          <code>{'{({ id, ...aria }) => ...}'}</code> existe.
        </P>

        <H3>27 estados não pedem buscavel</H3>
        <P>
          A prop existe e seria fácil ligar. O JSDoc do <code>Selecao</code> diz para usar só
          com 30+ opções, e o motivo é bom: <code>buscavel</code> troca o{' '}
          <code>&lt;select&gt;</code> nativo por um combobox — perde-se a roda do iPhone, que
          todo mundo já sabe usar, para ganhar um filtro numa lista que cabe inteira na tela.
        </P>

        <H3>O contador da AreaTexto não é enfeite</H3>
        <P>
          Com <code>maxLength</code>, o navegador para de aceitar letras no limite{' '}
          <strong>em silêncio</strong>, e corta texto colado sem avisar. A pessoa cola uma
          observação de 700 caracteres, vê 500 e não sabe que perdeu 200. O contador é o único
          aviso que existe.
        </P>

        <Destaque>
          <strong>Dívida honesta:</strong> os dois <code>Interruptor</code> deste formulário
          deveriam ser <code>Caixa</code>. A regra da própria biblioteca é clara — interruptor
          aplica na hora, caixa espera o "Salvar" — e aqui existe um "Salvar". Ficaram assim
          para o exemplo mostrar o componente. Num produto, seria Caixa.
        </Destaque>

        <H3>Rodapé grudado</H3>
        <P>
          "Salvar" no fim da rolagem, depois de quatro blocos abertos, é "Salvar" que ninguém
          acha. O rodapé é <code>position: sticky</code> — e isso é layout, então mora no CSS
          da tela, não numa prop de componente.
        </P>

        <Bloco lang="tsx">{`const BLOCO_DO_CAMPO = { nome: 'pessoais', email: 'pessoais', cidade: 'endereco' }

function salvar(ev) {
  ev.preventDefault()
  const e = validar()
  setErros(e)

  const campos = Object.keys(e)
  if (campos.length > 0) {
    // abre toda seção que tem erro — senão o erro não existe
    const comErro = [...new Set(campos.map(c => BLOCO_DO_CAMPO[c]))]
    setAberto(a => [...new Set([...a, ...comErro])])
    return
  }
  enviar()
}

<Acordeao tipo="multiplo" valor={aberto} onChange={setAberto}>
  <ItemAcordeao valor="pessoais" titulo="Dados pessoais" nivelTitulo={4}>…</ItemAcordeao>
</Acordeao>

// Selecao tem onChange próprio — a fiação do CampoForm vai à mão
<CampoForm label="Estado">
  {({ id, ...aria }) => <Selecao id={id} {...aria} opcoes={ESTADOS} valor={uf} onChange={setUf} />}
</CampoForm>`}</Bloco>
      </Secao>
    </>
  )
}
