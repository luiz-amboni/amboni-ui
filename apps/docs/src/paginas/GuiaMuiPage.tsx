import { contraste } from '@amboni/tokens'
import { Button, Selo, Etiqueta, CampoForm, Campo } from '@amboni/ui'
import { Secao, P, Demo, Titulo, H3, Aviso, Bloco, FacaNaoFaca } from '../lib/blocos'

/**
 * Os contrastes desta página são calculados na hora, com a mesma função que roda no CI —
 * mesmo princípio da página de Cores. Se a paleta mudar, a página muda junto.
 */
const r = (fg: string, bg: string) => `${contraste(fg, bg).toFixed(2)}:1`

/** Uma linha da tabela de equivalência. */
function Eq({ mui, nosso, nota }: { mui: string; nosso: string; nota: React.ReactNode }) {
  return (
    <tr>
      <td><code>{mui}</code></td>
      <td><code className="doc-mono-brand">{nosso}</code></td>
      <td>{nota}</td>
    </tr>
  )
}

export default function GuiaMuiPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="As 18 telas do iSafe são MUI, e nenhuma vai ser reescrita num fim de semana. Os dois convivem — de propósito."
      >
        Conviver com o MUI
      </Titulo>

      <Secao titulo="Primeiro: por que não é big bang">
        <P>
          No iSafe, <strong>43 arquivos importam <code>@mui/material</code></strong> — as 18
          telas e mais 25 componentes. Reescrever isso de uma vez significa uma branch de meses,
          um merge impossível e um dia em que o CRM inteiro está meio quebrado. A alternativa
          não é heroica, é chata: os dois vivem juntos e você troca tela por tela.
        </P>
        <P>
          Isso funciona porque <strong>nada colide</strong>. Todo CSS daqui é prefixado
          com <code>amb-</code> (<code>.amb-btn</code>, <code>.amb-selo</code>) e o MUI gera
          classes <code>.Mui*</code> / <code>.css-*</code>. São dois espaços de nome que não
          se enxergam. Um <code>&lt;Button&gt;</code> nosso dentro de um{' '}
          <code>&lt;Dialog&gt;</code> do MUI funciona hoje, sem adaptador.
        </P>
        <Aviso>
          A biblioteca não tem provider, não tem runtime de estilo e não tem contexto global.
          É CSS com variáveis. Ela não tem como brigar com o MUI porque não existe nada para
          brigar — só arquivos de estilo lidos pelo navegador.
        </Aviso>
      </Secao>

      <Secao titulo="O risco real: as duas paletas divergirem">
        <P>
          O problema da convivência não é técnico, é visual. Se o MUI tem uma ideia de "azul da
          marca" e a gente tem outra, a tela migrada pela metade fica com dois cianos quase
          iguais — e "quase igual" é pior que diferente, porque parece defeito.
        </P>
        <P>
          A saída é ter <strong>uma fonte só</strong>: o <code>createTheme</code> do MUI passa
          a ser alimentado pelos nossos tokens. Aí a tela que ainda é MUI e a que já é{' '}
          <code>@amboni/ui</code> puxam a cor do mesmo lugar, e migrar deixa de ter cor de
          "antes e depois".
        </P>
        <Bloco lang="jsx">{`import { construirTema } from '@amboni/tokens'
import { createTheme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material/styles'

export function makeTheme(mode: PaletteMode) {
  const t = construirTema('isafe', mode)   // 'isafe' | 'vear'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.color.brand.solid,
        dark: t.color.brand.solidHover,
        contrastText: t.color.text.onBrand,
      },
      success: { main: t.color.success.solid, contrastText: t.color.text.onBrand },
      warning: { main: t.color.warning.solid, contrastText: t.color.text.onBrand },
      error:   { main: t.color.danger.solid,  contrastText: t.color.text.onBrand },
      info:    { main: t.color.info.solid,    contrastText: t.color.text.onBrand },
      background: { default: t.color.bg, paper: t.color.surface },
      text: {
        primary: t.color.text.primary,
        secondary: t.color.text.secondary,
        disabled: t.color.text.muted,
      },
      divider: t.color.border.default,
    },
    shape: { borderRadius: 10 },        // = --amb-raio-md
  })
}`}</Bloco>
        <Aviso tipo="warn">
          <code>construirTema</code> devolve <strong>hex</strong>, não <code>var(--amb-…)</code>.
          Isso é de propósito e importa aqui: o MUI calcula cor derivada (hover, borda, ripple)
          com <code>alpha()</code> e <code>darken()</code>, e essas funções não sabem ler uma
          variável CSS — elas precisam do valor. Passar <code>var(--amb-color-brand-solid)</code>
          para o <code>createTheme</code> quebra em silêncio: o botão pinta, o hover some.
          <br />
          <br />
          A consequência prática: trocar de tema no MUI exige refazer o tema em JS
          (<code>makeTheme(mode)</code> + <code>ThemeProvider</code>), enquanto os componentes
          daqui só precisam do atributo no <code>&lt;html&gt;</code>. Enquanto os dois
          coexistirem, você mantém os dois caminhos — <strong>e é este o custo real de não
          migrar de uma vez</strong>.
        </Aviso>
      </Secao>

      <Secao titulo="A história do #0FA6BE (esta é real)">
        <P>
          O <code>theme.ts</code> do iSafe já faz o que está acima — na mão, e com um comentário
          de 12 linhas explicando o porquê. Vale contar, porque é exatamente o problema que os
          tokens existem para resolver.
        </P>
        <P>
          O ciano da marca iSafe é o <code>#0FA6BE</code>. Ele era o{' '}
          <code>primary.main</code>. E o MUI usa <code>primary.main</code> para duas coisas
          ao mesmo tempo: <strong>fundo de botão</strong> e <strong>cor de texto em destaque</strong>.
          Nas duas, o resultado medido foi:
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Combinação</th>
                <th>Onde aparecia</th>
                <th className="doc-num">Contraste</th>
                <th>AA (4,5:1)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span style={{ background: '#0FA6BE', color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>Salvar</span></td>
                <td>Botão primário, em produção, por meses</td>
                <td className="doc-num">{r('#ffffff', '#0FA6BE')}</td>
                <td><span className="doc-pill doc-pill--bad">REPROVA</span></td>
              </tr>
              <tr>
                <td><span style={{ background: '#fff', color: '#17B9D0', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>R$ 1.994</span></td>
                <td><code>primary.light</code> como texto (AdvancedDetail)</td>
                <td className="doc-num">{r('#17B9D0', '#ffffff')}</td>
                <td><span className="doc-pill doc-pill--bad">REPROVA</span></td>
              </tr>
              <tr>
                <td><span style={{ background: '#106B81', color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>Salvar</span></td>
                <td>O que está lá hoje</td>
                <td className="doc-num">{r('#ffffff', '#106B81')}</td>
                <td><span className="doc-pill doc-pill--ok">PASSA</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          <strong>A marca não mudou.</strong> O <code>#0FA6BE</code> continua vivo no{' '}
          <code>theme.ts</code>, num campo chamado <code>brandVivid</code>, usado onde é
          decoração — barra de gráfico, ponto colorido, preenchimento — e onde ninguém precisa
          ler texto por cima. O que mudou foi só o papel de <em>fundo de texto</em>.
        </P>
        <P>
          Nos tokens, essa mesma decisão é estrutural em vez de manual: a marca do iSafe é{' '}
          <code>cyan[500] = #0FA6BE</code>, e <code>brand.solid</code> no tema claro é{' '}
          <code>cyan[700] = #106B81</code>. O mesmo número que alguém teve que descobrir no
          escuro, medindo, sai de graça — e o teste não deixa regredir.
        </P>
        <Aviso>
          <strong>Identidade não vale mais que legibilidade — mas as duas cabem.</strong> Quem
          escolhe a cor da marca costuma ter a melhor visão da sala. O teste não tem esse
          privilégio.
        </Aviso>
      </Secao>

      <Secao titulo="Migrar uma tela">
        <P>
          A ordem que dá menos trabalho, na prática:
        </P>
        <P>
          <strong>1. Ligue o tema primeiro.</strong> Antes de trocar um componente sequer, faça
          o <code>createTheme</code> beber dos tokens (acima) e ponha os dois atributos no{' '}
          <code>&lt;html&gt;</code>. A tela continua 100% MUI, mas já está na paleta certa.
          Se algo ficar estranho, ficou estranho aqui — com um <code>git revert</code> de um
          arquivo, não de trinta.
        </P>
        <P>
          <strong>2. Comece pelas folhas.</strong> <code>Chip</code>, <code>Skeleton</code>,{' '}
          <code>CircularProgress</code> não têm estado nem filhos. Trocar é mecânico e o
          diff é legível.
        </P>
        <P>
          <strong>3. Deixe <code>Box</code>, <code>Typography</code> e <code>Grid</code> por
          último</strong> — ou para nunca. Não temos equivalente (ver abaixo), e eles são
          justamente os mais usados. Tentar resolvê-los primeiro é a forma mais rápida de a
          migração travar.
        </P>
        <FacaNaoFaca
          faca={{
            titulo: 'Uma tela inteira por vez, até o fim',
            texto: 'A tela migrada some do inventário e não volta. O progresso é contável: 3 de 28.',
          }}
          naoFaca={{
            titulo: 'Trocar só os botões de todas as telas',
            texto: 'Toda tela fica meio-a-meio e nenhuma fica pronta. Você perde a única métrica que importa (telas concluídas) e não dá para reverter nada em separado.',
          }}
        />
      </Secao>

      <Secao titulo="Tabela de equivalência">
        <P>
          As props mudam de nome — a biblioteca é escrita em português, como os dois produtos
          que ela serve. A coluna da direita é onde mora a diferença de comportamento; ler ela
          economiza mais tempo que ler a do meio.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>MUI</th><th>@amboni/ui</th><th>O que muda de verdade</th></tr>
            </thead>
            <tbody>
              <Eq
                mui="<Button variant='contained'>"
                nosso="<Button variant='primary'>"
                nota={<>
                  <code>contained</code> → <code>primary</code>, <code>outlined</code> →{' '}
                  <code>secondary</code>, <code>text</code> → <code>ghost</code>. O padrão daqui
                  é <code>secondary</code>: a primária se pede.{' '}
                  <strong>E o <code>type</code> padrão é <code>button</code></strong>, não{' '}
                  <code>submit</code> — dentro de um <code>&lt;form&gt;</code> o comportamento
                  muda.
                </>}
              />
              <Eq
                mui="<Button startIcon={} endIcon={}>"
                nosso="<Button iconLeft={} iconRight={}>"
                nota={<>Só troca de nome. Sem texto dentro, o botão vira quadrado sozinho —
                não existe prop <code>icon</code>.</>}
              />
              <Eq
                mui="<IconButton>"
                nosso="<Button iconLeft={} aria-label>"
                nota={<>Não existe componente separado. E o <code>aria-label</code> não é
                opcional: em dev, o console avisa se faltar.</>}
              />
              <Eq
                mui="<TextField label erro helperText>"
                nosso="<CampoForm> + <Campo>"
                nota={<>
                  <strong>Vira dois componentes.</strong> O <code>CampoForm</code> leva{' '}
                  <code>label</code>, <code>ajuda</code>, <code>erro</code>; o{' '}
                  <code>Campo</code> é o input. <code>helperText</code> se divide em{' '}
                  <code>ajuda</code> (apoio) e <code>erro</code> (string = inválido).
                </>}
              />
              <Eq
                mui="<InputAdornment position='start'>"
                nosso="prefixo / sufixo / iconeEsq / iconeDir"
                nota={<>São props do <code>Campo</code>, não componentes. <code>prefixo</code>{' '}
                para "R$", <code>iconeEsq</code> para ícone.</>}
              />
              <Eq
                mui="<Chip label='Entregue' />"
                nosso="<Selo>Entregue</Selo>"
                nota={<><strong>Se você lê e não mexe, é Selo.</strong>{' '}
                <code>label</code> vira <code>children</code>, e é obrigatório.{' '}
                <code>color</code> → <code>tom</code>.</>}
              />
              <Eq
                mui="<Chip onDelete={} />"
                nosso="<Etiqueta removivel onRemover={}>"
                nota={<><strong>Se dá para remover ou clicar, é Etiqueta.</strong> Um filtro
                aplicado é Etiqueta; um status é Selo. É a confusão mais comum da dupla.</>}
              />
              <Eq
                mui="<Dialog open onClose>"
                nosso="<Dialogo aberto onFechar titulo>"
                nota={<>
                  <code>titulo</code> é <strong>obrigatório</strong> (é o nome acessível). Some
                  o trio <code>DialogTitle</code>/<code>DialogContent</code>/
                  <code>DialogActions</code>: viram <code>titulo</code>, <code>children</code> e{' '}
                  <code>rodape</code>.
                </>}
              />
              <Eq
                mui="<Snackbar> + estado na página"
                nosso="<ProvedorAvisos> + useAviso()"
                nota={<>
                  Deixa de ser componente e vira <strong>chamada</strong>:{' '}
                  <code>avisos.sucesso('Cliente salvo')</code>. Sem{' '}
                  <code>useState</code> de <code>open</code> em cada página. Provider uma vez na
                  raiz.
                </>}
              />
              <Eq
                mui="<Table> + TableHead/Row/Cell"
                nosso="<Tabela colunas linhas chaveLinha>"
                nota={<>
                  <strong>Vira declarativo</strong> — você descreve as colunas, não escreve o{' '}
                  <code>&lt;tr&gt;</code>. <code>chaveLinha</code> é obrigatório de propósito
                  (índice de array causa bug de linha errada ao ordenar). Traz esqueleto,
                  ordenação e seleção junto.
                </>}
              />
              <Eq
                mui="<Skeleton variant='text'>"
                nosso="<Esqueleto variante='texto'>"
                nota={<><code>rectangular</code> → <code>retangulo</code>,{' '}
                <code>circular</code> → <code>circulo</code>. Ganha <code>linhas</code> para
                vários parágrafos de uma vez.</>}
              />
              <Eq
                mui="<CircularProgress />"
                nosso="<Giro />"
                nota={<>Tem <code>rotulo</code> (o que está carregando) e{' '}
                <code>centralizado</code>.</>}
              />
              <Eq
                mui="<LinearProgress value />"
                nosso="<Progresso valor rotulo>"
                nota={<><code>indeterminado</code> no lugar de{' '}
                <code>variant='indeterminate'</code>.</>}
              />
              <Eq
                mui="<Switch /> + <FormControlLabel>"
                nosso="<Interruptor label>"
                nota={<>Um componente só — o <code>label</code> é prop e é obrigatório.
                Escreva o estado ligado ("Enviar dicas"), não a ação ("Ligar envio").</>}
              />
              <Eq
                mui="<Checkbox /> + <FormControlLabel>"
                nosso="<Caixa label>"
                nota={<><code>indeterminate</code> → <code>indeterminado</code>.</>}
              />
              <Eq
                mui="<Select> + <MenuItem>"
                nosso="<Selecao opcoes valor onChange>"
                nota={<>
                  <strong>Opções viram dado, não filhos.</strong> E o{' '}
                  <code>onChange</code> entrega o valor direto, não o evento —{' '}
                  <code>onChange={'{'}v ={'>'} setX(v){'}'}</code>. Tem <code>buscavel</code>.
                </>}
              />
              <Eq
                mui="<Tooltip title>"
                nosso="<Dica conteudo>"
                nota={<>O filho precisa aceitar foco (<code>&lt;button&gt;</code>, campo).</>}
              />
              <Eq mui="<Alert severity='error'>" nosso="<Alerta tom='perigo' titulo>" nota={<>
                <code>severity</code> → <code>tom</code> (<code>error</code> →{' '}
                <code>perigo</code>, <code>warning</code> → <code>aviso</code>). Só o{' '}
                <code>perigo</code> interrompe o leitor de tela.
              </>} />
              <Eq mui="<Menu> + <MenuItem>" nosso="<Menu> + <ItemMenu>" nota="Mesma ideia, nomes em português." />
              <Eq mui="<Tabs> + <Tab>" nosso="<Abas> + <ListaAbas>/<Aba>/<PainelAba>" nota={<>O painel faz parte do conjunto — o MUI deixa por sua conta.</>} />
              <Eq mui="<Accordion>" nosso="<Acordeao> + <ItemAcordeao>" nota={<>Tem <code>tipo</code> para um-por-vez ou vários.</>} />
              <Eq mui="<Breadcrumbs>" nosso="<Trilha> + <ItemTrilha>" nota="—" />
              <Eq mui="<Pagination>" nosso="<Paginacao>" nota={<>A lógica das reticências sai exportada
                (<code>janelaPaginas</code>) e é testada.</>} />
              <Eq mui="<Drawer>" nosso="<Gaveta lado>" nota={<><code>anchor</code> → <code>lado</code>.</>} />
              <Eq mui="<Card> + <CardContent>" nosso="<Card> + <CardBody>" nota={<>
                <code>elevation</code> vira <code>'flat' | 'raised' | 'floating'</code>, não
                0–24. <code>CardHeader</code> existe nos dois.
              </>} />
              <Eq mui="<Avatar>" nosso="<Avatar>" nota={<>Mesmo nome. Vem com{' '}
                <code>iniciaisDoNome</code> e <code>tomDoNome</code> junto.</>} />
            </tbody>
          </table>
        </div>

        <H3>Selo ou Etiqueta? A regra de 5 segundos</H3>
        <P>
          O <code>Chip</code> do MUI é uma coisa só e faz as duas. Aqui são duas, e a pergunta
          é: <strong>a pessoa criou isso?</strong>
        </P>
        <Demo
          codigo={`// Você LÊ. O sistema decidiu. Read-only.
<Selo tom="sucesso" pontinho>Entregue</Selo>
<Selo tom="perigo" variante="solido">Falhou</Selo>

// Você CRIOU. Dá para tirar.
<Etiqueta removivel onRemover={limpar}>Categoria: iPhone</Etiqueta>`}
        >
          <Selo tom="sucesso" pontinho>Entregue</Selo>
          <Selo tom="perigo" variante="solido">Falhou</Selo>
          <Etiqueta removivel onRemover={() => {}}>Categoria: iPhone</Etiqueta>
        </Demo>

        <H3>TextField vira dois componentes</H3>
        <Demo
          codigo={`// MUI
<TextField label="E-mail" helperText="usamos só para o recibo"
           error={!!erro} helperText={erro} required />

// Aqui — o CampoForm amarra label, ajuda e erro por ARIA
<CampoForm label="E-mail" ajuda="usamos só para o recibo" erro={erro} obrigatorio>
  <Campo type="email" placeholder="voce@empresa.com.br" />
</CampoForm>`}
        >
          <div style={{ width: '100%', maxWidth: 380 }}>
            <CampoForm label="E-mail" ajuda="usamos só para o recibo" obrigatorio>
              <Campo type="email" placeholder="voce@empresa.com.br" />
            </CampoForm>
          </div>
        </Demo>
        <P>
          Parece mais verboso e é — em troca, o <code>htmlFor</code>, o{' '}
          <code>aria-describedby</code> e o <code>aria-invalid</code> saem ligados sem você
          lembrar. No MUI, <code>helperText</code> faz o papel de ajuda e de erro ao mesmo
          tempo; aqui são duas props, porque um leitor de tela precisa saber qual das duas é a
          falha.
        </P>
      </Secao>

      <Secao titulo="O que a gente não tem">
        <P>
          Esta seção existe para você não descobrir no meio da migração. A biblioteca tem 28
          componentes; o MUI tem mais de 100. A lista abaixo sai da contagem real de uso no
          iSafe — "uso hoje" é quantos arquivos importam aquele componente.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>Não temos</th><th>Uso no iSafe hoje</th><th>O que fazer</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>Box</code></td>
                <td className="doc-num">33 arquivos</td>
                <td>
                  <strong>Não vamos ter.</strong> É <code>&lt;div&gt;</code> com props de
                  estilo — um motor de CSS-in-JS inteiro para fazer o que{' '}
                  <code>style</code> e uma classe fazem. Troque por{' '}
                  <code>&lt;div&gt;</code> com as variáveis (<code>var(--amb-espaco-4)</code>).
                </td>
              </tr>
              <tr>
                <td><code>Typography</code></td>
                <td className="doc-num">30 arquivos</td>
                <td>
                  Não temos. Use a tag semântica certa (<code>&lt;h2&gt;</code>,{' '}
                  <code>&lt;p&gt;</code>) com <code>--amb-texto-*</code> e{' '}
                  <code>--amb-peso-*</code>. Ver a página de Tipografia.
                </td>
              </tr>
              <tr>
                <td><code>Grid</code></td>
                <td className="doc-num">11 arquivos</td>
                <td>
                  Não temos e não é falta que se sinta: <code>display: grid</code> nativo com{' '}
                  <code>gap: var(--amb-espaco-4)</code> faz o mesmo sem API para aprender.
                </td>
              </tr>
              <tr>
                <td><code>Divider</code></td>
                <td className="doc-num">12 arquivos</td>
                <td>
                  <code>&lt;hr&gt;</code> ou <code>border-top: 1px solid
                  var(--amb-color-border-default)</code>.
                </td>
              </tr>
              <tr>
                <td><code>Autocomplete</code></td>
                <td className="doc-num">1 arquivo</td>
                <td>
                  <code>&lt;Selecao buscavel&gt;</code> cobre o caso de escolher uma opção de
                  uma lista. <strong>Não cobre</strong> múltipla escolha, criar valor novo nem
                  busca assíncrona. Para esses, fique no MUI.
                </td>
              </tr>
              <tr>
                <td><code>Stepper</code></td>
                <td className="doc-num">1 arquivo</td>
                <td>Fique no MUI. Um componente só para um lugar não paga o custo.</td>
              </tr>
              <tr>
                <td><code>ToggleButtonGroup</code></td>
                <td className="doc-num">2 arquivos</td>
                <td>
                  <code>&lt;GrupoRadio&gt;</code> resolve quando é "escolha uma".
                  Se for multi-seleção, fique no MUI.
                </td>
              </tr>
              <tr>
                <td><code>Slider</code>, <code>Badge</code>, <code>Rating</code>, <code>SpeedDial</code>, <code>Popover</code>, <code>Backdrop</code></td>
                <td className="doc-num">não usados</td>
                <td>Não temos. Não fazem falta hoje — se fizerem, aí a gente conversa.</td>
              </tr>
              <tr>
                <td><code>DatePicker</code>, <code>DataGrid</code>, <code>TreeView</code></td>
                <td className="doc-num">não instalados</td>
                <td>
                  São dos pacotes <code>@mui/x-*</code>, que o iSafe não usa. Se um dia precisar
                  de calendário, instale o pacote específico — não vamos escrever um.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Aviso tipo="warn">
          <strong>Ficar no MUI é uma resposta legítima.</strong> Um <code>Autocomplete</code>{' '}
          com busca assíncrona é meses de trabalho para acertar (teclado, ARIA, virtualização).
          Reescrever isso para "ficar consistente" troca um componente que funciona por um que
          você vai depurar. Migre o que é raso; deixe o que é fundo.
        </Aviso>
      </Secao>

      <Secao titulo="O peso — medido, não estimado">
        <P>
          Os números abaixo saíram de <code>vite build</code> nesta máquina, não de um blog.
          A comparação é do custo <strong>marginal</strong>: quanto cada biblioteca acrescenta
          por cima de um app React que já existe.
        </P>
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>O que</th><th className="doc-num">Bruto</th><th className="doc-num">Gzip</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>React + ReactDOM (a base, dos dois lados)</td>
                <td className="doc-num">190 kB</td>
                <td className="doc-num">59,3 kB</td>
              </tr>
              <tr>
                <td><strong>@amboni/ui</strong> — a biblioteca <em>inteira</em> (JS + CSS)</td>
                <td className="doc-num">144 kB</td>
                <td className="doc-num"><strong>30,1 kB</strong></td>
              </tr>
              <tr>
                <td>MUI — só 8 componentes + <code>createTheme</code></td>
                <td className="doc-num">225 kB</td>
                <td className="doc-num"><strong>68,9 kB</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          Oito componentes do MUI pesam <strong>mais que o dobro</strong> da nossa biblioteca
          completa, com seus 28 componentes. E o MUI cobra por componente: os 8 viram 20 e a
          conta sobe. Aqui, os 21,4 kB de JS são o teto — o resto é CSS, que não cresce por tela.
        </P>
        <P>
          Para calibrar: o bundle do iSafe hoje é um único arquivo de{' '}
          <strong>452 kB gzip</strong> (1,6 MB bruto), com React, MUI, recharts e o app inteiro
          dentro. A biblioteca não vai zerar isso — mas a parte dela é 30 kB, e a do MUI é a
          maior fatia removível.
        </P>
        <Aviso>
          <strong>Peso não é o motivo principal.</strong> É o argumento fácil de medir e o mais
          fraco. O motivo é o <code>#0FA6BE</code> ter ficado ilegível em produção por meses sem
          ninguém notar. Bundle a gente aguenta; botão que não dá para ler, não.
        </Aviso>
      </Secao>

      <Secao titulo="Enquanto os dois convivem">
        <P>
          Um detalhe que economiza uma tarde: o MUI injeta o CSS dele no{' '}
          <code>&lt;head&gt;</code> em tempo de execução, e o nosso é um arquivo importado. Se
          um estilo do MUI vazar por cima de um componente nosso (raro — os prefixos não
          colidem), o culpado é especificidade, não ordem de import. Todos os nossos
          componentes aceitam <code>className</code>, então a saída é local:
        </P>
        <Demo
          codigo={`// className funciona em todos. Sem !important, sem styled().
<Button variant="primary" className="minha-largura">Salvar</Button>`}
        >
          <Button variant="primary">Salvar</Button>
        </Demo>
        <P>
          O que <strong>não</strong> funciona: passar um componente nosso para{' '}
          <code>styled()</code> do MUI esperando que ele entenda o tema do MUI. Ele não entende
          — ele lê as variáveis CSS. Se as duas fontes estiverem alimentadas pelos mesmos
          tokens, isso nunca aparece como problema.
        </P>
      </Secao>
    </>
  )
}
