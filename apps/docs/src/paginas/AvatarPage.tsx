import { Avatar, GrupoAvatar, iniciaisDoNome, tomDoNome } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, TabelaProps, FacaNaoFaca, Bloco } from '../lib/blocos'

const PESSOAS = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'José da Silva', 'Márcia Ávila Rocha']

const NOMES_DIFICEIS = [
  { nome: 'Maria Silva Santos', nota: 'primeira + última' },
  { nome: 'Maria da Silva', nota: 'a partícula não conta' },
  { nome: 'Madonna', nota: 'uma palavra só: duas letras dela' },
  { nome: 'Ángela Óscar', nota: 'acento preservado' },
]

export default function AvatarPage() {
  return (
    <>
      <Titulo
        eyebrow="Componentes"
        lead="A pessoa. Foto quando dá, iniciais quando não dá, e nunca um ícone de imagem quebrada."
      >
        Avatar
      </Titulo>

      <Secao>
        <Bloco lang="jsx">{`import { Avatar, GrupoAvatar } from '@amboni/ui'`}</Bloco>
      </Secao>

      <Secao titulo="O básico">
        <Demo
          codigo={`<Avatar nome="Ana Souza" />
<Avatar nome="Bruno Lima" size="lg" status="online" />
<Avatar nome="Carla Dias" formato="quadrado" />
<Avatar nome="" />                        // sem nome: silhueta`}
        >
          {PESSOAS.map(n => (
            <Avatar key={n} nome={n} />
          ))}
          <Avatar nome="" />
        </Demo>
        <P>
          Só <code>nome</code> é obrigatório — e ele faz três trabalhos: vira as iniciais, sorteia
          a cor e é o rótulo acessível. Sem nome nenhum (cliente importado sem cadastro) aparece
          uma silhueta: <strong>um círculo em branco parece falha de carregamento.</strong>
        </P>
      </Secao>

      <Secao titulo="Iniciais: primeira + ÚLTIMA">
        <Demo
          variante="plain"
          codigo={`iniciaisDoNome('Maria Silva Santos')  // "MS"
iniciaisDoNome('Maria da Silva')      // "MS"  — e não "MD"
iniciaisDoNome('Madonna')             // "MA"
iniciaisDoNome('Ángela Óscar')        // "ÁÓ"`}
        >
          {NOMES_DIFICEIS.map(p => (
            <div key={p.nome} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240 }}>
              <Avatar nome={p.nome} decorativo />
              <div>
                <div style={{ fontWeight: 600 }}>{p.nome}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {iniciaisDoNome(p.nome)} — {p.nota}
                </div>
              </div>
            </div>
          ))}
        </Demo>
        <P>
          A regra ingênua — as <em>duas primeiras</em> palavras — daria{' '}
          <strong>"MD" para "Maria da Silva"</strong>, que não é a inicial de ninguém. Metade dos
          nomes brasileiros tem partícula no meio: <em>da, de, do, dos, e</em>. Primeira +{' '}
          <strong>última</strong> acerta esses e continua acertando "Maria Silva".
        </P>
        <P>
          <strong>Acento é preservado</strong>: "Ángela" vira "Á". Jogar o acento fora deixaria o
          avatar escrevendo o nome da pessoa errado — que é exatamente o que ela nota. Nome de
          uma palavra só ("Madonna", "@joana") vira duas letras dele mesmo: uma letra sozinha num
          círculo grande fica com cara de bug.
        </P>
        <Aviso>
          O <code>toUpperCase</code> é <code>pt-BR</code> explícito. No locale turco, o "i"
          maiúsculo é "İ" — e o navegador do usuário decide o locale, não você.
        </Aviso>
      </Secao>

      <Secao titulo="A cor é sorteada pelo nome — e é sempre a mesma">
        <Demo
          variante="plain"
          codigo={`tomDoNome('José Silva')  === tomDoNome('JOSÉ SILVA')  // true
tomDoNome('José Silva')  === tomDoNome('jose silva')  // true`}
        >
          {['José Silva', 'JOSÉ SILVA', 'jose silva', 'José da Silva'].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
              <Avatar nome={n} decorativo />
              <div>
                <div style={{ fontFamily: 'var(--amb-fonte-mono)', fontSize: 13 }}>{n}</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>tom: {tomDoNome(n)}</div>
              </div>
            </div>
          ))}
        </Demo>
        <P>
          <strong>Determinístico</strong>: a mesma pessoa tem sempre a mesma cor — em toda tela,
          entre sessões, entre máquinas. Isso não é enfeite. Numa lista de 40 clientes, a cor
          estável é o que deixa o olho reencontrar alguém sem ler todos os nomes. Cor aleatória a
          cada render faria a lista <em>piscar</em> a cada atualização e não ajudaria ninguém.
        </P>
        <P>
          Caixa e acento <strong>caem fora antes do hash</strong>: "JOSÉ SILVA", "José Silva" e
          "jose silva" são a mesma pessoa vinda de três lugares do banco, e precisam do mesmo
          círculo. Repare acima que os três primeiros dão o mesmo tom — e que o quarto, que é
          outro nome, não.
        </P>
        <Bloco lang="jsx">{`// djb2. Não é criptografia — é espalhar nomes parecidos ("Ana Silva"/"Ana Souza")
// em tons diferentes com 5 linhas e zero dependência.
let hash = 5381
for (let i = 0; i < limpo.length; i++) {
  hash = ((hash << 5) + hash + limpo.charCodeAt(i)) >>> 0
}
return TONS_AVATAR[hash % TONS_AVATAR.length]`}</Bloco>
        <Aviso>
          Os tons são os semânticos da paleta (<code>marca</code>, <code>sucesso</code>,{' '}
          <code>aviso</code>, <code>perigo</code>, <code>info</code>) usados como{' '}
          <strong>identidade, não como estado</strong> — e isso só é seguro por causa da regra da
          casa: aqui significado nunca anda só na cor. Um avatar no tom <code>perigo</code> não
          quer dizer que a pessoa tem um problema; quem diz "Falhou" é o texto de um{' '}
          <code>&lt;Selo&gt;</code> ao lado. Cada tom usa o par <code>-subtle</code> +{' '}
          <code>-text</code>, o mesmo já aprovado no teste de contraste dos tokens.
        </Aviso>
      </Secao>

      <Secao titulo="Quando a foto quebra">
        <Demo
          variante="plain"
          codigo={`<Avatar nome="Ana Souza" src="https://link-que-expirou/foto.jpg" />
// Link de Google/Gravatar/S3 expira; a tela cai nas iniciais e ninguém percebe.`}
        >
          {/* base64 VÁLIDO que decodifica para "hello" — não para um PNG. É a única das
              três formas de quebrar uma imagem que dispara o `onError` com o console
              limpo; medi as três. A URL de domínio reservado que estava aqui deixava um
              ERR_NAME_NOT_RESOLVED vermelho (numa documentação, isso lê como bug do
              site) e exigia rede; base64 inválido troca por ERR_INVALID_URL. Aqui a URL
              é bem-formada e o dado chega — só não é imagem, então quem reclama é o
              decodificador, em silêncio. Mesmo caminho de código, sem o ruído. */}
          <Avatar nome="Ana Souza" src="data:image/png;base64,aGVsbG8=" size="lg" />
          <Avatar nome="Bruno Lima" size="lg" />
        </Demo>
        <P>
          Link expirado de Google, Gravatar ou S3 é rotina em produção. Sem tratamento, a tela
          enche de ícone de imagem quebrada — <strong>pior que não ter foto nenhuma</strong>.
          Aqui o <code>onError</code> derruba a imagem e as iniciais assumem.
        </P>
        <H3>O detalhe que quase todo mundo erra</H3>
        <Bloco lang="jsx">{`// ❌ O jeito comum — e ele trava
const [erro, setErro] = useState(false)
// Depois da primeira falha, \`erro\` fica true para sempre. Trocar a foto do usuário
// não adianta: o avatar nunca mais tenta carregar. Precisa de um useEffect de reset.

// ✅ O jeito daqui: guarda QUAL src quebrou
const [srcQuebrado, setSrcQuebrado] = useState<string | null>(null)
const mostrarImagem = Boolean(src) && srcQuebrado !== src
// src novo ≠ src quebrado → volta a tentar sozinho. Sem efeito, sem sincronização.`}</Bloco>
        <P>
          O booleano é o bug: ele responde "alguma foto já falhou?", quando a pergunta é{' '}
          <strong>"esta foto falhou?"</strong>. Guardando a string, a resposta se corrige sozinha
          quando o <code>src</code> muda.
        </P>
        <P>
          O tom colorido <strong>só pinta as iniciais</strong>. Com foto o fundo fica cinza —
          senão o colorido apareceria nos cantos de uma imagem transparente e sujaria a foto.
        </P>
      </Secao>

      <Secao titulo="decorativo — o avatar que cala a boca">
        <Demo
          variante="plain"
          codigo={`// Numa tabela, o nome JÁ está escrito na célula ao lado:
<Avatar nome="Maria Silva" decorativo /> <span>Maria Silva</span>

// Sozinho (barra de topo, pilha de participantes): decorativo = false (o padrão)
<Avatar nome="Maria Silva" />`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar nome="Maria Silva" decorativo size="sm" />
            <span>Maria Silva</span>
          </div>
        </Demo>
        <P>
          Esta prop existe por causa de tabela.{' '}
          <strong>Sem ela, a pessoa ouve "Maria Silva, Maria Silva" em cada uma das 40 linhas</strong>{' '}
          — o avatar se anuncia e a célula ao lado repete. É o defeito mais comum de tabela com
          avatar, e ele não aparece em nenhum print.
        </P>
        <P>
          Com <code>decorativo</code>, o avatar some para o leitor de tela: <code>alt=""</code> na
          foto, nenhum texto oculto, nem o status. Se o avatar aparece{' '}
          <strong>sozinho</strong> — barra de topo, pilha de participantes — deixe{' '}
          <code>false</code>: ali ele é a única pista de quem é.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Ao lado do nome escrito → decorativo',
            texto: 'O nome é dito uma vez. A varredura por leitor de tela numa tabela de 40 linhas fica com metade do tamanho.',
          }}
          naoFaca={{
            titulo: 'alt="avatar" ou alt="foto do usuário"',
            texto: 'Obriga a pessoa a adivinhar de quem é. Ou o avatar diz o nome, ou some — não existe meio-termo útil.',
          }}
        />
        <Aviso>
          As iniciais são <strong>desenho</strong>, sempre <code>aria-hidden</code>: "MS" lido em
          voz alta ("ême-esse") não é o nome de ninguém. Quem fala é um texto oculto com o nome
          por extenso — que o <code>decorativo</code> remove.
        </Aviso>
      </Secao>

      <Secao titulo="Status">
        <Demo
          codigo={`<Avatar nome="Ana Souza" status="online" />
<Avatar nome="Bruno Lima" status="ausente" />
<Avatar nome="Carla Dias" status="offline" />`}
        >
          {(['online', 'ausente', 'offline'] as const).map((s, i) => (
            <Avatar key={s} nome={PESSOAS[i]!} status={s} size="lg" />
          ))}
        </Demo>
        <P>
          Os três estados diferem em <strong>forma</strong>, não só em cor: cheio, cheio com um
          furo no meio, e vazado. Em preto e branco — ou para quem não distingue verde de âmbar —
          ainda dá para separar os três. E cada um vem com{' '}
          <strong>texto para o leitor de tela</strong>: verde e âmbar são o mesmo ponto cinza para
          quem não distingue, e nada para quem ouve.
        </P>
        <P>
          A bolinha tem um anel da cor da superfície em volta. Sem ele, um ponto verde sobre uma
          camisa verde some na foto.
        </P>
      </Secao>

      <Secao titulo="GrupoAvatar">
        <Demo
          codigo={`<GrupoAvatar max={3}>
  <Avatar nome="Ana Souza" />
  <Avatar nome="Bruno Lima" />
  <Avatar nome="Carla Dias" />
  <Avatar nome="José da Silva" />
  <Avatar nome="Márcia Ávila Rocha" />
</GrupoAvatar>`}
        >
          <GrupoAvatar max={3}>
            {PESSOAS.map(n => (
              <Avatar key={n} nome={n} />
            ))}
          </GrupoAvatar>
          <GrupoAvatar max={3} size="sm">
            {PESSOAS.map(n => (
              <Avatar key={n} nome={n} size="sm" />
            ))}
          </GrupoAvatar>
        </Demo>
        <P>
          <code>max</code> corta a pilha e resume o resto num "+N". Quatro ou cinco é o teto útil:
          a partir daí a pilha vira uma mancha e o "+N" informa mais que os rostos. Sem{' '}
          <code>max</code>, aparecem todos.
        </P>
        <P>
          O <code>size</code> do grupo <strong>precisa bater com o dos avatares</strong> — é ele
          que dimensiona o "+N". A sobreposição sai de <code>--amb-avatar-tam</code> (30% do
          avatar), então <code>xs</code> e <code>lg</code> empilham igual de bonito sem ninguém
          recalcular margem à mão.
        </P>
        <P>
          O "+3" tem texto oculto por extenso: <strong>"mais 3 pessoas"</strong>. "+3" sozinho
          vira "mais três" ou "sinal de mais três" dependendo do leitor — e nenhum dos dois diz o
          que é. Um <code>{'{podeVer && <Avatar/>}'}</code> falso não conta como pessoa, senão o
          "+N" mentiria.
        </P>
        <Aviso>
          O grupo <strong>não</strong> tem <code>role="group"</code>: um grupo sem nome só
          acrescenta a palavra "grupo" ao que o leitor de tela já ia ler. Os avatares se anunciam
          sozinhos. Quem quiser um nome para a pilha põe <code>aria-label</code> de fora — e aí
          sim vira um grupo de verdade.
        </Aviso>
      </Secao>

      <Secao titulo="Props">
        <H3>Avatar</H3>
        <TabelaProps
          props={[
            { nome: 'nome', tipo: 'string', descricao: <><strong>Obrigatório.</strong> Vira as iniciais, a cor e o rótulo acessível.</> },
            { nome: 'src', tipo: 'string', descricao: 'Foto. Se faltar — ou se o link quebrar — cai nas iniciais sozinho.' },
            { nome: 'size', tipo: "'xs' | 'sm' | 'md' | 'lg'", padrao: "'md'", descricao: '24, 32, 40 ou 56px.' },
            { nome: 'formato', tipo: "'circulo' | 'quadrado'", padrao: "'circulo'", descricao: 'Quadrado tem raio médio: canto vivo em foto de gente fica agressivo.' },
            { nome: 'status', tipo: "'online' | 'ausente' | 'offline'", descricao: 'Forma + cor + texto. A bolinha nunca é o único sinal.' },
            { nome: 'decorativo', tipo: 'boolean', padrao: 'false', descricao: 'Some para o leitor de tela. Ligue quando o nome já está escrito ao lado.' },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLSpanElement>', descricao: <>É um <code>&lt;span&gt;</code>. Aceita <code>title</code>, <code>onClick</code>, <code>ref</code>.</> },
          ]}
        />

        <H3>GrupoAvatar</H3>
        <TabelaProps
          props={[
            { nome: 'children', tipo: 'ReactNode', descricao: <>Os <code>&lt;Avatar&gt;</code>.</> },
            { nome: 'max', tipo: 'number', descricao: 'Quantos aparecem antes do "+N". Sem valor, aparecem todos.' },
            { nome: 'size', tipo: "'xs' | 'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Precisa bater com o size dos avatares — é ele que dimensiona o "+N".' },
            { nome: '…rest', tipo: 'HTMLAttributes<HTMLSpanElement>', descricao: <>Ponha <code>aria-label</code> aqui se a pilha precisar de um nome.</> },
          ]}
        />

        <H3>As duas funções exportadas</H3>
        <TabelaProps
          props={[
            { nome: 'iniciaisDoNome', tipo: '(nome: string) => string', descricao: 'A regra primeira+última, sozinha. Útil para gerar avatar no servidor ou num canvas.' },
            { nome: 'tomDoNome', tipo: '(nome: string) => AvatarTom', descricao: 'O sorteio determinístico. Use quando precisar da mesma cor fora do avatar.' },
          ]}
        />
      </Secao>
    </>
  )
}
