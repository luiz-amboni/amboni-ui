import { Secao, P, H3, Bloco, Aviso, Titulo, TabelaProps, FacaNaoFaca } from '../lib/blocos'

export default function GuiaTypeScriptPage() {
  return (
    <>
      <Titulo
        eyebrow="Guias"
        lead="Os tipos aqui não estão de enfeite. Alguns existem para o compilador reprovar um bug que só apareceria em produção."
      >
        TypeScript
      </Titulo>

      <Secao titulo="Os tipos moram junto do componente">
        <P>
          Não existe <code>@amboni/ui/types</code>, nem um pacote <code>@types/</code> separado.
          Quem importa <code>Button</code> quer <code>ButtonProps</code> na mesma linha:
        </P>
        <Bloco lang="ts">{`import { Button, type ButtonProps } from '@amboni/ui'
import { Tabela, type Coluna, type Ordem } from '@amboni/ui'
import { Selecao, type OpcaoSelecao, type SelecaoRef } from '@amboni/ui'`}</Bloco>
        <P>
          A regra é a mesma para todos: o componente e os tipos dele saem da mesma porta. Se
          um componente existe, o tipo das props dele existe e é exportado.
        </P>

        <H3>Os que você vai importar de verdade</H3>
        <TabelaProps
          props={[
            {
              nome: 'Coluna<T>',
              tipo: 'ColunaCampo<T> | ColunaCalculada<T>',
              descricao: <>A união discriminada da Tabela. É o tipo com mais trabalho por trás — a seção abaixo é sobre ele.</>,
            },
            {
              nome: 'ChaveDeLinha',
              tipo: 'string | number',
              descricao: <>A volta do <code>chaveLinha</code>. Id de banco costuma ser número; slug, string.</>,
            },
            {
              nome: 'Ordem',
              tipo: '{ coluna: string; direcao: Direcao }',
              descricao: <><code>coluna</code> é <code>string</code>, não <code>keyof T</code>: coluna calculada tem id próprio e precisa caber aqui.</>,
            },
            {
              nome: 'OpcaoSelecao',
              tipo: '{ valor: string; rotulo: string; … }',
              descricao: <>Um item da <code>Selecao</code>. <code>valor</code> é o que vai para o banco; <code>rotulo</code> é o que a pessoa lê.</>,
            },
            {
              nome: 'SelecaoRef',
              tipo: 'HTMLSelectElement | HTMLInputElement',
              descricao: <>União: o elemento muda com o modo. Tem seção própria abaixo.</>,
            },
            {
              nome: 'FiacaoCampo',
              tipo: '{ id, aria-describedby, aria-invalid, aria-required }',
              descricao: <>O que o <code>CampoForm</code> entrega quando você usa <code>children</code> como função.</>,
            },
            {
              nome: 'ApiAvisos',
              tipo: '{ mostrar, sucesso, erro, aviso, info, fechar }',
              descricao: <>A volta do <code>useAviso()</code>.</>,
            },
          ]}
        />
      </Secao>

      <Secao titulo="Coluna<T>: a união que não deixa você pedir campo que não existe">
        <P>
          O <code>Coluna&lt;T&gt;</code> é uma união de duas metades, e a diferença entre elas
          é a presença do <code>render</code>:
        </P>
        <Bloco lang="ts">{`// Sem render → a chave TEM que ser um campo de T
interface ColunaCampo<T> {
  chave: Extract<keyof T, string>
  render?: (linha: T) => ReactNode
}

// Com render → a chave é um id livre
interface ColunaCalculada<T> {
  chave: string
  render: (linha: T) => ReactNode   // obrigatório
}

export type Coluna<T> = ColunaCampo<T> | ColunaCalculada<T>`}</Bloco>

        <P>
          O motivo é um bug específico: sem esse aperto, um typo em <code>chave</code> compila,
          a tabela procura um campo que não existe, encontra <code>undefined</code> e imprime um
          traço. <strong>Uma coluna inteira em branco em produção, sem nenhum erro em lugar
          nenhum</strong> — e alguém vai concluir que o dado é que está faltando no banco.
        </P>

        <H3>Caso 1 — coluna de campo real. O typo não compila.</H3>
        <Bloco lang="ts">{`interface Cliente { id: number; nome: string; valor: number }

const colunas: Coluna<Cliente>[] = [
  { chave: 'nome', titulo: 'Cliente', ordenavel: true },
  { chave: 'valorr', titulo: 'Valor', numerico: true },   // ❌ typo
]`}</Bloco>
        <P>O compilador reprova:</P>
        <Bloco lang="text">{`error TS2322: Type '{ chave: string; titulo: string; }' is not assignable to type 'Coluna<Cliente>'.
  Property 'render' is missing in type '{ chave: string; titulo: string; }' but required in type 'ColunaCalculada<Cliente>'.`}</Bloco>

        <Aviso tipo="warn">
          <strong>Leia o erro com calma — ele não diz o que você espera.</strong> Você esperava
          "<code>valorr</code> não existe em <code>Cliente</code>". O que ele diz é que falta o
          <code> render</code>. É a mesma coisa dita pelo outro lado: como <code>'valorr'</code> não
          é campo de <code>Cliente</code>, a primeira metade da união foi descartada; sobrou a
          metade "coluna calculada", e lá o <code>render</code> é obrigatório. Traduzindo para
          português: <em>ou esse campo existe, ou você me explica como calcular a célula</em>.
        </Aviso>

        <H3>Caso 2 — coluna calculada. Aí a chave relaxa.</H3>
        <P>
          "Ações", "Status calculado", "Dias desde a compra": não existe campo com esse nome, e
          não deveria existir. Com <code>render</code>, a <code>chave</code> vira um id livre —
          serve para a key do React e para o <code>onOrdenar</code>:
        </P>
        <Bloco lang="ts">{`const colunas: Coluna<Cliente>[] = [
  { chave: 'nome', titulo: 'Cliente' },
  { chave: 'acoes', titulo: 'Ações', render: (l) => <Button onClick={() => abrir(l)}>Ver</Button> },
  { chave: 'valor', titulo: 'Valor', numerico: true, render: (l) => formatarBRL(l.valor) },
]`}</Bloco>
        <P>
          O preço, honesto: <strong>com <code>render</code>, o typo volta a compilar.</strong>
          <code> {'{ chave: \'valorr\', titulo: \'X\', render: l => l.valor }'}</code> passa — e passa
          certo, porque quem lê o dado agora é o <code>render</code>, onde o <code>l.valor</code> É
          checado. A <code>chave</code> ali é só um nome. A proteção continua onde importa: no
          acesso ao campo.
        </P>

        <FacaNaoFaca
          faca={{
            titulo: 'Sem render quando a célula é o campo cru',
            texto: 'É o caso que o TypeScript consegue proteger. Deixe ele proteger: uma coluna a menos com render é uma chance a mais de o typo ser pego.',
          }}
          naoFaca={{
            titulo: 'render: (l) => l.nome só "por consistência"',
            texto: 'Você acabou de trocar a checagem da chave por um render que não faz nada. Mesmo resultado na tela, menos rede embaixo.',
          }}
        />
      </Secao>

      <Secao titulo="SelecaoRef é uma união — porque são dois elementos">
        <P>
          A <code>Selecao</code> é dois componentes por baixo. No modo padrão ela é um
          <code> &lt;select&gt;</code> nativo; com <code>buscavel</code>, é um combobox cujo campo é um
          <code> &lt;input type="text"&gt;</code>. Não é estilo: são elementos diferentes. O tipo do
          ref conta isso:
        </P>
        <Bloco lang="ts">{`export type SelecaoRef = HTMLSelectElement | HTMLInputElement`}</Bloco>
        <P>
          O que interessa na prática está nos dois lados da união e funciona sem cerimônia:
        </P>
        <Bloco lang="ts">{`const ref = useRef<SelecaoRef>(null)

ref.current?.focus()        // ✅ existe nos dois
ref.current?.value          // ✅ existe nos dois`}</Bloco>
        <P>O que é de um só exige que você diga qual:</P>
        <Bloco lang="ts">{`ref.current?.selectedIndex   // ❌ não compila`}</Bloco>
        <Bloco lang="text">{`error TS2339: Property 'selectedIndex' does not exist on type 'SelecaoRef'.
  Property 'selectedIndex' does not exist on type 'HTMLInputElement'.`}</Bloco>
        <P>Estreite com <code>instanceof</code> — é o jeito honesto, e o único que sobrevive à troca de modo:</P>
        <Bloco lang="ts">{`if (ref.current instanceof HTMLSelectElement) {
  ref.current.selectedIndex = 0
}`}</Bloco>
        <Aviso>
          A tentação é <code>useRef&lt;HTMLSelectElement&gt;</code> e pronto: compila e funciona hoje.
          Amanhã alguém liga <code>buscavel</code> porque a lista cresceu, o ref passa a apontar
          para um <code>&lt;input&gt;</code>, e o <code>.selectedIndex</code> vira <code>undefined</code> em
          silêncio. A união é o compilador te obrigando a decidir isso agora, e não em produção.
        </Aviso>
      </Secao>

      <Secao titulo="Estender um componente nosso">
        <P>
          As props são <code>interface</code> exportada: <code>extends</code> funciona como você
          espera, e as props nativas do elemento vêm junto.
        </P>
        <Bloco lang="ts">{`import { Button, type ButtonProps } from '@amboni/ui'

interface BotaoSalvarProps extends ButtonProps {
  /** Sujo = tem mudança não salva. */
  sujo: boolean
}

export function BotaoSalvar({ sujo, ...rest }: BotaoSalvarProps) {
  // type="submit" explícito: o padrão do nosso Button é "button".
  return <Button type="submit" variant="primary" disabled={!sujo} {...rest} />
}`}</Bloco>
        <P>
          <strong>A ordem do spread é a sua decisão, não um detalhe.</strong> Com{' '}
          <code>{'{...rest}'}</code> por último, quem usa o <code>BotaoSalvar</code> pode passar{' '}
          <code>variant="danger"</code> e vencer o seu padrão. Colocando <code>{'{...rest}'}</code>{' '}
          antes, o seu padrão vence sempre. Nenhum dos dois é errado — escolha e saiba qual
          escolheu.
        </P>
      </Secao>

      <Secao titulo="Omit: quando o HTML já usou o nome">
        <P>
          Dois componentes carregam um <code>Omit</code> na assinatura. Não é firula de tipo: sem
          ele, <strong>o TypeScript recusa a interface inteira</strong> — não a prop, a interface.
        </P>

        <H3>CardHeader: Omit&lt;…, 'title'&gt;</H3>
        <Bloco lang="ts">{`export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  headingLevel?: 2 | 3 | 4 | 5 | 6
}`}</Bloco>
        <P>
          O HTML já tem <code>title</code>: é a dica amarela que aparece ao parar o mouse, e ela só
          aceita <code>string</code>. O nosso <code>title</code> é o <em>título do card</em> e aceita{' '}
          <code>ReactNode</code> — porque um título com um <code>&lt;Selo&gt;</code> ao lado é caso
          diário num CRM. Uma <code>interface</code> não pode redeclarar um membro herdado com
          outro tipo: sem tirar o antigo, o erro é <code>TS2430</code> e nada compila.
        </P>

        <H3>Campo: Omit&lt;…, 'size'&gt;</H3>
        <Bloco lang="ts">{`export interface CampoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: CampoSize   // 'sm' | 'md' | 'lg'
  …
}`}</Bloco>
        <P>
          O <code>&lt;input size&gt;</code> do HTML é a largura <em>em número de caracteres</em> — coisa
          de 1995 que ninguém usa e que nem funciona direito com fonte proporcional. O nosso{' '}
          <code>size</code> é a altura do controle, e é o mesmo <code>size</code> do{' '}
          <code>Button</code>, do <code>Selo</code>, da <code>Selecao</code>. Entre manter a
          coerência da biblioteca e preservar um atributo morto, o atributo morto sai. É o mesmo
          caminho que o MUI seguiu.
        </P>

        <Aviso>
          <strong>O que você perde:</strong> exatamente as duas props removidas, e nada mais.
          Precisa da dica do mouse no cabeçalho de um card? Ela vai no elemento de dentro, ou use
          a <code>&lt;Dica&gt;</code> — que é melhor de qualquer jeito, porque <code>title</code> nativo
          não aparece no toque e some rápido demais para quem lê devagar. Precisa mesmo do{' '}
          <code>size</code> em caracteres? <code>style={'{{ width: \'12ch\' }}'}</code> faz o mesmo, melhor.
        </Aviso>

        <P>
          Outros três omitem por segurança, não por colisão de tipo:{' '}
          <code>Caixa</code> tira <code>type</code> (uma <code>&lt;Caixa type="text"&gt;</code> compilaria
          e destruiria o componente em silêncio), <code>Interruptor</code> tira{' '}
          <code>type</code> e <code>role</code>, e a <code>Selecao</code> tira{' '}
          <code>onChange</code> — porque o dela devolve o <em>valor</em>, não o evento.
        </P>
      </Secao>

      <Secao titulo="cx e o mistério do zero">
        <P>A assinatura do <code>cx</code> tem um <code>0</code> solto no meio, e não é frouxidão:</P>
        <Bloco lang="ts">{`export function cx(...partes: Array<string | 0 | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}`}</Bloco>
        <P>
          O <code>&&</code> do JavaScript não devolve booleano: devolve <em>o operando</em>. Então{' '}
          <code>linhas && 'tem-linhas'</code> vale <code>0</code> quando <code>linhas</code> é zero —
          não <code>false</code>. Mesma coisa com <code>itens.length && 'x'</code>, que é o jeito
          mais natural de escrever a condição.
        </P>
        <Bloco lang="ts">{`cx('amb-tabela', linhas.length && 'amb-tabela--cheia')   // ✅ com o 0 no tipo
cx('amb-tabela', !!linhas.length && 'amb-tabela--cheia') // o que você teria que escrever sem ele`}</Bloco>
        <P>
          Sem o <code>0</code> na assinatura, o TypeScript reprova o uso natural e empurra todo
          mundo para o ternário ou para o <code>!!</code>. <strong>Três componentes tropeçaram
          nisso no mesmo dia</strong> — quando três lugares independentes escrevem o mesmo
          "erro", o errado é a assinatura, não os três. Em tempo de execução o{' '}
          <code>filter(Boolean)</code> já descartava o zero desde sempre; o tipo é que estava
          mentindo.
        </P>
        <P>
          <code>number</code> inteiro fica de fora <strong>de propósito</strong>. Isto não compila:
        </P>
        <Bloco lang="text">{`error TS2345: Argument of type '3' is not assignable to parameter of type 'string | false | 0 | null | undefined'.`}</Bloco>
        <P>
          Porque <code>cx(altura)</code> é bug, não intenção — ninguém quer a classe{' '}
          <code>"3"</code>. O tipo é o único lugar onde dá para separar "o zero que caiu de um{' '}
          <code>&&</code>" de "um número que veio parar aqui por engano".
        </P>
      </Secao>
    </>
  )
}
