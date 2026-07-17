import { Secao, P, H3, Bloco, Aviso, Titulo, TabelaProps, FacaNaoFaca } from '../lib/blocos'

export default function GuiaSSRPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="A biblioteca não tem runtime de estilo — então o pior problema de SSR simplesmente não existe aqui. Os outros dois, sim, e este guia é sobre eles."
      >
        SSR e Next.js
      </Titulo>

      <Secao titulo="O problema que você não vai ter: FOUC">
        <P>
          Toda biblioteca de CSS-in-JS (Emotion, styled-components, o <code>sx</code> do MUI) gera
          estilo <strong>em tempo de execução</strong>. No servidor não existe navegador para
          receber essa <code>&lt;style&gt;</code>, então o HTML sai sem ela: a página aparece crua
          por um instante e se pinta quando o JavaScript roda. É o{' '}
          <strong>flash de conteúdo sem estilo</strong>. Resolver isso é uma indústria inteira —
          extração no servidor, provider de cache, <code>useServerInsertedHTML</code>, um
          registry por app.
        </P>
        <P>
          Aqui não existe nada disso, e não porque seja simples: <strong>a biblioteca é CSS puro
          com variáveis</strong>. O estilo é um arquivo <code>.css</code> estático que o bundler
          transforma em <code>&lt;link&gt;</code> no <code>&lt;head&gt;</code>. O navegador não pinta
          nada antes de baixá-lo — é como CSS sempre funcionou. Não há estilo para "extrair" porque
          não há estilo sendo gerado.
        </P>
        <Aviso>
          Isto não é um detalhe de implementação: é a razão de a biblioteca ser um{' '}
          <code>.css</code> em vez de um runtime. O mesmo arquivo serve o iSafe (MUI) e o VEAR
          (Tailwind), funciona em Astro, em PHP, em HTML sem framework — e não precisa de provider
          em lugar nenhum.
        </Aviso>
      </Secao>

      <Secao titulo="Passo 1 — os dois CSS no layout raiz">
        <P>
          No App Router, o lugar é o <code>app/layout.tsx</code>. Uma vez só, nunca dentro de um
          componente:
        </P>
        <Bloco lang="jsx">{`// app/layout.tsx
import '@amboni/tokens/tokens.css'  // as variáveis
import '@amboni/ui/styles.css'      // o estilo dos componentes

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-amb-brand="isafe" data-amb-theme="light">
      <body>{children}</body>
    </html>
  )
}`}</Bloco>
        <P>
          <strong>A ordem importa.</strong> O <code>styles.css</code> lê as variáveis que o{' '}
          <code>tokens.css</code> define. Invertido, os componentes carregam sem cor.
        </P>
        <P>
          No Pages Router, o mesmo par vai no <code>pages/_app.tsx</code>, e os atributos do{' '}
          <code>&lt;html&gt;</code> no <code>pages/_document.tsx</code>.
        </P>
      </Secao>

      <Secao titulo="Passo 2 — 'use client': leia isto antes de instalar">
        <Aviso tipo="warn">
          <strong>Limitação real, verificada no bundle publicado: o <code>@amboni/ui</code> não
          embarca a diretiva <code>'use client'</code>.</strong> O <code>dist/index.js</code> é um
          módulo só, e a primeira linha dele importa <code>useState</code>, <code>useEffect</code> e
          companhia direto do <code>react</code>. Num Server Component, esses hooks não existem —
          então importar <strong>qualquer coisa</strong> do pacote dentro de um Server Component
          quebra, inclusive o <code>Button</code>, que não usa hook nenhum. Isso é uma coisa a
          arrumar na biblioteca, não uma opinião de arquitetura.
        </Aviso>
        <P>
          Enquanto não arrumamos, o contorno é de três linhas e funciona: crie{' '}
          <strong>um módulo cliente seu</strong> que reexporta o que você usa. A diretiva vale para
          o módulo inteiro e para tudo que ele reexporta.
        </P>
        <Bloco lang="ts">{`// components/ui.ts
'use client'

export {
  Button, Campo, CampoForm, Selecao, Caixa, Interruptor,
  Card, CardHeader, CardBody, CardFooter, StatCard, Tabela,
  Dialogo, Gaveta, Alerta, ProvedorAvisos, useAviso, Selo, EstadoVazio,
} from '@amboni/ui'

export type { ButtonProps, Coluna, OpcaoSelecao } from '@amboni/ui'`}</Bloco>
        <Bloco lang="jsx">{`// app/clientes/page.tsx — Server Component, sem 'use client'
import { Button } from '@/components/ui'   // ✅ passa pelo seu módulo cliente
// import { Button } from '@amboni/ui'     // ❌ estoura no build

export default async function Página() {
  const clientes = await buscarClientes()  // roda no servidor, como deve
  return <Tabela linhas={clientes} … />
}`}</Bloco>
        <P>
          O custo é honesto: o que você reexportar vira Client Component. Na prática é o que
          aconteceria de qualquer jeito — <code>Tabela</code>, <code>Selecao</code> e{' '}
          <code>Dialogo</code> têm estado e só existem no cliente. O <strong>dado</strong> continua
          sendo buscado no servidor, que é onde o SSR ganha o jogo.
        </P>

        <H3>Quais componentes são puros, de verdade</H3>
        <P>
          Levantado lendo o <code>import ... from 'react'</code> de cada arquivo, não de memória. É
          o que vale <em>no dia em que esta página foi escrita</em>:
        </P>
        <TabelaProps
          props={[
            { nome: 'Button', tipo: 'puro', descricao: 'Nenhum hook. Só props e um <button>.' },
            { nome: 'Card / CardHeader / CardBody / CardFooter', tipo: 'puro', descricao: 'Superfície e marcação.' },
            { nome: 'StatCard', tipo: 'puro', descricao: 'Todo o cálculo do delta é derivado das props no render.' },
            { nome: 'Alerta', tipo: 'puro', descricao: <>O da tela. O <code>Aviso</code> (toast) é outra história.</> },
            { nome: 'Selo / Etiqueta', tipo: 'puro', descricao: 'Estado e entrada, respectivamente. Nenhum dos dois guarda nada.' },
            { nome: 'Giro / Esqueleto / Progresso', tipo: 'puro', descricao: <><code>Progresso</code> usa <code>useId</code> — que é seguro em SSR, mas ainda assim é hook.</> },
            { nome: 'EstadoVazio', tipo: 'puro', descricao: 'Título, texto, ação.' },
            { nome: 'Paginacao', tipo: 'puro', descricao: <>A lógica das reticências (<code>janelaPaginas</code>) é uma função pura, exportada e testada.</> },
            { nome: 'Gaveta', tipo: 'puro (mas…)', descricao: <>Não usa hook, porém é um <code>Dialogo</code> por dentro — e o Dialogo usa. Cliente na prática.</> },
            { nome: 'Avatar', tipo: 'cliente', descricao: <><code>useState</code> — a imagem que falha cai para as iniciais.</> },
            { nome: 'Tabela · Selecao · Dialogo · Dica · Menu · Abas · Acordeao · Trilha · Aviso', tipo: 'cliente', descricao: 'Estado, efeito ou contexto. Não têm como não ser.' },
            { nome: 'Campo · AreaTexto · Caixa · CampoForm · Interruptor · Radio', tipo: 'cliente', descricao: <>Formulário: <code>useId</code>, <code>useRef</code>, <code>useImperativeHandle</code>.</> },
          ]}
        />
        <Aviso>
          Enquanto o pacote não tiver a diretiva, <strong>esta tabela é informação, não instrução</strong>:
          com um bundle único, nem os puros escapam. Ela vale para entender o custo — e vai valer de
          verdade no dia em que a diretiva existir.
        </Aviso>
      </Secao>

      <Secao titulo="Passo 3 — o tema, e o piscar que ele causa">
        <P>
          O tema são dois atributos no <code>&lt;html&gt;</code>. Sem eles nenhuma variável é
          definida e a tela aparece sem cor — parecendo que a biblioteca quebrou:
        </P>
        <Bloco lang="jsx">{`<html lang="pt-BR" data-amb-brand="isafe" data-amb-theme="dark">`}</Bloco>
        <P>
          Enquanto o tema for fixo, acabou — escreva no layout e siga a vida. O problema começa
          quando ele é <strong>escolha da pessoa</strong>, guardada no <code>localStorage</code>.
        </P>

        <H3>O que dá errado</H3>
        <P>
          O servidor não tem <code>localStorage</code>. Ele chuta <code>light</code>, manda o HTML,
          o navegador pinta claro — e só depois o React hidrata, lê o storage, descobre que era{' '}
          <code>dark</code> e troca. Dois estragos de uma vez:
        </P>
        <P>
          <strong>1. O piscar.</strong> A pessoa que escolheu escuro leva um flash branco na cara a
          cada carregamento. À noite, é exatamente o motivo pelo qual ela escolheu escuro.
        </P>
        <P>
          <strong>2. O hydration mismatch.</strong> Se você renderizar o atributo a partir de um{' '}
          <code>useState</code> que lê o storage, o HTML do servidor e o do cliente divergem, e o
          React reclama no console — ou descarta a árvore inteira e re-renderiza.
        </P>

        <H3>Solução A — script inline antes da hidratação</H3>
        <P>
          O truque é resolver o tema <strong>antes do primeiro pixel</strong>, com JavaScript
          síncrono no <code>&lt;head&gt;</code>. Ele roda antes do React existir, antes de o corpo
          pintar:
        </P>
        <Bloco lang="jsx">{`// app/layout.tsx
const TEMA_INICIAL = \`
  try {
    var salvo = localStorage.getItem('tema')
    var escuro = salvo ? salvo === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-amb-theme', escuro ? 'dark' : 'light')
  } catch (e) {}
\`

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: o script mexe no <html> antes da hidratação, então o
    // React vê um atributo que não estava no HTML do servidor. É a ÚNICA divergência
    // aceitável — e some do escopo por ser exatamente esta tag.
    <html lang="pt-BR" data-amb-brand="isafe" data-amb-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body>{children}</body>
    </html>
  )
}`}</Bloco>
        <P>
          O <code>try/catch</code> não é paranoia: <code>localStorage</code> lança em navegação
          privada em alguns navegadores e quando cookies de terceiros estão bloqueados dentro de um
          iframe. Sem ele, um erro no <code>&lt;head&gt;</code> derruba o carregamento da página
          inteira por causa de um tema.
        </P>

        <H3>Solução B — cookie, lido no servidor</H3>
        <P>
          Sem script inline, sem <code>suppressHydrationWarning</code>, sem divergência nenhuma: o
          servidor já sabe o tema e manda o HTML certo de primeira.
        </P>
        <Bloco lang="jsx">{`// app/layout.tsx
import { cookies } from 'next/headers'

export default async function RootLayout({ children }) {
  const tema = (await cookies()).get('tema')?.value === 'dark' ? 'dark' : 'light'

  return (
    <html lang="pt-BR" data-amb-brand="isafe" data-amb-theme={tema}>
      <body>{children}</body>
    </html>
  )
}`}</Bloco>
        <FacaNaoFaca
          faca={{
            titulo: 'Cookie quando a página já é dinâmica',
            texto: 'Se você já lê sessão/usuário no servidor, o tema entra de carona: HTML certo de primeira, zero piscar, zero divergência.',
          }}
          naoFaca={{
            titulo: 'Cookie numa página estática',
            texto: 'Ler cookie torna a rota dinâmica e mata o cache. Numa landing page estática o script inline é o certo: 4 linhas no head custam menos que perder o CDN.',
          }}
        />

        <H3>Trocar em tempo de execução</H3>
        <Bloco lang="jsx">{`'use client'

export function BotaoTema() {
  function alternar() {
    const raiz = document.documentElement
    const novo = raiz.getAttribute('data-amb-theme') === 'dark' ? 'light' : 'dark'
    raiz.setAttribute('data-amb-theme', novo)
    localStorage.setItem('tema', novo)   // ou document.cookie, na solução B
  }
  return <Button onClick={alternar}>Trocar tema</Button>
}`}</Bloco>
        <P>
          Não precisa recarregar, nem re-renderizar, nem avisar o React. As variáveis CSS
          cascateiam sozinhas — é o navegador fazendo o trabalho. <strong>É outra vantagem de não
          ter runtime de estilo:</strong> num CSS-in-JS, trocar o tema re-renderiza a árvore
          inteira e regenera as classes.
        </P>
      </Secao>

      <Secao titulo="prefers-color-scheme: você precisa traduzir">
        <Aviso tipo="warn">
          <strong>Verificado no <code>tokens.css</code> gerado: não existe nenhum bloco{' '}
          <code>@media (prefers-color-scheme)</code> para tema.</strong> Os temas são só{' '}
          <code>[data-amb-brand="…"][data-amb-theme="…"]</code>. Se você não escrever o atributo,{' '}
          <strong>a preferência do sistema não faz absolutamente nada</strong> — a pessoa com o
          macOS no escuro recebe o tema claro. (O único <code>@media</code> de preferência que existe
          lá é o <code>prefers-reduced-motion</code>, que zera as durações. Esse funciona sozinho.)
        </Aviso>
        <P>
          A decisão por trás disso: <strong>escolha explícita vence preferência do sistema,
          sempre.</strong> Quem clicou em "claro" às três da manhã quer claro — o sistema não sabe
          disso, e um <code>@media</code> no CSS venceria a escolha da pessoa ou entraria em guerra
          de especificidade com ela. Fazendo a leitura em JavaScript, a precedência fica onde deve:
          <em> escolha salva &gt; preferência do sistema &gt; padrão</em>. É exatamente a ordem do
          script inline lá de cima.
        </P>
        <P>Para acompanhar o sistema em tempo real (quem <em>não</em> escolheu nada):</P>
        <Bloco lang="jsx">{`'use client'
import { useEffect } from 'react'

export function SeguirSistema() {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')

    function aplicar() {
      // Escolha explícita manda. Só seguimos o sistema para quem nunca escolheu.
      if (localStorage.getItem('tema')) return
      document.documentElement.setAttribute('data-amb-theme', mq.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  return null
}`}</Bloco>
        <P>
          O <code>useEffect</code> aqui é só para o <em>change</em> — a pintura inicial já foi
          resolvida pelo script inline. Se você deixar a primeira aplicação para o efeito, o piscar
          volta: o efeito só roda depois da hidratação, que é depois da primeira pintura.
        </P>
      </Secao>

      <Secao titulo="Checklist">
        <P>
          <strong>1.</strong> <code>tokens.css</code> antes de <code>styles.css</code>, no{' '}
          <code>app/layout.tsx</code>, uma vez só.
        </P>
        <P>
          <strong>2.</strong> <code>data-amb-brand</code> <em>e</em> <code>data-amb-theme</code> no{' '}
          <code>&lt;html&gt;</code>. Faltando um dos dois, a tela nasce sem cor.
        </P>
        <P>
          <strong>3.</strong> Reexporte o que usar de um módulo seu com <code>'use client'</code> —
          por enquanto o pacote não traz a diretiva.
        </P>
        <P>
          <strong>4.</strong> Tema por escolha? Script inline no <code>&lt;head&gt;</code> (+{' '}
          <code>suppressHydrationWarning</code> no <code>&lt;html&gt;</code>) ou cookie lido no
          servidor. Nunca <code>useState</code> lendo <code>localStorage</code> no render.
        </P>
        <P>
          <strong>5.</strong> <code>prefers-color-scheme</code> só funciona se você traduzir para o
          atributo. O CSS não faz isso sozinho.
        </P>
      </Secao>
    </>
  )
}
