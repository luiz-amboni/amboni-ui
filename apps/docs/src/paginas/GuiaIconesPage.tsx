import { Button, Selo, Alerta, EstadoVazio, StatCard, Etiqueta } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'

/**
 * Os ícones desta página são SVG inline, como os da biblioteca — a página do guia de
 * ícones não seria o lugar para provar que a gente precisa de um pacote de ícones.
 */
function Mais() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
function Seta() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function X() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
      <path d="M4 4 12 12M12 4 4 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
function Caixote() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" aria-hidden="true">
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 7.5 12 12m0 0 9-4.5M12 12v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function GuiaIconesPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="A biblioteca não traz ícone nenhum. Isso é decisão, não pendência."
      >
        Ícones
      </Titulo>

      <Secao titulo="Por que não temos um pacote de ícones">
        <P>
          Um design system que exporta ícones obriga <strong>todo</strong> mundo que instala a
          carregar o pacote inteiro — inclusive quem já tem outro. E aí o projeto fica com dois:
          o seu e o nosso, com dois desenhos de "fechar" ligeiramente diferentes na mesma tela.
        </P>
        <P>
          A dependência de <code>@amboni/ui</code> hoje é: <code>@amboni/tokens</code>. Só. Sem
          pacote de ícone, sem runtime de estilo, sem utilitário de classe. O JS inteiro dá{' '}
          <strong>21,4 kB gzip</strong> — e continua dando, independentemente de qual pacote de
          ícones você escolher.
        </P>
        <P>
          A prova de que dá para viver assim está dentro da biblioteca: onde ela{' '}
          <em>precisa</em> de um ícone, ela desenha. O <code>StatCard</code> tem uma seta de
          três estados em nove linhas:
        </P>
        <Bloco lang="jsx">{`/** Seta desenhada aqui: a biblioteca não impõe pacote de ícones a quem instala. */
function Seta({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  const d = dir === 'up' ? 'M7 3.5 L11 8 H8.5 V11 H5.5 V8 H3 Z'
    : dir === 'down' ? 'M7 10.5 L3 6 H5.5 V3 H8.5 V6 H11 Z'
    : 'M3 6.25 H11 V7.75 H3 Z'
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
}`}</Bloco>
        <P>
          O <code>Alerta</code> faz o mesmo com quatro. O <code>Etiqueta</code> desenha o próprio
          X. Nenhum deles custa uma dependência a quem instala.
        </P>
        <Aviso>
          <strong>Escolher é com você — e os dois produtos já escolheram diferente.</strong> O
          iSafe usa <code>lucide-react</code> em 33 arquivos. O VEAR não usa pacote nenhum: tem
          5 SVGs inline, em 3 arquivos, e vive bem. Se a biblioteca tivesse imposto um, um dos
          dois estaria carregando ícone à toa.
        </Aviso>
      </Secao>

      <Secao titulo="Onde os ícones entram">
        <P>
          Sempre por prop, sempre <code>ReactNode</code>. Serve qualquer coisa que renderize:
          componente do lucide, do react-icons, um <code>&lt;svg&gt;</code> seu, até um emoji.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Componente</th><th>Prop</th><th>Observação</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Button</code></td>
                <td><code className="doc-mono-brand">iconLeft</code>, <code className="doc-mono-brand">iconRight</code></td>
                <td>Sem texto, o botão vira quadrado sozinho. Não existe prop <code>icon</code>.</td>
              </tr>
              <tr>
                <td><code>Selo</code></td>
                <td>—</td>
                <td>
                  <strong>Não aceita ícone.</strong> Tem <code>pontinho</code>, que é bolinha,
                  não desenho. Selo é estado: o texto basta.
                </td>
              </tr>
              <tr>
                <td><code>Etiqueta</code></td>
                <td><code className="doc-mono-brand">icone</code></td>
                <td>Antes do texto. O X de remover já vem desenhado.</td>
              </tr>
              <tr>
                <td><code>Alerta</code></td>
                <td><code className="doc-mono-brand">icone</code></td>
                <td>
                  Já tem um por tom. Trocar é possível — e quase sempre errado (ver abaixo).
                </td>
              </tr>
              <tr>
                <td><code>EstadoVazio</code></td>
                <td><code className="doc-mono-brand">icone</code></td>
                <td>Grande, decorativo. Quem informa é o <code>titulo</code>.</td>
              </tr>
              <tr>
                <td><code>StatCard</code></td>
                <td><code className="doc-mono-brand">icon</code></td>
                <td>Pintado pelo <code>tone</code>. A seta do <code>delta</code> é interna.</td>
              </tr>
              <tr>
                <td><code>Campo</code></td>
                <td><code className="doc-mono-brand">iconeEsq</code>, <code className="doc-mono-brand">iconeDir</code></td>
                <td>
                  Para texto ("R$", "kg") use <code>prefixo</code>/<code>sufixo</code> — não
                  ícone.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Demo
          codigo={`import { Plus, ArrowRight, X } from 'lucide-react'

<Button variant="primary" iconLeft={<Plus size={16} />}>Nova campanha</Button>
<Button iconRight={<ArrowRight size={16} />}>Avançar</Button>
<Button variant="ghost" iconLeft={<X size={16} />} aria-label="Fechar" />`}
        >
          <Button variant="primary" iconLeft={<Mais />}>Nova campanha</Button>
          <Button iconRight={<Seta />}>Avançar</Button>
          <Button variant="ghost" iconLeft={<X />} aria-label="Fechar" />
        </Demo>
      </Secao>

      <Secao titulo="Com lucide-react (o que o iSafe usa)">
        <Bloco lang="jsx">{`import { Plus, Trash2, Send } from 'lucide-react'

<Button variant="primary" iconLeft={<Plus size={16} />}>Nova campanha</Button>
<Button variant="danger" iconLeft={<Trash2 size={16} />}>Excluir cliente</Button>

// Só ícone — aria-label OBRIGATÓRIO
<Button variant="ghost" iconLeft={<Send size={16} />} aria-label="Reenviar mensagem" />`}</Bloco>
        <P>
          O lucide já vem com <code>aria-hidden="true"</code> nos SVGs dele, e a gente envolve o
          ícone em outro <code>aria-hidden</code> de qualquer jeito. Não tem como vazar para o
          leitor de tela por acidente.
        </P>

        <H3>Com react-icons</H3>
        <Bloco lang="jsx">{`import { FiPlus } from 'react-icons/fi'

<Button iconLeft={<FiPlus />}>Nova campanha</Button>`}</Bloco>
        <P>
          O <code>react-icons</code> dimensiona por <code>1em</code> por padrão, então ele já
          acompanha a fonte do botão sem você passar tamanho.
        </P>

        <H3>Com SVG próprio (o que o VEAR faz)</H3>
        <Bloco lang="jsx">{`function Mais() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

<Button iconLeft={<Mais />}>Nova campanha</Button>`}</Bloco>
        <P>
          Duas coisas fazem esse SVG se comportar: <code>currentColor</code> e{' '}
          <code>1em</code>. A próxima seção é sobre elas.
        </P>
      </Secao>

      <Secao titulo="Tamanho: 1em resolve sozinho">
        <P>
          <code>width="1em"</code> faz o ícone acompanhar a fonte do texto ao lado. O botão{' '}
          <code>sm</code> tem fonte menor que o <code>lg</code>; com <code>1em</code>, o ícone
          encolhe junto — sem você passar <code>size</code> por tamanho de botão.
        </P>
        <Demo
          codigo={`// O mesmo componente de ícone nos três. Nenhum size passado.
<Button size="sm" iconLeft={<Mais />}>Pequeno</Button>
<Button size="md" iconLeft={<Mais />}>Médio</Button>
<Button size="lg" iconLeft={<Mais />}>Grande</Button>`}
        >
          <Button size="sm" iconLeft={<Mais />}>Pequeno</Button>
          <Button size="md" iconLeft={<Mais />}>Médio</Button>
          <Button size="lg" iconLeft={<Mais />}>Grande</Button>
        </Demo>
        <P>
          E <code>stroke="currentColor"</code> (ou <code>fill="currentColor"</code>) faz o ícone
          herdar a cor do texto — inclusive no hover, no <code>danger</code>, e no tema escuro.
          Um ícone com a cor cravada é um ícone que fica errado no primeiro tema novo.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'currentColor + 1em',
            texto: 'O ícone acompanha cor e tamanho do contexto sozinho. Funciona em todo botão, todo tom, todo tema — sem uma linha a mais.',
          }}
          naoFaca={{
            titulo: 'stroke="#0FA6BE" width="16"',
            texto: 'Fica azul dentro do botão vermelho de excluir, e do tamanho errado no botão grande. É o mesmo problema das 313 cores cravadas do VEAR, agora em SVG.',
          }}
        />
        <Aviso>
          Com <code>lucide-react</code>, o padrão é <code>size={'{24}'}</code> em pixel, não{' '}
          <code>1em</code> — por isso os exemplos passam <code>size={'{16}'}</code>. Se quiser o
          comportamento elástico, passe <code>size="1em"</code>.
        </Aviso>
      </Secao>

      <Secao titulo="Ícone é decoração. Quem informa é o texto">
        <P>
          Esta é a regra que atravessa a biblioteca inteira. Todo ícone que a gente renderiza sai
          embrulhado em <code>aria-hidden="true"</code> — no <code>Button</code>, no{' '}
          <code>Alerta</code>, no <code>StatCard</code>, na <code>Etiqueta</code>.
        </P>
        <P>
          Não é descuido: é que o ícone <strong>repete</strong> o que o texto já diz. Um leitor
          de tela anunciando "imagem: mais — botão — Nova campanha" não informa mais que "botão
          — Nova campanha". Informa pior.
        </P>
        <P>
          A exceção é quando <strong>não há</strong> texto — e aí o ícone não é mais decoração,
          é o único conteúdo:
        </P>
        <Bloco lang="jsx">{`// ✅ o rótulo acessível existe, mesmo sem texto visível
<Button variant="ghost" iconLeft={<X />} aria-label="Fechar" />

// ❌ o leitor de tela anuncia: "botão". Só isso.
<Button variant="ghost" iconLeft={<X />} />`}</Bloco>
        <P>
          O segundo caso <strong>avisa no console em desenvolvimento</strong>. A biblioteca
          detecta o botão sem filho de texto e reclama:
        </P>
        <Bloco lang="jsx">{`if (process.env.NODE_ENV !== 'production' && somenteIcone && !rest['aria-label']) {
  console.warn(
    '[@amboni/ui] <Button> só com ícone precisa de aria-label. ' +
      'Sem ele, quem usa leitor de tela ouve apenas "botão".',
  )
}`}</Bloco>
        <P>
          É o erro de acessibilidade mais comum em painel — a barra de ações de uma tabela com
          seis botõezinhos mudos. O aviso some no build de produção.
        </P>
        <Aviso tipo="warn">
          <strong>Diga o que o botão FAZ, não o que ele desenha.</strong>{' '}
          <code>aria-label="X"</code> ou <code>aria-label="Ícone de lixeira"</code> não ajudam
          ninguém. <code>aria-label="Excluir cliente"</code> ajuda. E numa lista com 8 linhas,{' '}
          <code>aria-label="Excluir João da Silva"</code> é a diferença entre uma lista navegável
          e um labirinto de "excluir, excluir, excluir".
        </Aviso>
      </Secao>

      <Secao titulo="A cor nunca é o único sinal">
        <P>
          Cerca de <strong>1 em cada 12 homens</strong> não distingue vermelho de verde. Para
          essas pessoas, um alerta verde de "deu certo" e um vermelho de "falhou" pintados só
          de cor são <strong>o mesmo alerta cinza</strong>. O mesmo vale para quem imprime em
          preto e branco, ou lê no sol.
        </P>
        <P>
          Por isso os quatro tons do <code>Alerta</code> têm <strong>quatro formas
          diferentes</strong>, não quatro cores da mesma forma:
        </P>
        <Demo variante="plain">
          <div style={{ display: 'grid', gap: 12, width: '100%' }}>
            <Alerta tom="info" titulo="Círculo com i — contexto, nada a fazer" />
            <Alerta tom="sucesso" titulo="Círculo com check — deu certo" />
            <Alerta tom="aviso" titulo="Triângulo — atenção, tem ressalva" />
            <Alerta tom="perigo" titulo="Octógono — pare, falhou" />
          </div>
        </Demo>
        <P>
          Triângulo e octógono não são escolha estética: são as formas que a sinalização de
          trânsito do mundo inteiro já ensinou a ler como "atenção" e "pare".{' '}
          <strong>A forma é o que sobra quando a cor não chega.</strong>
        </P>
        <P>
          Isso não é convenção — é testado. O teste renderiza os quatro tons, extrai o desenho
          de cada um e exige que sejam quatro desenhos <em>diferentes</em>:
        </P>
        <Bloco lang="jsx">{`// Alerta.test.tsx
test('cada tom tem um ÍCONE de forma diferente, não só uma cor diferente', () => {
  const desenhos = TONS.map(tom => {
    const { container, unmount } = render(<Alerta tom={tom} titulo="x" />)
    const svg = container.querySelector('.amb-alerta__icone svg')?.innerHTML ?? ''
    unmount()
    return svg
  })

  expect(desenhos.every(d => d.length > 0)).toBe(true)
  expect(new Set(desenhos).size).toBe(TONS.length)   // ← quatro desenhos únicos
})`}</Bloco>
        <P>
          Se alguém unificar os ícones num só desenho colorido "para ficar mais limpo", quebra
          aqui — antes de virar produção.
        </P>
        <P>
          É também por isso que o <code>Alerta</code> aceita <code>icone</code> mas o JSDoc pede
          para pensar duas vezes: trocar os quatro por variações do mesmo desenho devolve o
          alerta à dependência de vermelho-verde, e nenhum teste alcança a sua escolha.
        </P>
        <P>
          A mesma regra explica duas decisões que parecem chatas em outros componentes:
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead><tr><th>Regra</th><th>Onde</th><th>Por quê</th></tr></thead>
            <tbody>
              <tr>
                <td><code>children</code> obrigatório</td>
                <td><code>Selo</code>, <code>Etiqueta</code></td>
                <td>
                  Um selo sem texto é uma bolinha colorida que parte das pessoas não lê. Nem
                  compila — e se vier <code>false</code> em tempo de execução, avisa no console.
                </td>
              </tr>
              <tr>
                <td><code>pontinho</code> é <code>aria-hidden</code></td>
                <td><code>Selo</code></td>
                <td>É enfeite para o olho achar a linha na tabela. Não diz o que aconteceu.</td>
              </tr>
              <tr>
                <td>Delta mostra seta <em>e</em> texto</td>
                <td><code>StatCard</code></td>
                <td>Verde/vermelho seria o único sinal. A seta e o "46%" também dizem.</td>
              </tr>
              <tr>
                <td><code>danger</code> exige rótulo</td>
                <td><code>Button</code></td>
                <td>"Excluir" carrega o aviso. O vermelho só reforça.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Demo
          codigo={`// A cor reforça; o texto informa. Nesta ordem.
<Selo tom="sucesso" pontinho>Entregue</Selo>
<Selo tom="perigo" variante="solido">Falhou</Selo>
<Etiqueta tom="marca" removivel onRemover={limpar}>Filtro: iPhone</Etiqueta>`}
        >
          <Selo tom="sucesso" pontinho>Entregue</Selo>
          <Selo tom="perigo" variante="solido">Falhou</Selo>
          <Etiqueta tom="marca" removivel onRemover={() => {}}>Filtro: iPhone</Etiqueta>
        </Demo>
      </Secao>

      <Secao titulo="Ícone grande: EstadoVazio e StatCard">
        <P>
          Nos dois, o ícone é <code>aria-hidden</code> e existe para dar peso visual — quem
          informa é o <code>titulo</code> e o <code>label</code>. Aqui o <code>1em</code> não
          serve: são ícones de 24–32px, com tamanho próprio.
        </P>
        <Demo variante="plain">
          <div style={{ width: '100%' }}>
            <EstadoVazio
              icone={<Caixote />}
              titulo="Nenhum cliente com esse filtro"
              descricao="Tente uma categoria diferente ou limpe os filtros."
              acao={<Button variant="primary">Limpar filtros</Button>}
            />
          </div>
        </Demo>
        <Bloco lang="jsx">{`<EstadoVazio
  icone={<Package size={32} />}
  titulo="Nenhum cliente com esse filtro"
  descricao="Tente uma categoria diferente ou limpe os filtros."
  acao={<Button variant="primary" onClick={limpar}>Limpar filtros</Button>}
/>`}</Bloco>
        <P>
          Repare no título: <strong>não</strong> é "Nenhum resultado". Isso a pessoa já viu
          sozinha, olhando a tela em branco. O ícone não conserta um título que não diz nada.
        </P>
        <Demo variante="grid">
          <StatCard
            label="Investido no período"
            value="R$ 1.994,31"
            icon={<Caixote />}
            sub="159.111 exibições"
          />
          <StatCard
            label="Custo por pessoa"
            value="R$ 14,25"
            tone="warning"
            delta={{ percent: 46, betterWhenUp: false }}
            sub="quanto menor, melhor"
          />
        </Demo>
        <P>
          No <code>StatCard</code>, o <code>icon</code> é pintado pelo <code>tone</code> — então
          use <code>currentColor</code> e deixe o componente decidir a cor.
        </P>
      </Secao>

      <Secao titulo="Resumo">
        <P>
          <strong>Escolha seu pacote</strong> (ou não escolha nenhum — o VEAR não escolheu).{' '}
          <strong>Passe por prop</strong>, sempre <code>ReactNode</code>.{' '}
          <strong>Use <code>currentColor</code> e <code>1em</code></strong> e o ícone se vira
          sozinho em cor e tamanho. <strong>Deixe o texto informar</strong> — o ícone é o
          reforço, nunca a mensagem. E se não houver texto, o <code>aria-label</code> não é
          opcional: o console vai lembrar você disso antes que o usuário lembre.
        </P>
      </Secao>
    </>
  )
}
