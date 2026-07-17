import { construirTema, contraste, paleta, MARCAS, WCAG, type Marca } from '@amboni/tokens'
import { Secao, P, Demo, Titulo, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'

const MODOS = ['light', 'dark'] as const
const r = (fg: string, bg: string) => contraste(fg, bg)

/** Amostra do botão primário de uma marca × modo, com o contraste medido na hora. */
function AmostraMarca({ marca, modo }: { marca: Marca; modo: 'light' | 'dark' }) {
  const t = construirTema(marca, modo)
  const razao = r(t.color.text.onBrand, t.color.brand.solid)
  return (
    <tr>
      <td><code className="doc-mono-brand">{marca}</code> / {modo === 'light' ? 'claro' : 'escuro'}</td>
      <td>
        <span
          style={{
            background: t.color.brand.solid, color: t.color.text.onBrand,
            padding: '6px 14px', borderRadius: 8, fontWeight: 700, display: 'inline-block',
          }}
        >
          Salvar
        </span>
      </td>
      <td><code>{t.color.brand.solid}</code></td>
      <td className="doc-num">{razao.toFixed(2)}:1</td>
      <td>
        <span className={`doc-pill ${razao >= WCAG.AA_TEXTO ? 'doc-pill--ok' : 'doc-pill--bad'}`}>
          {razao >= WCAG.AA_TEXTO ? 'PASSA' : 'REPROVA'}
        </span>
      </td>
    </tr>
  )
}

export default function GuiaTemaPage() {
  const marcas = Object.keys(MARCAS) as Marca[]

  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="Uma marca nova é uma linha. O que segura a linha em pé são 102 testes que reprovam o build se a cor for ilegível."
      >
        Marca e tema
      </Titulo>

      <Secao titulo="O caminho de uma cor até a tela">
        <P>
          Três camadas. A página de <strong>Cores</strong> explica por que elas existem; aqui
          interessa <em>como você mexe nelas</em>.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Camada</th><th>Arquivo</th><th>Você mexe quando…</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Primitiva</strong></td>
                <td><code>tokens/src/primitives.ts</code></td>
                <td>Entra uma marca nova (uma escala de 11 degraus).</td>
              </tr>
              <tr>
                <td><strong>Semântica</strong></td>
                <td><code>tokens/src/semantic.ts</code></td>
                <td>
                  Muda o <em>papel</em> de uma cor — raro, e afeta os dois produtos de uma vez.
                </td>
              </tr>
              <tr>
                <td><strong>Tema (CSS)</strong></td>
                <td><code>tokens/tokens.css</code></td>
                <td>
                  <strong>Nunca.</strong> É gerado. Editar à mão some no próximo build.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Bloco lang="jsx">{`import { construirTema } from '@amboni/tokens'

const t = construirTema('isafe', 'light')

t.color.brand.solid      // '#106b81'  — fundo de botão primário
t.color.text.onBrand     // '#ffffff'  — o texto que vai POR CIMA dele
t.color.text.primary     // '#0f172a'
t.color.danger.text      // '#b91c1c'
t.shadow.md              // '0 2px 8px -1px …'`}</Bloco>
        <P>
          <code>construirTema</code> é uma função pura: marca + modo entram, um objeto de hex
          sai. É ela que o <code>build-css.ts</code> chama para gerar as{' '}
          <code>--amb-*</code>, e é a mesma que você chama para alimentar o{' '}
          <code>createTheme</code> do MUI. <strong>Uma fonte, dois consumidores</strong> — é isso
          que impede o iSafe e a biblioteca de divergirem.
        </P>
      </Secao>

      <Secao titulo="Adicionar uma marca é uma linha">
        <P>Literalmente. Digamos que entre um cliente novo, de laranja:</P>
        <Bloco lang="jsx">{`// 1. primitives.ts — a escala. Ancore o degrau no hex que o cliente JÁ usa.
export const orange: Escala = {
  50: '#fff7ed',  100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
  400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
  800: '#9a3412', 900: '#7c2d12', 950: '#431407',
}

// 2. semantic.ts — a linha.
export const MARCAS = { isafe: cyan, vear: purple, acme: orange } as const`}</Bloco>
        <P>
          Acabou. O <code>npm run build -w @amboni/tokens</code> gera{' '}
          <code>[data-amb-brand="acme"][data-amb-theme="light"]</code> e{' '}
          <code>dark</code> sozinho — hoje são{' '}
          <strong>{marcas.length} marcas × 2 modos</strong>, e viram {marcas.length + 1} × 2 sem
          mais nada. Nenhum componente muda. Nenhum CSS é escrito.
        </P>
        <Aviso>
          <strong>Ancore no hex que o cliente já tem.</strong> O <code>#5C2684</code> do VEAR é o{' '}
          <code>purple[700]</code>; o <code>#0FA6BE</code> do iSafe é o <code>cyan[500]</code>.
          Não é detalhe: o degrau escolhido decide se a migração muda a cor da tela. No VEAR,{' '}
          <code>brand.solid</code> no claro <em>é</em> o 700 — a tela não muda um pixel. No
          iSafe, é o 700 e a marca é o 500 — a tela muda, de propósito (ver abaixo).
        </Aviso>
      </Secao>

      <Secao titulo="A regra que quase ninguém aplica">
        <P>
          No escuro, a cor da marca <strong>não</strong> é a do claro. Fundo escuro pede cor
          mais <em>clara</em>, não mais forte. É o erro mais comum de tema escuro amador — e
          o motivo de tanto app escuro ter botão que vibra.
        </P>
        <Bloco lang="jsx">{`const marca = (e: Escala, claro: boolean) =>
  claro
    ? { solid: e[700], solidHover: e[800], subtle: e[50], text: e[700] }
    : { solid: e[400], solidHover: e[300], subtle: '…16%', text: e[300] }`}</Bloco>
        <P>
          Três coisas invertem juntas, e é por isso que isto mora numa função em vez de num{' '}
          <code>if</code> espalhado:
        </P>
        <P>
          <strong>1. O nível.</strong> 700 no claro, 400 no escuro.{' '}
          <strong>2. O hover.</strong> No claro escurece (800); no escuro{' '}
          <em>clareia</em> (300) — hover é "mais perto de você", e no escuro isso é mais claro.{' '}
          <strong>3. O texto por cima.</strong> <code>text.onBrand</code> é branco no claro e{' '}
          <code>slate[950]</code> no escuro. Sem isso, o botão primário do escuro fica branco
          sobre ciano claro: ilegível.
        </P>
        <P>Os quatro botões primários do sistema hoje, medidos agora:</P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Marca / modo</th><th>Botão</th><th><code>brand.solid</code></th>
                <th className="doc-num">Contraste</th><th>AA</th>
              </tr>
            </thead>
            <tbody>
              {marcas.flatMap(m => MODOS.map(modo => (
                <AmostraMarca key={`${m}-${modo}`} marca={m} modo={modo} />
              )))}
            </tbody>
          </table>
        </div>
        <FacaNaoFaca
          faca={{
            titulo: 'O papel é o mesmo; o valor não',
            texto: 'brand.solid quer dizer "fundo da ação principal" nos dois temas. Que hex isso vira é problema do construirTema — nenhum componente pergunta.',
          }}
          naoFaca={{
            titulo: 'A mesma cor nos dois temas',
            texto: 'Sempre falha em um dos dois — normalmente no que você não abriu para conferir. E quem descobre é o usuário com o SO no modo contrário do seu.',
          }}
        />
      </Secao>

      <Secao titulo="Trocar de tema em tempo de execução">
        <P>Um atributo. Sem provider, sem re-render, sem contexto:</P>
        <Bloco lang="jsx">{`document.documentElement.setAttribute('data-amb-theme', 'dark')
document.documentElement.setAttribute('data-amb-brand', 'vear')`}</Bloco>
        <P>
          As variáveis cascateiam sozinhas e o navegador repinta. <strong>O React não fica
          sabendo, e é essa a graça</strong>: não há estado para sincronizar, nada re-renderiza,
          e nenhum componente precisa ler contexto para saber a cor. É trabalho que o navegador
          já faz de graça há anos.
        </P>
        <P>Persistir a escolha é o de sempre, e é tudo que você precisa escrever:</P>
        <Bloco lang="jsx">{`function aplicarTema(modo: 'light' | 'dark') {
  document.documentElement.setAttribute('data-amb-theme', modo)
  localStorage.setItem('tema', modo)
}

// Na inicialização — antes do React montar, para não piscar branco.
const salvo = localStorage.getItem('tema')
const doSistema = window.matchMedia('(prefers-color-scheme: dark)').matches
aplicarTema((salvo as 'light' | 'dark') ?? (doSistema ? 'dark' : 'light'))`}</Bloco>
        <Aviso tipo="warn">
          <strong>Os tokens não leem <code>prefers-color-scheme</code> sozinhos.</strong> Não há
          media query nenhuma no <code>tokens.css</code> — só{' '}
          <code>[data-amb-brand][data-amb-theme]</code>. Isso é decisão, não esquecimento: se o
          CSS reagisse ao sistema por conta própria, a pessoa não conseguiria escolher o
          contrário dentro do app. Quem lê a preferência é o seu JS, uma vez, como acima.
        </Aviso>
        <P>
          Sem nenhum atributo, o <code>:root</code> já traz{' '}
          <strong>iSafe claro</strong> como padrão — a biblioteca funciona antes de você
          configurar. Não confie nisso em produção: declare os dois no{' '}
          <code>&lt;html&gt;</code> e deixe explícito para quem for ler.
        </P>
      </Secao>

      <Secao titulo="O contrato de acessibilidade">
        <P>
          Esta é a parte que faz a biblioteca ser diferente de uma pasta de cores bonitas.{' '}
          <strong>Os testes rodam contra todas as marcas, em todos os modos, automaticamente.</strong>
        </P>
        <Bloco lang="jsx">{`// tokens.test.ts — o contrato
describe.each(MARCAS_NOMES)('tema %s', marca => {
  describe.each(MODOS)('modo %s', modo => {
    const t = construirTema(marca, modo)

    test('texto sobre a marca cheia passa em AA (o botão precisa ser legível)', () => {
      const r = relatorio(t.color.text.onBrand, t.color.brand.solid)
      expect(r.passa, \`onBrand sobre brand.solid: \${r.razao}:1\`).toBe(true)
    })
    // … e mais uma dezena de pares
  })
})`}</Bloco>
        <P>
          Repare no <code>describe.each(MARCAS_NOMES)</code>. Você não escreve teste para a marca
          nova: <strong>ela entra na suíte no instante em que entra no{' '}
          <code>MARCAS</code></strong>. Adicionou o laranja? Os testes de contraste já estão
          rodando contra ele, nos dois modos, e o <code>npm test</code> reprova antes de a cor
          chegar em qualquer produto.
        </P>
        <H3>O que é verificado, em cada marca × modo</H3>
        <P>
          Texto primário, secundário e <code>muted</code> sobre card <em>e</em> sobre o fundo da
          página. Texto sobre a marca cheia. Texto da marca sobre card. O anel de foco (mínimo
          de 3:1, é não-texto). Os quatro estados. E a hierarquia:{' '}
          <code>primary</code> &gt; <code>secondary</code> &gt; <code>muted</code> em contraste
          — três cinzas que passam mas rendem igual não são hierarquia, são três cinzas.
        </P>

        <H3>Por que isso existe: o #0FA6BE</H3>
        <P>
          O ciano da marca iSafe é o <code>#0FA6BE</code>. Ele era o fundo do botão primário do
          CRM, com texto branco. Isso dá{' '}
          <strong>{r('#ffffff', '#0FA6BE').toFixed(2)}:1</strong>. A norma pede{' '}
          {WCAG.AA_TEXTO}:1.
        </P>
        <Demo variante="centro">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#0FA6BE', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700 }}>
                Salvar
              </div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                #0FA6BE — {r('#ffffff', '#0FA6BE').toFixed(2)}:1
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: paleta.cyan[700], color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700 }}>
                Salvar
              </div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                cyan[700] — {r('#ffffff', paleta.cyan[700]).toFixed(2)}:1
              </div>
            </div>
          </div>
        </Demo>
        <P>
          Ele ficou assim <strong>em produção, por meses</strong>. Ninguém abriu chamado. Não
          porque estava bom — porque quem escolhe a cor da marca costuma ter a melhor visão da
          sala, um monitor bom e a tela a 40 cm do rosto. Para quem tem baixa visão, aquele
          botão era um retângulo com um borrão dentro.
        </P>
        <P>
          A correção não foi trocar a marca. O <code>#0FA6BE</code> continua sendo{' '}
          <code>cyan[500]</code> e continua vivo em <code>brand.subtle</code>, em ícone, em
          barra de gráfico — onde é decoração e não precisa de 4,5:1. O que mudou foi só o
          papel de <em>fundo de texto</em>, que virou <code>cyan[700]</code>:{' '}
          <strong>{r('#ffffff', paleta.cyan[700]).toFixed(2)}:1</strong>.
        </P>
        <Aviso tipo="warn">
          <strong>Um teste que só reprova o que você lembrou de testar não é um contrato.</strong>{' '}
          O botão de perigo do sistema já foi <code>danger.solid</code> com{' '}
          <code>#fff</code> cravado no CSS — {r('#ffffff', construirTema('isafe', 'light').color.danger.solid).toFixed(2)}:1,
          reprovado, e passou meses. Passou porque o <code>#fff</code> cravado{' '}
          <em>furava os tokens</em>: sem variável, nenhum teste alcançava. Hoje existe um teste
          que trava justamente esse par. Cor cravada não é só feia — é cor que nenhum contrato
          consegue proteger.
        </Aviso>
      </Secao>

      <Secao titulo="Sobrescrever um token no produto">
        <P>
          Dá para redefinir qualquer <code>--amb-*</code> depois do import. O escopo é o
          seletor, então dá para atingir a página inteira ou só um pedaço:
        </P>
        <Bloco lang="css">{`/* Um pedaço da tela, com motivo. */
.painel-relatorio {
  --amb-color-surface: var(--amb-color-surfaceSunken);
}`}</Bloco>
        <P>
          <strong>Quando NÃO fazer isso</strong> — e é quase sempre:
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Sobrescrever escopado, por um motivo escrito',
            texto: 'Um painel que precisa de fundo afundado. Fica numa classe, com comentário, e some quando o motivo sumir.',
          }}
          naoFaca={{
            titulo: ':root { --amb-color-brand-solid: #0FA6BE }',
            texto: 'É desfazer a correção de contraste em silêncio, na frente de todos os testes que existem exatamente para impedir isso. O token passou no CI; a sua sobrescrita, não.',
          }}
        />
        <P>
          O ponto é este: <strong>os testes protegem os tokens, não o seu CSS.</strong>{' '}
          <code>construirTema</code> é verificado; um <code>--amb-color-brand-solid</code>{' '}
          redefinido na sua folha de estilo não é verificado por nada. Ao sobrescrever, você sai
          da rede de proteção — e é por isso que sobrescrever cor de marca ou de texto quase
          nunca é a resposta certa.
        </P>
        <P>
          Se a cor que você quer não existe, é um dos dois: ou o papel que você precisa não está
          na camada semântica (aí falta um token — vale a discussão), ou você está pintando
          decoração com token de texto (aí o erro é outro). Antes de sobrescrever, veja qual dos
          dois é.
        </P>
        <Aviso>
          Espaço, raio e fonte são outra história: <code>--amb-espaco-*</code> e{' '}
          <code>--amb-raio-*</code> não têm teste de contraste, e ajustá-los localmente é bem
          menos perigoso. O cuidado desta seção é sobre <strong>cor</strong>.
        </Aviso>
      </Secao>
    </>
  )
}
