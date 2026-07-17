import { useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Campo,
  Dialogo,
  EstadoVazio,
  Etiqueta,
  ItemMenu,
  Menu,
  Paginacao,
  ProvedorAvisos,
  Selecao,
  Selo,
  SeparadorMenu,
  Tabela,
  useAviso,
  type ChaveDeLinha,
  type Coluna,
  type Direcao,
  type Ordem,
  type SeloTom,
} from '@amboni/ui'
import { Secao, P, Titulo, H3, Aviso as Destaque, Bloco, FacaNaoFaca } from '../lib/blocos'
import './exemplos.css'

/**
 * A lista de clientes — a tela mais completa das quatro, e o teste de fogo da biblioteca.
 *
 * Buscar, filtrar, ordenar, selecionar, paginar e excluir. Tudo funciona de verdade com
 * estado local: se qualquer uma dessas seis coisas exigisse um contorno em CSS ou uma prop
 * inventada, a biblioteca teria um problema — e o exemplo esconderia.
 */

/** Lupa desenhada aqui: a biblioteca não impõe pacote de ícones, e a documentação também não. */
function Lupa() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Três pontos do menu de linha. */
function Pontos() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="3" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="13" r="1.4" fill="currentColor" />
    </svg>
  )
}

type Etapa = 'd3' | 'd15' | 'd90' | 'd365' | 'fora'

interface Cliente {
  id: number
  nome: string
  cidade: string
  telefone: string
  etapa: Etapa
  produto: string
  valor: number
  dias: number
}

const ETAPAS: Record<Etapa, { rotulo: string; tom: SeloTom }> = {
  d3: { rotulo: 'Boas-vindas D+3', tom: 'marca' },
  d15: { rotulo: 'Dicas D+15', tom: 'info' },
  d90: { rotulo: 'Oferta D+90', tom: 'sucesso' },
  d365: { rotulo: 'Aniversário D+365', tom: 'aviso' },
  fora: { rotulo: 'Fora do pipeline', tom: 'neutro' },
}

const OPCOES_ETAPA = [
  { valor: 'd3', rotulo: 'Boas-vindas D+3' },
  { valor: 'd15', rotulo: 'Dicas D+15' },
  { valor: 'd90', rotulo: 'Oferta D+90' },
  { valor: 'd365', rotulo: 'Aniversário D+365' },
  { valor: 'fora', rotulo: 'Fora do pipeline' },
]

const OPCOES_CIDADE = [
  { valor: 'Criciúma', rotulo: 'Criciúma' },
  { valor: 'Tubarão', rotulo: 'Tubarão' },
  { valor: 'Araranguá', rotulo: 'Araranguá' },
  { valor: 'Florianópolis', rotulo: 'Florianópolis' },
]

const CLIENTES: Cliente[] = [
  { id: 1, nome: 'Marina Rodrigues Lima', cidade: 'Criciúma', telefone: '(48) 99612-4471', etapa: 'd15', produto: 'iPhone 15 Pro', valor: 8299.0, dias: 15 },
  { id: 2, nome: 'Carlos Eduardo Souza', cidade: 'Tubarão', telefone: '(48) 99841-2093', etapa: 'd3', produto: 'MacBook Air M3', valor: 11499.0, dias: 3 },
  { id: 3, nome: 'Juliana Beatriz Alves', cidade: 'Araranguá', telefone: '(48) 99127-8830', etapa: 'd90', produto: 'iPad Air', valor: 5799.0, dias: 92 },
  { id: 4, nome: 'Rafael Menezes', cidade: 'Criciúma', telefone: '(48) 99320-5514', etapa: 'd15', produto: 'MacBook Pro 14"', valor: 18990.0, dias: 16 },
  { id: 5, nome: 'Patrícia Nogueira', cidade: 'Florianópolis', telefone: '(48) 99754-1102', etapa: 'd365', produto: 'iPhone 14', valor: 5499.0, dias: 364 },
  { id: 6, nome: 'Bruno Tavares', cidade: 'Tubarão', telefone: '(48) 99009-7743', etapa: 'd90', produto: 'Apple Watch S9', valor: 4299.0, dias: 88 },
  { id: 7, nome: 'Ana Cláudia Ferreira', cidade: 'Criciúma', telefone: '(48) 99655-3321', etapa: 'd3', produto: 'AirPods Pro 2', valor: 2199.0, dias: 4 },
  { id: 8, nome: 'Diego Marchetti', cidade: 'Araranguá', telefone: '(48) 99188-6690', etapa: 'fora', produto: 'Magic Keyboard', valor: 1499.0, dias: 412 },
  { id: 9, nome: 'Fernanda da Silva Costa', cidade: 'Florianópolis', telefone: '(48) 99432-2218', etapa: 'd15', produto: 'iPhone 15', valor: 6799.0, dias: 14 },
  { id: 10, nome: 'Gustavo Henrique Prado', cidade: 'Criciúma', telefone: '(48) 99871-0056', etapa: 'd90', produto: 'iMac 24"', valor: 14299.0, dias: 95 },
  { id: 11, nome: 'Letícia Amaral', cidade: 'Tubarão', telefone: '(48) 99266-4487', etapa: 'd3', produto: 'iPad Pro 11"', valor: 9899.0, dias: 3 },
  { id: 12, nome: 'Ricardo Bittencourt', cidade: 'Criciúma', telefone: '(48) 99510-9932', etapa: 'fora', produto: 'AirTag (4un)', valor: 599.0, dias: 520 },
  { id: 13, nome: 'Camila Vasconcelos', cidade: 'Florianópolis', telefone: '(48) 99377-1145', etapa: 'd365', produto: 'MacBook Air M2', valor: 8999.0, dias: 361 },
  { id: 14, nome: 'Thiago Boeira', cidade: 'Araranguá', telefone: '(48) 99044-7728', etapa: 'd15', produto: 'iPhone 13', valor: 3999.0, dias: 17 },
  { id: 15, nome: 'Vanessa Cardoso Reis', cidade: 'Tubarão', telefone: '(48) 99623-8890', etapa: 'd90', produto: 'Apple Watch SE', valor: 2799.0, dias: 90 },
  { id: 16, nome: 'Eduardo Zanette', cidade: 'Criciúma', telefone: '(48) 99118-2264', etapa: 'd3', produto: 'iPhone 15 Pro Max', valor: 10499.0, dias: 5 },
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const POR_PAGINA = 6

function ListaClientes() {
  const aviso = useAviso()

  const [busca, setBusca] = useState('')
  const [etapa, setEtapa] = useState('')
  const [cidade, setCidade] = useState('')
  const [ordem, setOrdem] = useState<Ordem>({ coluna: 'dias', direcao: 'asc' })
  const [pagina, setPagina] = useState(1)
  const [selecionadas, setSelecionadas] = useState<ChaveDeLinha[]>([])
  const [alvo, setAlvo] = useState<Cliente | null>(null)

  /**
   * Os excluídos ficam num Set, e a lista base nunca é mutada.
   *
   * A alternativa óbvia — `setClientes(cs => cs.filter(...))` — torna o "Desfazer" um
   * problema: para devolver o cliente ao lugar certo seria preciso guardar o índice dele,
   * que muda quando a ordenação muda. Marcar em vez de remover mantém a ordem de graça, e
   * desfazer vira uma linha.
   */
  const [excluidos, setExcluidos] = useState<ReadonlySet<number>>(() => new Set())

  const filtros = [
    busca.trim() && { id: 'busca', rotulo: `Busca: "${busca.trim()}"`, limpar: () => setBusca('') },
    etapa && {
      id: 'etapa',
      rotulo: `Etapa: ${ETAPAS[etapa as Etapa].rotulo}`,
      limpar: () => setEtapa(''),
    },
    cidade && { id: 'cidade', rotulo: `Cidade: ${cidade}`, limpar: () => setCidade('') },
  ].filter(Boolean) as { id: string; rotulo: string; limpar: () => void }[]

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    const filtradas = CLIENTES.filter(c => {
      if (excluidos.has(c.id)) return false
      if (etapa && c.etapa !== etapa) return false
      if (cidade && c.cidade !== cidade) return false
      if (!termo) return true
      // A busca varre nome, telefone e produto: é o que a pessoa tem na mão quando
      // atende ("é a Marina", "o número termina em 4471", "comprou o Air").
      return (
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.includes(termo) ||
        c.produto.toLowerCase().includes(termo)
      )
    })

    const sinal = ordem.direcao === 'asc' ? 1 : -1
    return [...filtradas].sort((a, b) => {
      if (ordem.coluna === 'valor') return (a.valor - b.valor) * sinal
      if (ordem.coluna === 'dias') return (a.dias - b.dias) * sinal
      // localeCompare com pt-BR: sem isso "Ávila" cai depois de "Zanette", porque o
      // comparador padrão ordena por código do caractere e o "Á" mora longe do "A".
      return a.nome.localeCompare(b.nome, 'pt-BR') * sinal
    })
  }, [busca, etapa, cidade, ordem, excluidos])

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA))
  // A página é limitada na leitura, não no estado: excluir o último item da página 3 deixa
  // a lista com 2 páginas, e quem está "na 3" precisa ver a 2 — não uma tela em branco.
  const paginaAtual = Math.min(pagina, totalPaginas)
  const daPagina = visiveis.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  /** Todo filtro volta para a página 1: filtrar na página 4 e cair no vazio é o clássico. */
  function filtrar(fn: () => void) {
    fn()
    setPagina(1)
  }

  function ordenar(coluna: string, direcao: Direcao) {
    setOrdem({ coluna, direcao })
    setPagina(1)
  }

  function excluir(c: Cliente) {
    setExcluidos(atual => new Set(atual).add(c.id))
    setSelecionadas(atual => atual.filter(k => k !== c.id))
    setAlvo(null)

    aviso.sucesso(`${c.nome} foi excluído`, {
      descricao: 'O histórico de mensagens continua guardado por 90 dias.',
      // Com `acao`, o aviso NÃO some sozinho — o componente decide isso por conta
      // própria. Ver as decisões da tela: um botão que foge é um botão que não existe.
      acao: {
        rotulo: 'Desfazer',
        onClick: () =>
          setExcluidos(atual => {
            const novo = new Set(atual)
            novo.delete(c.id)
            return novo
          }),
      },
    })
  }

  const colunas: Coluna<Cliente>[] = [
    {
      chave: 'nome',
      titulo: 'Cliente',
      ordenavel: true,
      render: c => (
        <div className="ex-pessoa">
          {/* decorativo: o nome já está escrito ao lado. Sem isto, quem usa leitor de
              tela ouve "Marina Rodrigues Lima, Marina Rodrigues Lima" em cada linha. */}
          <Avatar nome={c.nome} size="sm" decorativo />
          <div className="ex-pessoa__texto">
            <div className="ex-pessoa__nome">{c.nome}</div>
            <div className="ex-pessoa__sub">{c.telefone}</div>
          </div>
        </div>
      ),
    },
    { chave: 'cidade', titulo: 'Cidade' },
    { chave: 'produto', titulo: 'Comprou' },
    {
      chave: 'etapa',
      titulo: 'Etapa',
      render: c => <Selo tom={ETAPAS[c.etapa].tom}>{ETAPAS[c.etapa].rotulo}</Selo>,
    },
    {
      chave: 'valor',
      titulo: 'Valor',
      numerico: true,
      ordenavel: true,
      render: c => brl.format(c.valor),
    },
    {
      chave: 'dias',
      titulo: 'Dias',
      numerico: true,
      ordenavel: true,
      render: c => `${c.dias}d`,
    },
    {
      chave: 'acoes',
      titulo: '',
      alinhar: 'direita',
      render: c => (
        <Menu
          // `fim`: no fim de uma linha de tabela, o painel alinhado ao início cresceria
          // para fora da tela.
          alinhamento="fim"
          gatilho={
            <Button size="sm" variant="ghost" aria-label={`Ações de ${c.nome}`}>
              <Pontos />
            </Button>
          }
        >
          <ItemMenu onClick={() => aviso.info(`Abrindo o cadastro de ${c.nome}`)}>Editar</ItemMenu>
          <ItemMenu onClick={() => aviso.info(`Histórico de ${c.nome}`)}>Ver histórico</ItemMenu>
          <SeparadorMenu />
          {/* `perigo` pinta de vermelho — e o rótulo diz a palavra. A cor é reforço. */}
          <ItemMenu perigo onClick={() => setAlvo(c)}>
            Excluir
          </ItemMenu>
        </Menu>
      ),
    },
  ]

  return (
    <div className="ex-palco">
      <div className="ex-topo">
        <span className="ex-topo__nome">iSafe CRM</span>
        <span className="ex-topo__spacer" />
        <Button size="sm" variant="primary">
          Novo cliente
        </Button>
      </div>

      <div className="ex-corpo">
        <div>
          <h3 className="ex-corpo__titulo">Clientes</h3>
          <p className="ex-corpo__sub">
            {visiveis.length} de {CLIENTES.length - excluidos.size} no pipeline
          </p>
        </div>

        <div className="ex-barra">
          <div className="ex-barra__busca">
            <Campo
              type="search"
              placeholder="Buscar por nome, telefone ou produto"
              iconeEsq={<Lupa />}
              limpar
              aria-label="Buscar clientes"
              value={busca}
              onChange={e => filtrar(() => setBusca(e.target.value))}
            />
          </div>
          <div className="ex-barra__filtro">
            <Selecao
              opcoes={OPCOES_ETAPA}
              valor={etapa}
              onChange={v => filtrar(() => setEtapa(v))}
              placeholder="Todas as etapas"
              limpavel
              aria-label="Filtrar por etapa"
            />
          </div>
          <div className="ex-barra__filtro">
            <Selecao
              opcoes={OPCOES_CIDADE}
              valor={cidade}
              onChange={v => filtrar(() => setCidade(v))}
              placeholder="Todas as cidades"
              limpavel
              aria-label="Filtrar por cidade"
            />
          </div>
        </div>

        {filtros.length > 0 && (
          <div className="ex-etiquetas">
            <span className="ex-etiquetas__rotulo">Filtros</span>
            {filtros.map(f => (
              <Etiqueta
                key={f.id}
                tom="marca"
                removivel
                // "Remover" em três etiquetas iguais deixa quem usa leitor de tela sem
                // saber qual é qual. O rótulo diz O QUE sai.
                rotuloRemover={`Remover filtro ${f.rotulo}`}
                onRemover={() => filtrar(f.limpar)}
              >
                {f.rotulo}
              </Etiqueta>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => filtrar(() => {
                setBusca('')
                setEtapa('')
                setCidade('')
              })}
            >
              Limpar tudo
            </Button>
          </div>
        )}

        {selecionadas.length > 0 && (
          <div className="ex-selecao">
            <span>
              {selecionadas.length} {selecionadas.length === 1 ? 'selecionado' : 'selecionados'}
            </span>
            <span className="ex-selecao__spacer" />
            <Button size="sm" onClick={() => aviso.info('Campanha em massa — só no exemplo')}>
              Enviar campanha
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelecionadas([])}>
              Limpar seleção
            </Button>
          </div>
        )}

        <Card>
          <CardHeader
            title="Todos os clientes"
            subtitle="Ordene pelo cabeçalho. Selecione para agir em lote."
            headingLevel={4}
          />
          <CardBody flush>
            <Tabela
              rotulo="Clientes no pipeline"
              colunas={colunas}
              linhas={daPagina}
              chaveLinha={c => c.id}
              ordem={ordem}
              onOrdenar={ordenar}
              selecionaveis
              selecionadas={selecionadas}
              onSelecionar={setSelecionadas}
              colunaFixa
              vazio={
                <EstadoVazio
                  titulo="Nenhum cliente com esses filtros"
                  descricao="Os filtros ativos não deixaram ninguém de fora por acaso — confira a etapa e a cidade."
                  acao={
                    <Button
                      size="sm"
                      onClick={() => filtrar(() => {
                        setBusca('')
                        setEtapa('')
                        setCidade('')
                      })}
                    >
                      Limpar filtros
                    </Button>
                  }
                  size="sm"
                />
              }
            />
          </CardBody>
        </Card>

        {visiveis.length > 0 && (
          <Paginacao
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            onChange={setPagina}
            totalItens={visiveis.length}
            porPagina={POR_PAGINA}
          />
        )}
      </div>

      <Dialogo
        aberto={alvo !== null}
        onFechar={() => setAlvo(null)}
        titulo="Excluir cliente?"
        descricao={
          alvo
            ? `${alvo.nome} sai do pipeline e para de receber mensagens automáticas.`
            : undefined
        }
        size="sm"
        rodape={
          <>
            <Button onClick={() => setAlvo(null)}>Cancelar</Button>
            {/* A palavra "Excluir" no botão, não só o vermelho: parte das pessoas não
                distingue a cor, e para elas o botão perigoso é só mais um botão. */}
            <Button variant="danger" onClick={() => alvo && excluir(alvo)}>
              Excluir
            </Button>
          </>
        }
      >
        O histórico de mensagens continua guardado por 90 dias. Dá para desfazer logo depois.
      </Dialogo>
    </div>
  )
}

export default function ExemploCrmPage() {
  return (
    <>
      <Titulo
        eyebrow="Exemplos de tela"
        lead="Buscar, filtrar, ordenar, selecionar, paginar e excluir — funcionando de verdade, numa tela só. É o teste de fogo da biblioteca."
      >
        Lista de clientes
      </Titulo>

      <Secao>
        <P>
          A tela mais completa das quatro, e a mais honesta: se montar uma lista de CRM com
          esta biblioteca fosse desconfortável, é aqui que apareceria. Nada abaixo é mockup —{' '}
          <strong>ordene pelo cabeçalho, filtre, exclua alguém e desfaça</strong>. Tudo roda
          com estado local.
        </P>
      </Secao>

      <Secao titulo="A tela">
        {/* O ProvedorAvisos precisa estar ACIMA de quem chama useAviso() — por isso a
            lista é um componente separado, e não o corpo desta página. */}
        <ProvedorAvisos>
          <ListaClientes />
        </ProvedorAvisos>
      </Secao>

      <Secao titulo="As decisões desta tela">
        <H3>Selo é estado. Etiqueta é entrada.</H3>
        <P>
          As duas são pastilhas pequenas e coloridas, e é o par mais trocado da biblioteca. A
          diferença é de quem é a pastilha: a <strong>etapa</strong> do cliente é um{' '}
          <code>Selo</code> — o sistema informa, você lê, e não há X para clicar porque não dá
          para "remover" o fato de o cliente estar no D+15. Já cada <strong>filtro
          aplicado</strong> é uma <code>Etiqueta</code> — você criou, e você tira.
        </P>
        <P>
          O teste é uma pergunta: <em>tem X?</em> Se tem, é Etiqueta. Se não faz sentido ter,
          é Selo.
        </P>

        <H3>A confirmação de exclusão existe porque o desfazer não basta sozinho</H3>
        <P>
          A tela tem os dois: um <code>Dialogo</code> antes e um "Desfazer" depois.
          Redundante? Não. O <code>Dialogo</code> segura o clique errado —{' '}
          <em>"Excluir" e "Editar" são vizinhos no menu</em>. O "Desfazer" segura a decisão
          errada — a pessoa quis excluir mesmo, e se arrependeu na linha seguinte. São dois
          erros diferentes, e cada um tem a sua rede.
        </P>
        <P>
          O botão do diálogo é <code>variant="danger"</code> <strong>e</strong> diz a palavra
          "Excluir". Cerca de 1 em cada 12 homens não distingue vermelho: para essas pessoas,
          um diálogo com "Cancelar" e "Confirmar" tem dois botões cinzas idênticos e nenhuma
          pista de qual é o que apaga.
        </P>

        <FacaNaoFaca
          faca={{
            titulo: 'A palavra faz o aviso',
            texto: '<Button variant="danger">Excluir</Button> — funciona em preto e branco, funciona narrado.',
          }}
          naoFaca={{
            titulo: 'A cor faz o aviso',
            texto: '<Button variant="danger">Confirmar</Button> — some o vermelho, some o aviso.',
          }}
        />

        <H3>O toast de "Desfazer" não some sozinho — e isso vem de graça</H3>
        <P>
          Um botão com prazo de validade é um botão que não existe: a pessoa lê o toast,
          entende que dá para desfazer, move o mouse — e ele já foi. Aqui{' '}
          <strong>não é preciso passar <code>fixo</code></strong>: o <code>Aviso</code> lê que
          existe uma <code>acao</code> e prende o aviso na tela sozinho. A mesma regra vale
          para <code>tom="erro"</code>.
        </P>

        <Destaque>
          Ler o componente antes de escrever a tela vale por isto: sem saber dessa regra, a
          resposta natural seria <code>duracao: 15000</code> — um número redondo escolhido no
          olho, que ainda assim tira o botão da tela de quem lê devagar.
        </Destaque>

        <H3>Filtrar sempre volta para a página 1</H3>
        <P>
          Estar na página 4 e aplicar um filtro que devolve 6 resultados dá uma tela em branco
          e uma cara de bug. A <code>Paginacao</code> não faz isso sozinha de propósito — um{' '}
          <code>onChange</code> disparado por baixo do pano é pior que o problema. Quem
          resolve é a tela: todo filtro daqui passa por uma função que zera a página.
        </P>
        <P>
          O mesmo vale para excluir o último item de uma página: a página é limitada na
          leitura (<code>Math.min(pagina, totalPaginas)</code>), não no estado.
        </P>

        <H3>Avatar decorativo na coluna do nome</H3>
        <P>
          O nome já está escrito ao lado. Sem <code>decorativo</code>, quem usa leitor de tela
          ouve <strong>"Marina Rodrigues Lima, Marina Rodrigues Lima"</strong> em cada uma das
          linhas. É o defeito mais comum de tabela com avatar, e é uma prop.
        </P>

        <H3>chaveLinha não aceita o índice — e ainda bem</H3>
        <P>
          Com índice, ao reordenar, a linha 3 continua sendo "3" para o React mesmo com outro
          cliente dentro — e o estado preso à posição (o checkbox marcado) fica na linha
          errada. Numa tela que tem seleção <em>e</em> exclusão, isso é apagar o cliente
          errado. A prop é obrigatória por isso.
        </P>

        <Bloco lang="tsx">{`// Excluir: marca em vez de remover — o "Desfazer" vira uma linha
function excluir(c: Cliente) {
  setExcluidos(atual => new Set(atual).add(c.id))
  setAlvo(null)

  aviso.sucesso(\`\${c.nome} foi excluído\`, {
    descricao: 'O histórico continua guardado por 90 dias.',
    acao: { rotulo: 'Desfazer', onClick: () => devolver(c.id) },  // ← não some sozinho
  })
}

// Todo filtro volta para a página 1
function filtrar(fn: () => void) { fn(); setPagina(1) }

// O menu de linha alinha pelo fim, senão cresce para fora da tela
<Menu alinhamento="fim" gatilho={<Button size="sm" variant="ghost" aria-label={\`Ações de \${c.nome}\`}><Pontos /></Button>}>
  <ItemMenu onClick={editar}>Editar</ItemMenu>
  <SeparadorMenu />
  <ItemMenu perigo onClick={() => setAlvo(c)}>Excluir</ItemMenu>
</Menu>`}</Bloco>
      </Secao>
    </>
  )
}
